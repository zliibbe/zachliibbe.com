# Using Semgrep MCP to Audit My Website's Security (And What I Found)

*Published: TBD*  
*Tags: security, semgrep, mcp, static-analysis, web-development*  
*Category: Development*

## Why I Decided to Audit My Own Website

As developers, we often spend so much time building new features that we forget to examine what we've already built. My personal portfolio site (zachliibbe.com) had grown organically over months—new API integrations, blog system, chat features—but I'd never done a comprehensive security review.

That changed when I discovered the Semgrep Model Context Protocol (MCP) server. Here's how I used it to audit my own website, what vulnerabilities I found, and the specific steps I took to fix them.

## What is Semgrep MCP?

Before diving into my audit, let me explain what made this approach special. Semgrep is a powerful static analysis tool that finds bugs and security vulnerabilities by pattern matching in your code. The Model Context Protocol (MCP) integration allows AI tools like Claude to run Semgrep scans and intelligently analyze the results.

This means instead of just getting a list of findings, I could:
- Get contextual explanations of each vulnerability
- Receive prioritized recommendations
- Understand the business impact of each issue
- Get specific fix suggestions tailored to my codebase

## Setting Up Semgrep MCP

The setup was surprisingly straightforward. Here's exactly what I did:

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install semgrep-mcp
uvx semgrep-mcp --help  # Test installation

# Add to Claude Code MCP configuration
claude mcp add --scope project semgrep -- uvx semgrep-mcp
```

The beauty of the MCP approach is that it integrated directly with my development workflow through Claude Code, making the security audit feel natural rather than like a separate, tedious task.

## The Audit Results: A Reality Check

When I ran the comprehensive security scan, here's what Semgrep found:

### Summary of Vulnerabilities
- **ERROR (Critical): 2 findings**
- **WARNING (Medium): 2 findings**  
- **INFO (Low): 20 findings**

### The Critical Issues That Made Me Sweat

**1. Hardcoded Secrets in `.env.temp`**
```
Location: .env.temp:23,27
Issue: STRAVA_CLIENT_SECRET="4d29ad162dc1c5c5cbfacb835b34b76a49696161"
       Full VERCEL_OIDC_TOKEN exposed
Risk: Complete account compromise possible
CWE: CWE-798 (Use of Hard-coded Credentials)
```

This was the big one. I had created a "temporary" environment file during development and completely forgotten it existed. Not only was it in my working directory, but it had been committed to git and pushed to my public GitHub repository.

**The specific impact:**
- Anyone could access my Strava account data
- Vercel deployment tokens were exposed
- This had been public for an unknown period of time

**2. Cross-Site Scripting (XSS) Vulnerabilities**

```typescript
// In src/app/admin/blog/components/MarkdownEditor.tsx:514
<div dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }} />

// In src/app/blog/[slug]/page.tsx:129
<div dangerouslySetInnerHTML={{ __html: post.content }} />
```

The scan identified that I was rendering user-provided content without proper sanitization. While this was in admin-only areas, it still represented a potential XSS vector.

### The "Death by a Thousand Cuts": Format String Issues

The most surprising finding was 20 instances of format string vulnerabilities across my API routes. These looked innocuous but represented a subtle security issue:

```typescript
// Problematic pattern (found in multiple files)
console.error(`[${requestId}] API error: ${response.status}`, errorText);
console.warn(`[${requestId}] Cache error:`, kvError);

// What Semgrep flagged as CWE-134: Format String Injection
// The issue: separate parameters to logging functions
```

While these were "just" logging statements, they could potentially lead to log injection if an attacker controlled the input variables.

## The Remediation Process

### 1. The Nuclear Option: Git History Rewrite

For the exposed secrets, deletion wasn't enough. The secrets were in git history, meaning they'd remain accessible even after removal. I had to rewrite the entire repository history:

```bash
# Install git-filter-repo (safer than git filter-branch)
brew install git-filter-repo

# Create backup (paranoia level: maximum)
git clone . ../zachliibbe.com-backup

# Remove .env.temp from all history
git filter-repo --invert-paths --path .env.temp --force
```

This operation:
- Processed 733 commits in under 2 seconds
- Completely removed the file from all history
- Required a force push to GitHub
- Necessitated immediate credential rotation

### 2. Fixing Format String Vulnerabilities

I systematically updated all console logging statements to use template literals instead of separate parameters:

```typescript
// Before (vulnerable)
console.error(`[${requestId}] API error: ${response.status}`, errorText);

// After (secure)  
console.error(`[${requestId}] API error: ${response.status} - ${errorText}`);

// For complex objects, use JSON.stringify
console.error(`[${requestId}] Error details: ${JSON.stringify({
  message: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  name: error instanceof Error ? error.name : undefined,
})}`);
```

This pattern was applied across:
- `src/app/api/strava/activities/route.ts` (7 fixes)
- `src/app/api/strava/latest/route.ts` (6 fixes)
- `src/app/api/feed/books/route.ts` (1 fix)
- `src/lib/strava/api.ts` (1 fix)
- `src/lib/strava/auth.ts` (1 fix)
- Several other API routes and utilities

### 3. Implementing Comprehensive Security Headers

To prevent future XSS and other attacks, I enhanced my Next.js configuration with security headers:

```javascript
// next.config.js additions
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.strava.com; frame-ancestors 'none';"
        },
        {
          key: 'X-XSS-Protection', 
          value: '1; mode=block'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ]
}
```

These headers provide defense-in-depth against:
- Cross-site scripting (XSS) attacks
- Clickjacking attempts  
- Unnecessary browser feature access
- Man-in-the-middle attacks

## The Power of AI-Assisted Security Analysis

What made this audit particularly valuable wasn't just finding the vulnerabilities—it was the intelligent analysis provided by the MCP integration. Instead of raw Semgrep output, I received:

### Contextual Risk Assessment
```
Risk Level: Critical
CWE: CWE-798 (Use of Hard-coded Credentials), CWE-321 (Use of Hard-coded Cryptographic Key)
OWASP: A07:2021 - Identification and Authentication Failures

Impact: These hardcoded secrets could allow unauthorized access to your Strava account and Vercel deployment environment.
```

### Prioritized Action Items
The AI correctly identified that:
1. Secret exposure required immediate attention (CRITICAL)
2. Format string issues needed systematic fixing (MEDIUM)  
3. Security headers should be implemented (HIGH PRIORITY)
4. XSS vulnerabilities could be addressed later (MEDIUM, admin-only)

### Implementation Guidance
Rather than just "fix the vulnerability," I received specific code patterns and configuration examples tailored to my Next.js setup.

## Metrics: Before and After the Security Review

| Vulnerability Type | Before | After | Status |
|-------------------|--------|-------|--------|
| **Critical** | 2 | 0 | ✅ Eliminated |
| **Medium** | 2 | 2 | ⚠️ Deferred (XSS in admin) |
| **Low** | 20 | 0 | ✅ Eliminated |
| **Dependencies** | 0 | 0 | ✅ Clean |

**Total security score improvement: 92% reduction in findings**

## Lessons Learned and Recommendations

### 1. Automated Security Scanning Should Be Continuous
This audit revealed issues that had existed for months. Integrating Semgrep into CI/CD would have caught them immediately:

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
```

### 2. The .gitignore Isn't Enough
My `.gitignore` had `.env` but not `.env.*` patterns. The comprehensive pattern should be:

```gitignore
# Environment variables
.env*
!.env.example
.env.local
.env.*.local
.env.temp*
```

### 3. Security Headers Are Low-Effort, High-Impact
Adding comprehensive security headers took 15 minutes but significantly improved the security posture against entire classes of attacks.

### 4. Static Analysis + AI = Game Changer
Traditional security scanning gives you findings. AI-enhanced scanning gives you:
- Risk prioritization
- Business impact analysis  
- Implementation roadmaps
- Educational context

## The ROI of This Security Audit

**Time invested:** ~4 hours total
- Setup and scanning: 30 minutes
- Analysis and planning: 1 hour
- Implementation: 2 hours
- Documentation: 30 minutes

**Value delivered:**
- Eliminated critical secret exposure
- Fixed 20 potential log injection points
- Implemented comprehensive security headers
- Created reproducible security process
- Gained deep understanding of codebase security posture

**Cost of not doing it:** Potential account compromise, data breach, reputation damage

## Tools and Resources Used

- **Semgrep MCP Server**: Static analysis with AI interpretation
- **git filter-repo**: Safe git history rewriting
- **OWASP security headers**: Industry-standard protection
- **Next.js security features**: Framework-level security controls
- **Claude Code with MCP**: AI-assisted development workflow

## Next Steps: Building a Security-First Culture

This audit was just the beginning. My next security initiatives include:

1. **Pre-commit hooks** for secret detection
2. **Automated dependency scanning** with Dependabot
3. **Regular penetration testing** of public endpoints
4. **Security training** for any future contributors
5. **Incident response plan** for security issues

## Final Thoughts

The biggest takeaway from this security audit wasn't the specific vulnerabilities I found—it was realizing how easy it is to accumulate security debt over time. Features get shipped, technical debt grows, and security often takes a backseat to functionality.

The Semgrep MCP integration made security analysis feel like a natural part of development rather than a separate, overwhelming task. By combining powerful static analysis with AI interpretation, it transformed what could have been a tedious security review into an educational and actionable process.

If you haven't audited your own projects recently, I highly recommend it. You might be surprised by what you find—and even more surprised by how much you learn in the process.

---

*Want to try this on your own codebase? The Semgrep MCP server is free to use and integrates with Claude Code. Start with a basic scan and see what secrets might be hiding in your repository.*

**Resources:**
- [Semgrep MCP Documentation](https://github.com/semgrep/mcp)
- [git filter-repo Guide](https://github.com/newren/git-filter-repo/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)