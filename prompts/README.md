# Prompts

This folder preserves approved prompts used to generate code, architecture, tests, review output, or repository AI configuration.

The rule comes from `REQUIREMENT.md` NFR-07 and the AI usage policy in `README.md`: prompts that materially shape project artifacts must be committed with the work they produced.

## Rules

- Add a prompt only after team approval.
- Reuse an existing approved prompt when it covers the task.
- Update prompts through review instead of changing them ad hoc in a local chat.
- Commit the prompt file together with, or referenced by, the PR that used it.
- Keep secrets, credentials, private tokens, and personal data out of prompts.

## Naming convention

Use `NN-short-description.md`, numbered in approval order.

Examples:

- `01-review-branch.md`
- `02-create-rest-endpoint.md`
- `03-create-react-component-test.md`

## File template

Use `TEMPLATE.md` for new prompts.
