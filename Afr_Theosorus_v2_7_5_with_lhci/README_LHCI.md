# Lighthouse CI for Verse & Vlam

### Local
```bash
npm run lhci:install
npm run lhci:run
# reports => ./reports/lhci
```

### GitHub Actions
- Workflow: `.github/workflows/lhci.yml`
- Artifacts: **lighthouse-reports** (download from Actions run)

### Config
- `lighthouserc.json`: 3 runs per page, mobile preset, budgets enforced via `lighthouse-budget.json`.
- Targets: index, play, booklet, challenges, gallery.

Tip: set `LHCI_GITHUB_APP_TOKEN` secret for GitHub status checks (optional).
