# Prompts

This folder preserves prompts used to generate code, architecture, tests, review output, or repository AI configuration. Each file must state whether it is approved or a proposal awaiting team review.

The rule comes from `REQUIREMENT.md` NFR-07 and the AI usage policy in `README.md`: prompts that materially shape project artifacts must be committed with the work they produced.

## Rules

- A prompt authorized by the requesting user may be recorded as a proposal alongside local work prepared for review. Mark team approval as pending; do not treat the request as approval from all teammates.
- Only adopt a prompt as a shared approved workflow after team approval, as required by NFR-07. Preserve existing approval metadata when editing historical records; a changed prompt needs fresh review.
- Reuse an existing approved prompt when it covers the task.
- Update prompts through review instead of changing them ad hoc in a local chat.
- Commit the prompt file together with, or referenced by, the PR that used it.
- Keep secrets, credentials, private tokens, and personal data out of prompts.

## Naming convention

Keep existing `NN-short-description.md` filenames. For new proposals, use `YYYY-MM-DD-short-description.md` to avoid competing branches choosing the same sequence number. Do not rename historical prompts just to normalize naming.

Examples:

- `01-review-branch.md`
- `02-create-rest-endpoint.md`
- `03-create-react-component-test.md`

## File template

Use `TEMPLATE.md` for new prompts.

For session continuity, link the relevant prompt from `docs/ai/tasks/<ticket>.md`. Keep implementation progress in that handoff, not in reusable prompt text.
