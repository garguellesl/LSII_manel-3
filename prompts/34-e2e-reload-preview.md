# Reopen the mobile discussion preview after reload

**Approval status:** Pending team review
**Request authorization:** User request to fix Pull Request CI job 138586694970
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Focused Playwright E2E correction
**Provider:** GitHub Copilot

## Prompt

Fix the failing GitHub Actions job "Pull Request CI / e2e (pull_request)". Analyze the Actions logs, identify the root cause of the failure, and implement a fix. Job ID: 138586694970.

## Notes

The failed assertion runs after a page reload in portrait mode. Reopen the full discussion preview before asserting that the deeply nested reply remains available; do not change the preview's runtime behavior.
