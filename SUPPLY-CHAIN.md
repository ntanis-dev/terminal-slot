# Supply-chain security

This repository uses the ntanis.dev secure pnpm baseline: pnpm 11.15.1 is pinned, direct dependencies use exact versions, new package versions must mature for 14 days, exotic transitive sources are blocked, and the committed lockfile is revalidated during frozen installs.

Package lifecycle scripts are denied by default. Any dependency allowed to execute install-time code must be reviewed and approved as an exact package version; updates do not inherit that permission. Project-owned `preinstall`, `install`, and `postinstall` scripts are forbidden in favor of explicit, intentional bootstrap commands.

CI pins actions to immutable commit SHAs, verifies the policy and registry signatures, rejects high-severity advisories, runs scheduled fail-closed OSV scans, and creates a CycloneDX production SBOM. Renovate may propose exact updates only after the same cooldown and never automerges them.

```sh
pnpm install --frozen-lockfile
pnpm run security:check
pnpm run security:signatures
pnpm run security:vulnerabilities
pnpm run security:sbom
```

These controls reduce exposure and improve traceability. They do not replace source review, least-privilege credentials, isolated builds, platform signing, or runtime sandboxing.
