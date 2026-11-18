# Run CI on Forgejo Actions

This fork is hosted on Forgejo, so the pull request CI workflow moved from `.github/workflows/ci.yml` to `.forgejo/workflows/ci.yml`. The jobs and steps are unchanged except one. The runner resolves a bare `uses:` against this Forgejo instance, which mirrors `actions/checkout` but not `oven-sh/setup-bun`, so that step now points at `https://github.com/oven-sh/setup-bun@v2`.

Forgejo reads only `.forgejo/workflows` once that directory exists, so the other GitHub workflows (`benchmark.yml` and `docker-publish.yml`) stay in `.github/workflows` and do not run here. Migrating them was out of scope.

This change is not tracked upstream. Upstream runs on GitHub. Preserve it when syncing with upstream, and carry any upstream edits to `.github/workflows/ci.yml` over to `.forgejo/workflows/ci.yml`.
