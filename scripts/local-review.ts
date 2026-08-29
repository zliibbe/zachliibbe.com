import { spawnSync } from 'node:child_process';

const MAX_DIFF_CHARS = 60_000;
const SHA_RE = /^[0-9a-f]{40}$/i;
const { BASE_SHA, HEAD_SHA } = process.env;

function getDiff(baseSha: string, headSha: string): string {
  const result = spawnSync(
    'git',
    [
      'diff',
      baseSha,
      headSha,
      '--',
      '*.ts',
      '*.tsx',
      '*.js',
      '*.mjs',
      '*.cjs',
      '*.css',
      '*.json',
      ':(exclude)*.lockb',
      ':(exclude)package-lock.json',
      ':(exclude)*.d.ts',
      ':(exclude).serverless/**',
    ],
    { maxBuffer: 10 * 1024 * 1024 }
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git diff failed: ${result.stderr?.toString()}`);
  }

  return result.stdout.toString();
}

function reviewWithClaudeCode(diff: string): string {
  const truncated = diff.length > MAX_DIFF_CHARS;
  const diffContent = truncated
    ? `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated]`
    : diff;

  const prompt = `You are a senior code reviewer for a Next.js / TypeScript / React portfolio site.

Review the \`git diff\` piped in on stdin for genuine bugs only. Focus on:
- Logic errors and off-by-one mistakes
- Null / undefined access that could throw at runtime
- Missing await on async calls
- React hook rule violations
- Incorrect or missing TypeScript types that hide real errors
- Security issues (XSS, exposed secrets, unvalidated input)
- CSS that would break layout or cause inaccessibility

Do NOT comment on:
- Code style or formatting (Biome handles this)
- Naming conventions
- Missing comments or documentation
- Subjective architectural preferences
- Anything that is clearly intentional

If you find no bugs, respond with exactly: "No bugs found."

Otherwise respond with a markdown list. For each bug:
- **File & area**: short description of the location
- **Issue**: what the bug is and why it matters
- **Fix**: a concise suggested fix

Be brief and high-signal. Only report bugs you are confident about.`;

  // Strip ANTHROPIC_API_KEY so the CLI falls back to the claude.ai
  // subscription login instead of metered API billing.
  const { ANTHROPIC_API_KEY: _unused, ...childEnv } = process.env;

  const result = spawnSync('claude', ['-p', prompt], {
    input: diffContent,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    env: childEnv,
  });

  if (result.error) {
    throw new Error(
      `Failed to run Claude Code CLI: ${result.error.message}. Is "claude" installed and on PATH?`
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `Claude Code CLI exited ${result.status}: ${result.stderr}`
    );
  }

  return result.stdout.trim();
}

function main() {
  if (!BASE_SHA || !HEAD_SHA) {
    throw new Error('Missing required env vars: BASE_SHA, HEAD_SHA');
  }
  if (!SHA_RE.test(BASE_SHA) || !SHA_RE.test(HEAD_SHA)) {
    throw new Error(
      `Invalid SHA values: BASE_SHA=${BASE_SHA} HEAD_SHA=${HEAD_SHA}`
    );
  }

  const diff = getDiff(BASE_SHA, HEAD_SHA);

  if (!diff.trim()) {
    console.log('Bug Bot: no relevant code changes — skipping review.');
    return;
  }

  console.log(`Bug Bot: reviewing diff (${diff.length} chars) locally...`);
  const review = reviewWithClaudeCode(diff);

  // The model sometimes prefaces its verdict with a sentence or two of
  // reasoning even when told to respond with exactly "No bugs found." --
  // check the concluding line rather than requiring an exact full-string
  // match, so a strayed preamble doesn't get treated as a real finding.
  const lastLine = review
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .pop();

  // Guard against fail-open: real findings are required (by the system
  // prompt) to be a markdown list of "- **File & area**:" items, so their
  // presence overrides a last line that happens to read "No bugs found."
  // Anchored to actual list-item syntax at line start, not just the
  // substring, so prose merely mentioning the phrase (plausible when the
  // reviewed diff is this file, which contains that literal) doesn't count.
  const hasListedFinding = /^-\s*\*\*File & area\*\*:/m.test(review);

  if (lastLine === 'No bugs found.' && !hasListedFinding) {
    console.log('Bug Bot: No bugs found.');
    return;
  }

  console.error('\nBug Bot found potential issues:\n');
  console.error(review);
  console.error(
    '\nFix the issues above, or run `git push --no-verify` to skip this check.'
  );
  process.exit(1);
}

main();
