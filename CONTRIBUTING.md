# Contributing to `@zethictech/react-native-update-gate`

Thanks for taking the time to contribute! This guide explains how to set up your
dev environment, the PR workflow, and the release process.

## Local development

```sh
git clone https://github.com/ZethicTech/react-native-update-gate.git
cd react-native-update-gate
yarn install
yarn typecheck   # TypeScript strict — must pass
yarn test        # Jest — must pass (33 tests)
yarn build       # Produces lib/ via react-native-builder-bob
```

To test changes inside a real RN app:

```sh
# In the consumer app's package.json, point at your local clone:
"react-native-update-gate": "file:/abs/path/to/react-native-update-gate"

# Then in that app:
yarn install
yarn start --reset-cache
```

Metro picks up the package's `src/` via the `react-native` field in `package.json`,
so you don't need to rebuild `lib/` while iterating.

## The contribution flow

1. **Fork** this repo from <https://github.com/ZethicTech/react-native-update-gate>.
2. **Branch** off `main` with a descriptive name:
   - `feat/<short-description>` for new features
   - `fix/<short-description>` for bug fixes
   - `chore/<short-description>` for refactors, deps, CI
   - `docs/<short-description>` for documentation changes
3. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add flexible-flow Android publish`
   - `fix: prevent banner re-render loop on AppState change`
   - `chore: bump Node CI to 24`
   - `docs: clarify theme prop merging order`
4. **Push** your branch to your fork.
5. **Open a Pull Request** against `main`. Fill in the PR template completely.

A maintainer will review. CI must be green and at least one Code Owner approval
is required before merge. We use squash-merge to keep the history linear.

## Coding standards

- **TypeScript strict mode**. Run `yarn typecheck` before pushing — any errors
  fail CI.
- **No `any`** unless absolutely necessary (and document why).
- **Comments**: default to none. Only write a comment when the *why* is
  non-obvious. Don't restate what the code does — names already do that.
- **JSDoc** only on the public API surface (exported functions/types) and only
  for properties whose meaning isn't obvious from the name.
- **Tests required**: every new logic addition in `src/` needs a corresponding
  test in `__tests__/`. UI components need at least a render test; pure
  functions need exhaustive case coverage.
- **No new dependencies** without justification — keep the install footprint
  minimal. The current runtime dep is just `compare-versions`.

## Native code changes

- **Android (Kotlin)**: must compile with Kotlin 1.9.x against the Play App
  Update SDK 2.x. Run `yarn android` from the `example/` app on a real device
  to verify.
- **iOS**: there is intentionally no native iOS code — the iOS flow is pure RN
  + `Linking`. If you have a strong case for adding native iOS code, open an
  issue for discussion first.

## Releases

Releases are cut by maintainers, **not by contributors**. The flow:

1. Your PR merges to `main`.
2. A maintainer creates a `vX.Y.Z` tag on `main`.
3. The tag push triggers the `Release` GitHub Actions workflow.
4. The workflow runs all checks, builds, and **pauses for human approval** at
   the `npm-publish` environment gate.
5. A maintainer approves; the workflow publishes to npm via Trusted Publishing
   (OIDC) — no token involved.
6. CHANGELOG is updated as part of the release PR.

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR` — breaking API changes
- `MINOR` — new features, backwards-compatible
- `PATCH` — bug fixes only

## Reporting bugs / asking questions

- **Bug**: open a [bug report issue](https://github.com/ZethicTech/react-native-update-gate/issues/new?template=bug_report.yml).
  Include RN version, package version, target platform, and a minimal reproduction.
- **Feature request**: open a [feature request issue](https://github.com/ZethicTech/react-native-update-gate/issues/new?template=feature_request.yml).
  Describe the *problem* you're trying to solve, not just the solution.
- **Question / usage help**: please use
  [GitHub Discussions](https://github.com/ZethicTech/react-native-update-gate/discussions),
  not Issues.
- **Security vulnerability**: see [`SECURITY.md`](./SECURITY.md). Do **not** open a public issue.

## Code of Conduct

This project follows the [Contributor Covenant 2.1](./CODE_OF_CONDUCT.md).
By participating, you agree to abide by its terms.

## License

By submitting a contribution, you agree that your work will be licensed under
the project's [MIT License](./LICENSE).
