# Restore curated video tags

**Approval status:** Pending team review
**Request authorization:** User approved the presented plan and execution on 2026-11-24.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** One-off data restoration script and validation decisions
**Provider:** Codex

## Prompt

> Hola, queiro que mires las tags que tenemos para los videos, como veras hay demaasiadas, asi que tu trabajo es eliminar todas, y crear las que estan dentro del archivo tags-backup-before-manual-20261118-092828.json dentro de ese archivo tambien te explica como tinese que relacionar lso videos con las tags nuevas, cuando acabes me das una lista de videos que no tienen ninguna tag, generame un planm antes de hacer nada, para comprender como trabajamos leete el constitution.md el agents.md y todos los docuemntos dentro de /specs/sprint-4

> vale dale hazlo y luego me pasas la lista definitiva

## Notes

The approved plan includes backup, isolated rehearsal, atomic replacement, initialization protection and final untagged-video reporting. Current video IDs differ from the backup; reconcile only exact unique titles. This is data maintenance, not a permanent restriction on future tag creation. Private data and credentials remain outside tracked artifacts.
