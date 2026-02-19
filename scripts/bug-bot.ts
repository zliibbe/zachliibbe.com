import { execSync } from 'child_process';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_DIFF_CHARS = 60_000;

const {
  ANTHROPIC_API_KEY,
  GITHUB_TOKEN,
  PR_NUMBER,
  PR_TITLE,
  PR_BODY,
  REPO,
  BASE_SHA,
  HEAD_SHA,
} = process.env;

function getDiff(): string {
  try {
    return execSync(
      `git diff ${BASE_SHA} ${HEAD_SHA} \
        -- '*.ts' '*.tsx' '*.js' '*.mjs' '*.cjs' '*.css' '*.json' \
        ':(exclude)*.lockb' \
        ':(exclude)package-lock.json' \
        ':(exclude)*.d.ts' \
        ':(exclude).serverless/**'`,
      { maxBuffer: 10 * 1024 * 1024 }
    ).toString();
  } catch (err) {
    console.error('Failed to get diff:', err);
    return '';
  }
}

async function reviewWithClaude(diff: string): Promise<string> {
  const truncated = diff.length > MAX_DIFF_CHARS;
  const diffContent = truncated
    ? diff.slice(0, MAX_DIFF_CHARS) + '\n\n[diff truncated]'
    : diff;

  const prompt = `You are a senior code reviewer for a Next.js 15 / TypeScript / React portfolio site.

PR title: ${PR_TITLE || '(none)'}
PR description: ${PR_BODY || '(none)'}

Review the diff below for genuine bugs only. Focus on:
- Logic errors and off-by-one mistakes
- Null / undefined access that could throw at runtime
- Missing await on async calls
- React hook rule violations
- Incorrect or missing TypeScript types that hide real errors
- Security issues (XSS, exposed secrets, unvalidated input)
- CSS that would break layout or cause inaccessibility

Do NOT comment on:
- Code style or formatting (Prettier handles this)
- Naming conventions
- Missing comments or documentation
- Subjective architectural preferences
- Anything that is clearly intentional

If you find no bugs, respond with exactly: "No bugs found."

Otherwise respond with a markdown list. For each bug:
- **File & area**: short description of the location
- **Issue**: what the bug is and why it matters
- **Fix**: a concise suggested fix

Be brief and high-signal. Only report bugs you are confident about.

\`\`\`diff
${diffContent}
\`\`\``;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content?.[0]?.text?.trim() ?? 'No response from Claude.';
}

async function postReview(body: string): Promise<void> {
  const [owner, repo] = (REPO || '').split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({ body, event: 'COMMENT' }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${err}`);
  }
}

async function main() {
  const diff = getDiff();

  if (!diff.trim()) {
    console.log('No relevant code changes — skipping review.');
    return;
  }

  console.log(`Reviewing diff (${diff.length} chars)...`);
  const review = await reviewWithClaude(diff);
  console.log('Claude response:', review);

  const noBugs = review === 'No bugs found.';
  const commentBody = noBugs
    ? '**Bug Bot:** No bugs found.'
    : `**Bug Bot review:**\n\n${review}`;

  await postReview(commentBody);
  console.log('Review posted.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
