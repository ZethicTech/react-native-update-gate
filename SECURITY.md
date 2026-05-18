# Security policy

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately via GitHub's Security Advisory mechanism:

1. Go to <https://github.com/ZethicTech/react-native-update-gate/security/advisories/new>
2. Fill out the advisory form with reproduction steps, impact assessment, and
   any suggested mitigations.

We aim to:

- Acknowledge your report within **72 hours**.
- Provide a fix or mitigation timeline within **7 days**.
- Ship a patch within **14 days** for high-severity issues (RCE, supply-chain,
  data exfiltration). Lower-severity issues are batched into the next minor
  release.

After a patch is published, we publicly disclose the advisory and credit you (unless
you prefer anonymity).

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | ✅ Active           |
| < 0.2   | ❌ End-of-life      |

Only the latest minor version receives security patches. Upgrading is recommended.

## Supply-chain assurances

- All published versions on npm include **provenance attestations** linking each
  tarball back to the exact GitHub Actions run and commit that built it.
- Publishes use **npm Trusted Publishing (OIDC)** — there is no long-lived `NPM_TOKEN`
  in the repo that could leak.
- The publish workflow requires manual approval in a protected GitHub Environment
  before any package reaches npm.

Verify any installed copy:

```sh
npm install @zethictech/react-native-update-gate
npm view @zethictech/react-native-update-gate dist
# Confirm the `provenance` field is present and the GitHub Actions URL matches
# the source commit.
```
