# When I Accidentally Committed Secrets to Git (And How I Fixed It)

_Published: TBD_  
_Tags: security, git, devops, lessons-learned_  
_Category: Development_

## The Realization That Made My Stomach Drop

Picture this: You're deep in a feature branch, making solid progress on a security review. You run a comprehensive scan of your codebase and suddenly see it in the output—your Strava Client Secret and Vercel OIDC Token, sitting there in plain text in a `.env.temp` file.

But here's the kicker—you realize this file has been committed to your repository. Your **public** repository. On GitHub. For who knows how long.

That sinking feeling? Yeah, I just lived it.

## How Did This Even Happen?

As a mid-level developer, I thought I knew better. I had my `.gitignore` set up, I understood the basics of secret management, and I've preached about environment variable security to junior developers. But here's what happened:

1. **The "temp" file trap**: I created `.env.temp` during development, thinking the name made it obviously temporary
2. **Insufficient .gitignore patterns**: My `.gitignore` had `.env` but not `.env.*` patterns
3. **The batch commit**: During a productive coding session, I used `git add .` without carefully reviewing what was staged

The result? A commit containing:

- Strava Client Secret: `4d29ad162dc1c5c5cbfacb835b34b76a49696161`
- Full Vercel OIDC Token with JWT payload
- Other potentially sensitive configuration values

## The Immediate Damage Assessment

When you discover exposed secrets, your first instinct is to delete the file and commit the fix. **Don't do this yet.** Here's why:

1. **Git history preservation**: The secrets remain in your repository history
2. **Public exposure**: If pushed to GitHub, the secrets are already indexed and potentially scraped
3. **Search engines**: Security scanners and bad actors actively crawl GitHub for exposed secrets

The deletion only removes the current version—every historical commit still contains the full secret data.

## The Nuclear Option: Rewriting Git History

After researching options, I realized I needed to completely remove the file from the entire repository history. This meant rewriting git history using `git filter-repo`.

### Why git filter-repo Instead of git filter-branch?

```bash
# Old school approach (don't use this)
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.temp'

# Modern, safer approach
git filter-repo --invert-paths --path .env.temp --force
```

`git filter-repo` is:

- **Faster**: 10-50x performance improvement over `filter-branch`
- **Safer**: Better handling of edge cases and references
- **More thorough**: Properly handles tags, remotes, and complex histories

### The Process (And My Concerns)

Here's exactly what I did, along with my worries at each step:

```bash
# 1. Install git-filter-repo
brew install git-filter-repo

# 2. Create a backup (paranoia level: maximum)
git clone . ../zachliibbe.com-backup

# 3. The big moment - rewrite history
git filter-repo --invert-paths --path .env.temp --force
```

**My concerns during this process:**

- **"Am I about to destroy my entire repository?"** - The `--force` flag was terrifying
- **"Will this break my branch references?"** - Spoiler: it removes the origin remote automatically
- **"What if I have merge conflicts when I force push?"** - Valid fear, but necessary
- **"Will this affect other developers?"** - Since it's my personal project, less concern here

### What Actually Happened

The tool worked flawlessly:

- **733 commits processed** in under 2 seconds
- **Origin remote automatically removed** (safety feature)
- **Complete file elimination** from all history
- **Branch integrity maintained**

## Verification and Cleanup

After the history rewrite, verification was crucial:

```bash
# Verify the file is gone from all history
git log --all --grep=".env.temp" --oneline
# Should return empty

# Check that branches are intact
git branch -a
# All branches present

# Confirm repository size reduction
du -sh .git/
# Slightly smaller due to removed file content
```

## The Aftermath: Force Push and Security Measures

The scary part: force pushing the rewritten history to GitHub.

```bash
# Re-add the origin remote
git remote add origin git@github.com:zliibbe/zachliibbe.com.git

# The nuclear force push
git push -f origin security-review
```

**Post-cleanup security measures:**

1. **Rotated all exposed credentials** immediately
2. **Enhanced .gitignore** with comprehensive patterns:
   ```
   .env*
   .env.local
   .env.*.local
   .env.temp*
   ```
3. **Added pre-commit hooks** for secret scanning
4. **Implemented proper secret management** with Vercel's environment variables

## Lessons Learned: Prevention is Better Than Cure

### 1. Better .gitignore Patterns

Instead of just `.env`, use:

```
# Environment variables
.env*
!.env.example
.env.local
.env.*.local
```

### 2. Pre-commit Secret Scanning

Tools like `detect-secrets` or `git-secrets` can catch this before it becomes a problem:

```bash
# Install detect-secrets
pip install detect-secrets

# Initialize baseline
detect-secrets scan --baseline .secrets.baseline

# Add to pre-commit hook
detect-secrets-hook --baseline .secrets.baseline
```

### 3. Never Use "Temp" Files for Secrets

If you need temporary environment files:

- Use `.env.example` with placeholder values
- Use local environment variable export
- Use secure note-taking applications

### 4. Regular Security Audits

Had I been running regular security scans (like with Semgrep), this would have been caught much earlier.

## The Silver Lining

This mistake led to several positive outcomes:

1. **Comprehensive security review** of my entire codebase
2. **Implementation of proper security headers** and best practices
3. **Better understanding of git internals** and history management
4. **Improved development workflow** with better tooling
5. **A valuable lesson** that cost nothing but time and stress

## Key Takeaways for Fellow Developers

1. **Assume everything in your repository is public** - because it might be
2. **Git history rewriting is scary but manageable** with the right tools
3. **Prevention through tooling** beats remediation every time
4. **Have a incident response plan** for when (not if) this happens
5. **The git filter-repo tool** is your friend for history rewrites

## Final Thoughts

As developers, we make mistakes. The difference between junior and mid-level (and beyond) isn't that we stop making mistakes—it's that we get better at:

- Catching them sooner
- Fixing them properly
- Learning from them systematically
- Building better processes to prevent them

If you've never committed secrets to git, you either haven't been developing long enough, or you have better security habits than most of us. Either way, I hope my experience helps you avoid (or properly handle) this situation.

Remember: the goal isn't perfection—it's resilience, rapid response, and continuous improvement.

---

_Have you ever had to rewrite git history for security reasons? Share your experience in the comments below._
