# Tasks — Sprint 4

[Spec](spec.md) | [Plan](plan.md) | [Handoff](../../docs/ai/tasks/sprint4-specs.md).
Original authorisation: prepare Sprint 4 documents only. Later authorised slices and historical work recognised below have their own evidence; unchecked tasks remain pending.

## Task sizing and evidence rules

Each checkbox is one 10–20 minute **active-work estimate**, assuming stated dependencies and a configured environment. It is not a guarantee or a whole-feature estimate. If discovery reveals a larger change, stop the timebox, record the finding and append stable child IDs such as T07.05a/T07.05b before continuing; do not widen or mark the parent complete. Apply the same rule to every newly found persistence defect. Preserve identifiers and actual evidence.

Within a group, each task depends on its preceding task by default; the first depends on P00 and the group dependencies below. This is a conservative single-owner execution order, not a claim all modules must be built serially. Explicit independent work may proceed after agreed contracts. P13/P14 integration waits for both independent state implementations. Early P17 baseline must run before optimisations even though P17 is numbered last.

Each task records a concrete Done when condition and a pending evidence slot. Replace pending with changed path, exact command/manual steps, result, date and RF/AC mapping; coding alone does not prove a case passes. Future runtime tasks require shared owner/reviewer/paths recorded first. Neither cloud deployment nor PR publication is authorised in this turn.

## P00 — Shared preparation and contracts

Dependencies: none; implementation ownership is not yet assigned.

- [ ] T00.01 — Record owner/reviewer and shared symbols for the first implementation slice.
  - Estimate: 15–20 min. Depends on: none.
  - Done when: Tracker entry identifies precise paths and dependencies; no ownership is inferred.
  - Evidence: pending.
- [ ] T00.02 — Freeze catalogue/page/error examples.
  - Estimate: 15–20 min. Depends on: T00.01.
  - Done when: One example covers combined q/tag/sort/audience and empty/error replies.
  - Evidence: pending.
- [ ] T00.03 — Freeze collection/subscription permission examples.
  - Estimate: 15–20 min. Depends on: T00.02.
  - Done when: Own private lists and public creator DTOs are distinguished.
  - Evidence: pending.
- [ ] T00.04 — Freeze player/queue identity contract.
  - Estimate: 15–20 min. Depends on: T00.03.
  - Done when: Route navigation preserves playId and queue-to-player integration is explicit.
  - Evidence: pending.
- [ ] T00.05 — Reserve additive migration numbers with the team.
  - Estimate: 15–20 min. Depends on: T00.04.
  - Done when: Numbers are checked against current migrations and active work.
  - Evidence: pending.
- [ ] T00.06 — Agree benchmark environment and provisional targets.
  - Estimate: 15–20 min. Depends on: T00.05.
  - Done when: Client/host/dataset/load/budgets and cold-start treatment are recorded.
  - Evidence: pending.
- [ ] T00.07 — Record UI locale and accessibility contracts.
  - Estimate: 15–20 min. Depends on: T00.06.
  - Done when: Namespaces, fallback, widths, focus and screen-reader coverage are explicit.
  - Evidence: pending.
 
## P01 — Complete the Shared Cloud Database and Application Environment

Requirement: RF-01 (all AC). Design: [P01](plan.md#p01). Integration dependencies: none.

- [x] T01.01 — Inventory one source database's migration versions and table counts.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: A redacted inventory identifies that source and missing exports.
  - Evidence: Historical evidence, 2026-11-18: [003-shared-database RF-3 inventory](../003-shared-database/tasks.md#validaci%C3%B3n-por-requisito), active source V1-V8 and row counts. Other PC explicitly deferred.
- [x] T01.02 — Inventory media references for the same source.
  - Estimate: 15–20 min. Depends on: T01.01.
  - Done when: Missing files and managed/imported ownership are listed.
  - Evidence: Historical evidence, 2026-11-18: [003 T3](../003-shared-database/tasks.md#ejecuci%C3%B3n) records 146 media references checked in 224 backed-up files; [source topology](../003-shared-database/plan.md#contexto-t%C3%A9cnico-comprobado) distinguishes writable managed media and read-only imports. Active source only.
- [x] T01.03 — Document the shared host and one-writer topology.
  - Estimate: 15–20 min. Depends on: T01.02.
  - Done when: Frontend, backend, DB and persistent media locations are distinguished without secrets.
  - Evidence: [Shared database runbook](../../docs/SHARED_DATABASE.md#videos-avatars-and-serving-the-application) and [003 plan](../003-shared-database/plan.md): Supabase DB, local backend/frontend delivery and local mounted media are distinguished; one writer per store. Hosted application remains future work.
- [x] T01.04 — Prepare one source backup command and manifest.
  - Estimate: 15–20 min. Depends on: T01.03.
  - Done when: Command uses an external destination and records checksums without credentials.
  - Evidence: Historical evidence, 2026-11-18: [003 T3 and RF-3](../003-shared-database/tasks.md) record external final backup 20261118T084111Z, private manifest/SHA-256 and prepare_final_cutover.py; [backup procedure](../../docs/SHARED_DATABASE.md#preserve-existing-data-before-the-first-switch) documents pg_dump and isolated schema conversion. No private backup copied into Git.
- [x] T01.05 — Launch an isolated restore of that backup.
  - Estimate: 15–20 min. Depends on: T01.04.
  - Done when: Restore job ID and destination are recorded; completion remains pending if running.
  - Evidence: Historical evidence, 2026-11-18: [003 T3](../003-shared-database/tasks.md#ejecuci%C3%B3n) records two successful isolated restores of final backup 20261118T084111Z; not a new restore in this continuation.
- [x] T01.06 — Compare restored table counts against the manifest.
  - Estimate: 15–20 min. Depends on: T01.05.
  - Done when: Differences are recorded and no live data was overwritten.
  - Evidence: Historical evidence, 2026-11-18: [003 T3/T4 and RF-3](../003-shared-database/tasks.md) record all 10 tables matching by counts and row fingerprints; original volumes retained.
- [ ] T01.07 — Check one restored video's file references.
  - Estimate: 15–20 min. Depends on: T01.06.
  - Done when: MP4, thumbnail and avatar resolution are recorded.
  - Evidence: pending.
- [ ] T01.08 — List source-account and ID collisions.
  - Estimate: 15–20 min. Depends on: T01.07.
  - Done when: Each collision has a proposed reconciliation rule; unresolved rows remain pending.
  - Evidence: pending.
- [x] T01.09 — Validate shared Compose settings with synthetic secrets.
  - Estimate: 15–20 min. Depends on: T01.08.
  - Done when: Configuration validation succeeds without printing real values.
  - Evidence: Historical evidence, 2026-11-18: [003 T1/T5](../003-shared-database/tasks.md#ejecuci%C3%B3n), six Compose checks and seven launcher checks with synthetic credentials. Source verified in tooling/database/test_shared_config.py and test_supabase_launcher.py; no tests rerun for this documentation reconciliation.
- [ ] T01.10 — Document persistent volume and HTTPS settings.
  - Estimate: 15–20 min. Depends on: T01.09.
  - Done when: Deployment settings preserve one writer and environment-driven secrets.
  - Evidence: pending.
- [ ] T01.11 — Prepare the deployment runbook.
  - Estimate: 15–20 min. Depends on: T01.10.
  - Done when: Start, readiness, stop and rollback steps preserve DB and media volumes.
  - Evidence: pending.
- [ ] T01.12 — Verify shared reads from the second device.
  - Estimate: 15–20 min. Depends on: T01.11.
  - Done when: A sample record and media file resolve from that device.
  - Evidence: pending.
- [x] T01.13 — Record the restore job result.
  - Estimate: 15–20 min. Depends on: T01.12.
  - Done when: Exit result and reconciliation evidence are attached, or task stays open.
  - Evidence: Historical evidence, 2026-11-18: [003 T3 and RF-3](../003-shared-database/tasks.md) record successful isolated restores and final reconciliation of 10 tables/146 media references; active source only.
- [ ] T01.14 — Reconcile one documented source collision in an isolated copy.
  - Estimate: 15–20 min. Depends on: T01.13.
  - Done when: One account/ID conflict is resolved with related references preserved; repeat as child tasks for other conflicts.
  - Evidence: pending.
- [ ] T01.15 — Prepare the final cutover manifest and write-freeze steps.
  - Estimate: 15–20 min. Depends on: T01.14.
  - Done when: Approved source of truth, restore target, media checksum list and rollback conditions are explicit.
  - Evidence: pending.
- [ ] T01.16 — Launch the authorised final data/media transfer.
  - Estimate: 15–20 min. Depends on: T01.15.
  - Done when: Job reference and frozen source manifest are recorded; target checks prevent overwriting unrelated data.
  - Evidence: pending.
- [ ] T01.17 — Inspect final transfer integrity.
  - Estimate: 15–20 min. Depends on: T01.16.
  - Done when: Row counts, constraints, Flyway history and media checksum comparison match the accepted manifest.
  - Evidence: pending.
- [ ] T01.18 — Configure the shared host app and persistent media mount.
  - Estimate: 15–20 min. Depends on: T01.17.
  - Done when: Existing delivery configuration resolves secrets externally and preserves one writer.
  - Evidence: pending.
- [ ] T01.19 — Launch the separately authorised hosted deployment.
  - Estimate: 15–20 min. Depends on: T01.18.
  - Done when: Deployment job reference and version are recorded without claiming readiness yet.
  - Evidence: pending.
- [ ] T01.20 — Inspect hosted deployment readiness and TLS.
  - Estimate: 15–20 min. Depends on: T01.19.
  - Done when: The shared URL serves DB-backed catalogue and media with the expected deployed version.
  - Evidence: pending.
- [ ] T01.21 — Repeat the shared smoke after hosted restart.
  - Estimate: 15–20 min. Depends on: T01.20.
  - Done when: Two device reads and one managed upload remain accessible after restart.
  - Evidence: pending.

### P01 historical cloud evidence

Reconciled on 22 November 2026 following the user's clarification that the cloud work preceded Sprint 4 planning. Work completed on 18 November in [003-shared-database](../003-shared-database/tasks.md) counts toward RF-01; its date does not require repeating implementation or migration. Checked tasks above reference that historical evidence, rather than new execution. The previous blanket `pending` state was incomplete bookkeeping.

RF-01.AC6 is supported by successful isolated restores; AC7/8/9 have prior configuration, secret-handling and isolated-test evidence. AC1/2/4 have two-instance and restart evidence in an isolated environment plus a real local application connected to Supabase. These results do not establish that all teammates or physical devices use the shared environment. AC3 (cross-device media) and full multi-source AC5 remain incomplete.

The active source was migrated to Supabase with 10 tables compared by row fingerprints, V1–V8 validated, 74 catalogue videos, three HTTP details and six media range responses verified. This is already completed work. T01.15–17 have partial evidence for that database cutover, but their full data/media-transfer scope remains open because media still uses the original local mounts. No remote media transfer is inferred. The account and two videos of the other PC were explicitly deferred by the user; they do not invalidate the completed active-source migration or become mandatory work in this continuation.

T01.07 lacks explicit restored MP4/thumbnail/avatar resolution evidence as one complete case. T01.08/14 need the deferred source's collision inventory/reconciliation before multi-source completion. T01.10/11/18–21 concern the hosted application/media, HTTPS and restart verification. T01.12 requires a real second-device read, not only two isolated application instances. These tasks remain open. No cloud resources, credentials, application code, deployment or database were changed or revalidated live here.

## P02 — Verify Reliable Storage of Registration, Profiles and Uploads

Requirement: RF-02 (all AC). Design: [P02](plan.md#p02). Integration dependencies: P01 for shared verification.

- [ ] T02.01 — Map the registration transaction and duplicate checks.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Existing implementation and one suspected gap are recorded.
  - Evidence: pending.
- [ ] T02.02 — Add a duplicate-registration regression case.
  - Estimate: 15–20 min. Depends on: T02.01.
  - Done when: The case proves one account remains after a repeated registration.
  - Evidence: pending.
- [ ] T02.03 — Add an invalid-registration regression case.
  - Estimate: 15–20 min. Depends on: T02.02.
  - Done when: Required-field failure produces no account.
  - Evidence: pending.
- [ ] T02.04 — Map avatar replacement commit and rollback paths.
  - Estimate: 15–20 min. Depends on: T02.03.
  - Done when: Old/new file handling is documented.
  - Evidence: pending.
- [ ] T02.05 — Add a failed-avatar-replacement regression case.
  - Estimate: 15–20 min. Depends on: T02.04.
  - Done when: Previous image and profile remain unchanged.
  - Evidence: pending.
- [ ] T02.06 — Add an avatar-removal persistence case.
  - Estimate: 15–20 min. Depends on: T02.05.
  - Done when: Reload returns no avatar and the expected fallback.
  - Evidence: pending.
- [ ] T02.07 — Trace one upload from form through storage commit.
  - Estimate: 15–20 min. Depends on: T02.06.
  - Done when: Metadata, pending manifest and publication boundary are identified.
  - Evidence: pending.
- [ ] T02.08 — Add a missing-file upload failure case.
  - Estimate: 15–20 min. Depends on: T02.07.
  - Done when: No broken catalogue item is published.
  - Evidence: pending.
- [ ] T02.09 — Add a repeated-submit upload regression case.
  - Estimate: 15–20 min. Depends on: T02.08.
  - Done when: One logical submission cannot publish two videos.
  - Evidence: pending.
- [ ] T02.10 — Implement the single guard exposed by the repeated-submit test.
  - Estimate: 15–20 min. Depends on: T02.09.
  - Done when: The targeted duplicate-submission case passes.
  - Evidence: pending.
- [ ] T02.11 — Add a restart-recovery case for one pending upload.
  - Estimate: 15–20 min. Depends on: T02.10.
  - Done when: Recovery resolves the isolated pending file consistently.
  - Evidence: pending.
- [ ] T02.12 — Verify account and avatar reads after restart.
  - Estimate: 15–20 min. Depends on: T02.11.
  - Done when: Recorded evidence shows persisted account/profile and accessible image.
  - Evidence: pending.
- [ ] T02.13 — Verify uploaded MP4 and thumbnail from a second browser.
  - Estimate: 15–20 min. Depends on: T02.12.
  - Done when: Both resources resolve for the expected owner.
  - Evidence: pending.
- [ ] T02.14 — Record remaining persistence defects separately.
  - Estimate: 15–20 min. Depends on: T02.13.
  - Done when: Each discovered defect has its own <=20 minute implementation slice and regression case.
  - Evidence: pending.

## P03 — Improve the Main Page UI/UX and Responsive Layout

Requirement: RF-03 (all AC). Design: [P03](plan.md#p03). Integration dependencies: P00 contracts; P16 adapter for translated UI.

- [ ] T03.01 — Sketch the mobile catalogue layout.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Header, search, filters and one-column cards are placed.
  - Evidence: pending.
- [ ] T03.02 — Sketch tablet and desktop grid rules.
  - Estimate: 15–20 min. Depends on: T03.01.
  - Done when: Breakpoints and minimum card widths are documented.
  - Evidence: pending.
- [ ] T03.03 — Adjust header wrapping at 320 px.
  - Estimate: 15–20 min. Depends on: T03.02.
  - Done when: Account and search controls remain reachable.
  - Evidence: pending.
- [ ] T03.04 — Adjust catalogue grid columns.
  - Estimate: 15–20 min. Depends on: T03.03.
  - Done when: Cards fit the specified widths without horizontal overflow.
  - Evidence: pending.
- [ ] T03.05 — Add long-title and missing-thumbnail presentation.
  - Estimate: 15–20 min. Depends on: T03.04.
  - Done when: Both card variants remain readable.
  - Evidence: pending.
- [ ] T03.06 — Define high-contrast semantic colour tokens.
  - Estimate: 15–20 min. Depends on: T03.05.
  - Done when: Text, surfaces, borders and focus colours are named.
  - Evidence: pending.
- [ ] T03.07 — Add high-contrast selection to the existing theme preference.
  - Estimate: 15–20 min. Depends on: T03.06.
  - Done when: A selected value survives reload without breaking light/dark.
  - Evidence: pending.
- [ ] T03.08 — Style catalogue empty and retry states.
  - Estimate: 15–20 min. Depends on: T03.07.
  - Done when: Both states have clear text and a reachable action.
  - Evidence: pending.
- [ ] T03.09 — Add a keyboard test for catalogue controls.
  - Estimate: 15–20 min. Depends on: T03.08.
  - Done when: Search, filter, sort and pagination focus order is asserted.
  - Evidence: pending.
- [ ] T03.10 — Measure catalogue text and focus contrast.
  - Estimate: 15–20 min. Depends on: T03.09.
  - Done when: Measured ratios are recorded for the three modes.
  - Evidence: pending.
- [ ] T03.11 — Check the 320/375 px catalogue layout.
  - Estimate: 15–20 min. Depends on: T03.10.
  - Done when: Evidence records no clipped primary controls.
  - Evidence: pending.
- [ ] T03.12 — Check the 768/1024/1440 px catalogue layout.
  - Estimate: 15–20 min. Depends on: T03.11.
  - Done when: Evidence records grid behaviour and long translated labels.
  - Evidence: pending.

## P04 — Improve the Video Page, Recommendations and Description

Requirement: RF-04 (all AC). Design: [P04](plan.md#p04). Integration dependencies: P12 audience contract; P14 shell contract.

- Verify session isolation, 20-event history window, contextual fallback and portrait top-three comment disclosure alongside the cases below.

- [x] T04.01 — Define recommendation response fields and deterministic order.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Contract includes cap eight, eligibility and stable ID ties.
  - Evidence: VideoRepository.recommendations and VideosControllerTest.
- [x] T04.02 — Write a recommendation exclusion repository case.
  - Estimate: 15–20 min. Depends on: T04.01.
  - Done when: Current, deleted and audience-excluded videos are absent.
  - Evidence: RecommendationTest (PostgreSQL).
- [x] T04.03 — Implement the shared-tag recommendation query slice.
  - Estimate: 15–20 min. Depends on: T04.02.
  - Done when: Tag candidates are bounded and unique.
  - Evidence: RecommendationTest, distinct ranks and eight-row limit.
- [x] T04.04 — Add category/recent fallback selection.
  - Estimate: 15–20 min. Depends on: T04.03.
  - Done when: The ordered result is capped at eight without duplicates.
  - Evidence: SQL category, created_at and id tie-breaks; RecommendationTest.
- [x] T04.05 — Expose the recommendation GET through service and DTO.
  - Estimate: 15–20 min. Depends on: T04.04.
  - Done when: Endpoint delegates and returns an empty list when appropriate.
  - Evidence: VideosControllerTest, HTTP 200 empty and session-bound inputs.
- [x] T04.06 — Add a recommendation client with cancellation.
  - Estimate: 15–20 min. Depends on: T04.05.
  - Done when: A stale response cannot overwrite another video's data.
  - Evidence: useRecommendations.test.ts, aborted older request and ignored stale result.
- [x] T04.07 — Render the recommendation card list.
  - Estimate: 15–20 min. Depends on: T04.06.
  - Done when: Loading, empty and error outputs are distinct.
  - Evidence: Recommendations component and player-page.spec.ts retry case.
- [x] T04.08 — Add desktop two-column player layout.
  - Estimate: 15–20 min. Depends on: T04.07.
  - Done when: Recommendations sit beside a usable player.
  - Evidence: player-page.spec.ts desktop and recommendation navigation.
- [x] T04.09 — Add mobile recommendation stacking.
  - Estimate: 15–20 min. Depends on: T04.08.
  - Done when: The player retains width and cards appear below the main block.
  - Evidence: player-page.spec.ts portrait 320/375 px, top-three comments before cards; comments.spec.ts expands the portrait preview before exercising a deeply nested reply.
- [x] T04.10 — Change description clamp to five lines.
  - Estimate: 15–20 min. Depends on: T04.09.
  - Done when: Collapsed CSS has a five-line limit.
  - Evidence: player-page.spec.ts measures client height divided by rendered line height.
- [x] T04.11 — Detect description overflow after width changes.
  - Estimate: 15–20 min. Depends on: T04.10.
  - Done when: Show more appears only when rendered text exceeds the clamp.
  - Evidence: player-page.spec.ts wide-to-portrait and back.
- [x] T04.12 — Add expand/collapse accessible state.
  - Estimate: 15–20 min. Depends on: T04.11.
  - Done when: Button has matching expanded/controls state and retains focus.
  - Evidence: VideoPlayerPage.test.tsx and keyboard Playwright case.
- [x] T04.13 — Test expansion without playback reset.
  - Estimate: 15–20 min. Depends on: T04.12.
  - Done when: Player instance and playback position are preserved.
  - Evidence: player-page.spec.ts compares DOM identity and media time.
- [x] T04.14 — Check five-line descriptions at narrow and desktop widths.
  - Estimate: 15–20 min. Depends on: T04.13.
  - Done when: Short, long and zoomed examples are recorded.
  - Evidence: player-page.spec.ts five-line example at desktop, portrait and 200% CSS zoom.

Local verification on 2026-11-24: Maven clean verify and JaCoCo passed (207 tests reported, one skipped). Frontend build, lint and all 243 Jest tests passed. All five player Playwright cases passed against the isolated Compose deployment. P12 catalogue controls and audience assignment remain separate. Physical devices and a translated-label matrix were not exercised.

## P05 — Improve the Like/Dislike Interface

Requirement: RF-05 (all AC). Design: [P05](plan.md#p05). Integration dependencies: P03 visual tokens.

- [ ] T05.01 — Define reaction neutral/selected/pending/error styles.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Each state is recognisable without colour alone.
  - Evidence: pending.
- [ ] T05.02 — Apply reaction spacing and touch dimensions.
  - Estimate: 15–20 min. Depends on: T05.01.
  - Done when: Controls fit a narrow screen with large counters.
  - Evidence: pending.
- [ ] T05.03 — Check reaction accessible names and pressed state.
  - Estimate: 15–20 min. Depends on: T05.02.
  - Done when: Names and selected state are exposed to assistive technology.
  - Evidence: pending.
- [ ] T05.04 — Test no-reaction to like.
  - Estimate: 15–20 min. Depends on: T05.03.
  - Done when: Returned count and selection match the mocked server.
  - Evidence: pending.
- [ ] T05.05 — Test like to dislike.
  - Estimate: 15–20 min. Depends on: T05.04.
  - Done when: Only dislike remains selected with correct counts.
  - Evidence: pending.
- [ ] T05.06 — Test active-reaction removal.
  - Estimate: 15–20 min. Depends on: T05.05.
  - Done when: Neither reaction remains selected.
  - Evidence: pending.
- [ ] T05.07 — Test failed reaction mutation.
  - Estimate: 15–20 min. Depends on: T05.06.
  - Done when: Last valid state is restored or reloaded.
  - Evidence: pending.
- [ ] T05.08 — Test delayed response after changing videos.
  - Estimate: 15–20 min. Depends on: T05.07.
  - Done when: The new video's state is not mutated.
  - Evidence: pending.
- [ ] T05.09 — Verify visitor reaction login guidance.
  - Estimate: 15–20 min. Depends on: T05.08.
  - Done when: No write is sent before authentication.
  - Evidence: pending.
- [ ] T05.10 — Check reaction persistence after reload.
  - Estimate: 15–20 min. Depends on: T05.09.
  - Done when: Server state is restored in the controls.
  - Evidence: pending.

## P06 — Improve the Comment Section

Requirement: RF-06 (all AC). Design: [P06](plan.md#p06). Integration dependencies: P03 visual tokens.

- [ ] T06.01 — Adjust comment author/date hierarchy.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Author, timestamp and body are visually distinct.
  - Evidence: pending.
- [ ] T06.02 — Limit visual reply indentation on mobile.
  - Estimate: 15–20 min. Depends on: T06.01.
  - Done when: Deep replies remain readable at 320 px.
  - Evidence: pending.
- [ ] T06.03 — Wrap long comment text and URLs.
  - Estimate: 15–20 min. Depends on: T06.02.
  - Done when: Long tokens do not expand the page width.
  - Evidence: pending.
- [ ] T06.04 — Style comment pending and failure states.
  - Estimate: 15–20 min. Depends on: T06.03.
  - Done when: Draft and retry remain visible.
  - Evidence: pending.
- [ ] T06.05 — Test preservation of a draft after failed submit.
  - Estimate: 15–20 min. Depends on: T06.04.
  - Done when: Text remains available for retry.
  - Evidence: pending.
- [ ] T06.06 — Test editor cancel focus restoration.
  - Estimate: 15–20 min. Depends on: T06.05.
  - Done when: Focus returns to the triggering comment action.
  - Evidence: pending.
- [ ] T06.07 — Test deleted parent rendering.
  - Estimate: 15–20 min. Depends on: T06.06.
  - Done when: Placeholder and existing children remain visible.
  - Evidence: pending.
- [ ] T06.08 — Test rejection of replies to deleted comments.
  - Estimate: 15–20 min. Depends on: T06.07.
  - Done when: Existing backend rule remains intact.
  - Evidence: pending.
- [ ] T06.09 — Check keyboard traversal of one reply thread.
  - Estimate: 15–20 min. Depends on: T06.08.
  - Done when: Like, reply, edit and collapse controls are reachable.
  - Evidence: pending.
- [ ] T06.10 — Check comment layout on tablet.
  - Estimate: 15–20 min. Depends on: T06.09.
  - Done when: Nested content and actions do not overlap.
  - Evidence: pending.

## P07 — Implement Subscriptions to Creators

Requirement: RF-07 (all AC). Design: [P07](plan.md#p07). Integration dependencies: P00 identity/contracts; P16 adapter.

The [SCRUM-48 handoff](../../docs/ai/tasks/scrum-48.md) records the affected areas and migration candidate. Validate the contract with MockMvc and isolated PostgreSQL, including concurrent duplicates, account isolation and a restart. Validate button states with mocked client tests and run the player → subscriptions → creator flow in Chromium.

- [x] T07.01 — Define subscription DTO and endpoint examples.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Own-list privacy and public creator fields are separated.
  - Evidence: The examples in [P07](plan.md#p07) distinguish session state, private collection data and public creator data.
- [x] T07.02 — Write subscription table migration.
  - Estimate: 15–20 min. Depends on: T07.01.
  - Done when: Unique subscriber/creator pair and foreign keys are present.
  - Evidence: `V9__creator_subscriptions.sql` adds the foreign keys, unique pair, self-check and indexes. PostgreSQL restart verifies the creator-deletion cascade.
- [x] T07.03 — Map the subscription entity/repository.
  - Estimate: 15–20 min. Depends on: T07.02.
  - Done when: No controller accesses the repository directly.
  - Evidence: `CreatorSubscription`, `CreatorSubscriptionRepository` and the service use the existing controller/service/repository boundaries.
- [x] T07.04 — Add self-subscription service rejection.
  - Estimate: 15–20 min. Depends on: T07.03.
  - Done when: Same actor and creator are rejected with 400.
  - Evidence: `CreatorSubscriptionsIntegrationTest.authenticatesMutationsAndScopesListAndStateToTheCurrentPrincipal` verifies 400 for self-subscription.
- [x] T07.05 — Implement idempotent subscription insert.
  - Estimate: 15–20 min. Depends on: T07.04.
  - Done when: Repeated PUT keeps one pair.
  - Evidence: The integration tests verify repeated PUT and concurrent service calls keep one pair.
- [x] T07.06 — Implement idempotent subscription removal.
  - Estimate: 15–20 min. Depends on: T07.05.
  - Done when: Repeated DELETE leaves no pair and returns no-content.
  - Evidence: The integration tests verify repeated DELETE returns 204 with no remaining pair.
- [x] T07.07 — Implement own paginated subscription query.
  - Estimate: 15–20 min. Depends on: T07.06.
  - Done when: Identity comes from the principal and ordering is stable.
  - Evidence: `simultaneousSubscribesLeaveOnePairAndAnOrderedPrivatePage` verifies stable ordering and totals across pages.
- [x] T07.08 — Add subscribe/remove controller mappings.
  - Estimate: 15–20 min. Depends on: T07.07.
  - Done when: DTO/status/CSRF policy follows the agreed contract.
  - Evidence: The HTTP integration test verifies POST-independent PUT/DELETE mappings, CSRF, 204, 400, 401, 403 and missing creator handling.
- [x] T07.09 — Add own-list and state controller mappings.
  - Estimate: 15–20 min. Depends on: T07.08.
  - Done when: Unauthenticated callers receive 401 with otherwise valid request context.
  - Evidence: The HTTP integration test verifies the principal, 401 and the private GET cache policy.
- [x] T07.10 — Add subscription client methods.
  - Estimate: 15–20 min. Depends on: T07.09.
  - Done when: Requests reuse auth and API utilities.
  - Evidence: `subscriptionClient` reuses the shared CSRF and credentialed request utilities. The production Chromium test exercises those requests.
- [x] T07.11 — Render subscribe button states.
  - Estimate: 15–20 min. Depends on: T07.10.
  - Done when: Pending/error/selected labels are exposed accessibly.
  - Evidence: `CreatorSubscription.test.tsx` verifies initial loading, pending, selected/unselected state and recovery without a false success.
- [x] T07.12 — Render My subscriptions list.
  - Estimate: 15–20 min. Depends on: T07.11.
  - Done when: Empty and populated responses use public creator links.
  - Evidence: `creator-subscriptions.spec.ts` verifies the populated collection, the correct creator link and the empty state after removal.
- [x] T07.13 — Add public creator summary retrieval.
  - Estimate: 15–20 min. Depends on: T07.12.
  - Done when: DTO exposes no email or private collection data.
  - Evidence: `publicCreatorShowsOnlyPublicFieldsAndItsOwnPaginatedVideos` verifies anonymous access, public biography and exclusion of private fields.
- [x] T07.14 — Add public creator video-list retrieval.
  - Estimate: 15–20 min. Depends on: T07.13.
  - Done when: Only public video summaries are returned with pagination.
  - Evidence: The public creator test verifies both bounded pages and excludes another creator’s video.
- [x] T07.15 — Add a creator navigation destination.
  - Estimate: 15–20 min. Depends on: T07.14.
  - Done when: Subscription cards resolve to the correct creator content.
  - Evidence: Playwright follows the creator link and checks the public video link and hard-reload routing.
- [x] T07.16 — Test subscription uniqueness with PostgreSQL.
  - Estimate: 15–20 min. Depends on: T07.15.
  - Done when: Concurrent duplicate writes retain one relationship.
  - Evidence: Two concurrent calls through independent PostgreSQL transactions leave one pair.
- [x] T07.17 — Test private-list account isolation.
  - Estimate: 15–20 min. Depends on: T07.16.
  - Done when: Another principal cannot retrieve the target user's private list.
  - Evidence: The HTTP integration test verifies isolation across principals, ignored caller-supplied subscriber IDs and successful deletion of only the caller’s pair.

### SCRUM-48 local validation

| Criteria | Passing evidence |
| --- | --- |
| RF-07.AC1–AC3 | HTTP tests exercise create and remove, self-rejection and idempotence; PostgreSQL verifies concurrent uniqueness. |
| RF-07.AC4 | Chromium verifies reload and a fresh sign-in. `PostgreSqlPersistenceTest` verifies persistence across dev and prod restarts. |
| RF-07.AC5–AC6 | Chromium follows a private collection entry to the public creator’s videos; MockMvc checks two accounts and request scoping. |
| RF-07.AC7–AC8 | Jest checks failed writes, selected and pending states, and Spanish, Catalan and English strings. Chromium opens the control by keyboard at 375 px. |

- `mvn -B -o clean verify` passed with Java 21, Testcontainers and JaCoCo. 193 tests passed and the existing Windows symlink test was skipped.
- `npm run build`, `npm run lint` and `npm run test -- --coverage --watchAll=false --ci --runInBand` passed. 236 Jest tests.
- `npm test -- --workers=2` passed all 31 Chromium tests against isolated Compose.
- The initial runs exposed shared test fixtures leaking into the catalogue suite and an ambiguous password locator. Transaction cleanup and exact matching resolve both test issues.
- App-wide language selection remains part of P16. The subscription screens currently use the browser’s locale preference.

## P08 — Sort Search Results by Most Liked and Most Viewed

Requirement: RF-08 (all AC). Design: [P08](plan.md#p08). Integration dependencies: P00 search contract; P12 filter contract; P17 measurements.

- [x] T08.01 — Define the shared search sort allowlist.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: relevance/likes/views/newest/oldest and invalid-value behaviour are documented.
  - Evidence: P08 documents active relevance/likes/views, reserved P09 newest/oldest and controlled 400. Existing English catalogue labels/native controls retained; global P16 locale work is separate.
- [x] T08.02 — Add request parsing for sort.
  - Estimate: 15–20 min. Depends on: T08.01.
  - Done when: Unknown values return 400 and default preserves relevance.
  - Evidence: VideosControllerTest verifies omitted defaults, all active choices, invalid/case-mismatched/date sorts, invalid audience and page offset overflow; existing error DTO is retained.
- [x] T08.03 — Create a known-metrics search fixture.
  - Estimate: 15–20 min. Depends on: T08.02.
  - Done when: Likes/views/ties/zero counts have expected IDs.
  - Evidence: PopularitySearchTest fixture has eight videos with known positive/negative reactions, plays, history, tags and all audience classes in isolated PostgreSQL.
- [x] T08.04 — Add likes aggregate to the search query.
  - Estimate: 15–20 min. Depends on: T08.03.
  - Done when: Counts represent positive ProTube reactions without join multiplication.
  - Evidence: Correlated VideoLike COUNT filters LIKE; positiveLikesOverrideRelevanceAcrossPagesWithStableTiesAndExactTotals verifies dislike exclusion, no multi-tag multiplication and summary counts.
- [x] T08.05 — Add view aggregate to the search query.
  - Estimate: 15–20 min. Depends on: T08.04.
  - Done when: Imported counters remain excluded.
  - Evidence: Correlated VideoPlay COUNT excludes watch history; persistedPlaysOverrideRelevanceAndHistoryIncludingZeros verifies it. VideoImportServiceTest.importedCountersRemainInSourceMetadataAndNeverBecomeProTubeInteractions verifies source JSON is preserved and only metadata registration occurs.
- [x] T08.06 — Implement explicit popularity ordering.
  - Estimate: 15–20 min. Depends on: T08.05.
  - Done when: Selected metric precedes stable ID ties.
  - Evidence: PopularitySearchTest traverses four one-item pages for each metric with ties and zeros, ordering metric DESC then video ID ASC before database limit/offset; relevance regression also passes.
- [x] T08.07 — Share predicates between rows and COUNT.
  - Estimate: 15–20 min. Depends on: T08.06.
  - Done when: Text/tags/audience constraints match totalElements.
  - Evidence: VideoSearchRepositoryImpl shares filters for rows/count. PopularitySearchTest verifies case-normalized tag OR with text AND, exact audiences, unclassified inclusion only in ALL, empty/out-of-range pages, totals and no duplicates.
- [x] T08.08 — Serialize sort in the catalogue client.
  - Estimate: 15–20 min. Depends on: T08.07.
  - Done when: Existing repeated tags and page parameters remain intact.
  - Evidence: app.test.tsx asserts serialized sort/audience, repeated tags, query and page; relevance/ALL preserve omitted API defaults.
- [x] T08.09 — Render the sort selector.
  - Estimate: 15–20 min. Depends on: T08.08.
  - Done when: Selection changes sort and resets page to zero.
  - Evidence: app.test.tsx verifies named native selectors, preservation of filters, reset to page zero, retry and audience-filtered empty state. Chromium confirms focus and no overflow at five widths.
- [x] T08.10 — Synchronise catalogue criteria with the URL.
  - Estimate: 15–20 min. Depends on: T08.09.
  - Done when: Back/forward restores query/tags/audience/sort/page.
  - Evidence: app.test.tsx verifies deep-link initialization, back/forward and pagination; searchCriteria.test.ts verifies round-trip and malformed URL fallback. Chromium verifies reload and back/forward with real requests.
- [x] T08.11 — Test a combined text/tag/popularity request.
  - Estimate: 15–20 min. Depends on: T08.10.
  - Done when: Expected global ordering holds beyond the first page.
  - Evidence: PopularitySearchTest plus e2e/tests/popularity-search.spec.ts verify complete filtered ordering across one-item API pages with stable ties; full command/results below.
- [x] T08.12 — Test stale search-response rejection.
  - Estimate: 15–20 min. Depends on: T08.11.
  - Done when: An older request cannot replace the current results.
  - Evidence: app.test.tsx tests both late success and late rejection after sort changes, verifies abort and preserves newer empty results; existing tag/text stale-response tests pass.

### RF-08 local verification (2026-11-25)

UI follow-up requested on the same date: only All audiences/For children remain in the catalogue selector; old NOT_CHILDREN frontend URLs fall back to ALL. Tags, audience and sorting controls render only on `/`; the player and all other routes retain text search. App tests verify exact choices, login/register/unknown-route visibility and player-to-search transitions. Re-ran `npm run build`, `npm run lint`, and `npm test -- --coverage --watchAll=false --ci`: all passed, 37 suites/257 tests/one snapshot and coverage gates met. Log: `backend/target/rf08-ui-refinement.log`. No backend changes or repeated backend checks; the Chromium results below precede this UI refinement.

Navigation regression follow-up: user observed filters lingering after in-app navigation but disappearing on F5. `localhost:8080` served the current bundle (`index-Dywoekcs.js`); `cd e2e; E2E_BASE_URL=http://localhost:8080 npx playwright test tests/catalog-controls-navigation.spec.ts --workers=1` passed in Chromium. The test clicks a video, Register and Login from `/`, checks each destination has only text search, and uses mocked video API responses so no development records are changed. Directly loaded current code behaves correctly; an already-open tab retains its previous in-memory JavaScript until reloaded. No backend or routing change was indicated by the reproduced case.

Search bar placement follow-up: user restricted text search to catalogue and playback. App now renders it on `/` and numeric `/videos/:id` only; tests cover login, register, profile/avatar settings, upload, new/edit video and unknown routes. The first run revealed `/videos/new` matched a broad video path, so the predicate was narrowed to numeric IDs. Final `cd frontend; npm run build; npm run lint; npm run test -- --coverage --watchAll=false --ci` passed: 37 suites/261 tests/one snapshot and coverage gates. `cd e2e; E2E_BASE_URL=http://localhost:5174 npx playwright test tests/catalog-controls-navigation.spec.ts --workers=1` passed against updated Vite assets, with mocked video API and no development data changes. Backend unchanged and not rerun.

Scope: user-authorized RF-08 on `feat/improve-sorting-video`, baseline `3c266c4` plus local changes; [handoff](../../docs/ai/tasks/rf08-search-sorting.md), [prompt](../../prompts/37-popularity-search.md). T08 completion is local implementation/validation, not sprint-wide completion, shared assignment release, remote CI, peer review or merge. P00 search/error/page contracts and existing P12 V10 classification are reused; audience assignment and date sorts remain separate. Batched SCRUM-58 summaries are preserved; no broad performance benchmark claimed.

- Java 21: `mvn -B -ntp -Dtest=PopularitySearchTest,VideosControllerTest,VideoServiceTest test-compile surefire:test`: 57 passed against isolated PostgreSQL. Initial attempt was blocked by stopped Docker; rerun after starting Docker passed.
- Java 21: `mvn -B -ntp clean verify`: BUILD SUCCESS; 214 tests, zero failures/errors, one existing host-dependent symlink test skipped; all JaCoCo gates met. Maven was invoked via the installed executable because no wrapper/global Maven command exists. Logs retained locally under `backend/target/rf08-backend-verify.log` and `backend/target/rf08-focused-backend.log` (generated, not committed).
- `cd frontend; npm run build; npm run lint; npm run test -- --coverage --watchAll=false --ci`: all passed; 37 suites, 253 tests, one snapshot; configured 75% global coverage gates passed. Focused app/URL run: 33 passed. Local test log: `backend/target/rf08-frontend-tests.log`.
- Isolated runner from e2e/README.md: `docker compose -p protube-e2e -f compose.yaml -f e2e/compose.override.yml --env-file e2e/e2e.env up -d --wait --build` succeeded, with no development database mutation. `cd e2e; npx playwright test tests/popularity-search.spec.ts tests/search.spec.ts --workers=2`: four Chromium tests passed, including real metrics and filtered pagination, source URL reload/history, controlled 400 and visible native controls without horizontal overflow at 320/375/768/1024/1440 px. Only these relevant E2E flows were run, not the full unrelated sprint suite.
- User AC1/2/3/5/6/7/8: PopularitySearchTest and real API E2E. AC4: app tests and E2E. AC9: late success/error tests. AC10: controller tests and E2E. URL/page reset: app tests/URL unit tests/E2E. This maps to the spec's grouped RF-08.AC1–8.
- Remaining external work: team review, remote CI/PR/merge. No deployment to shared/staging environments.

## P09 — Sort Search Results by Newest and Oldest

Requirement: RF-09 (all AC). Design: [P09](plan.md#p09). Integration dependencies: P08 sort parser.

- [ ] T09.01 — Audit the existing publication timestamp.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Creation, import and modification meanings are distinguished.
  - Evidence: pending.
- [ ] T09.02 — Record legacy-date migration policy.
  - Estimate: 15–20 min. Depends on: T09.01.
  - Done when: Unknown dates use a documented deterministic rule without false provenance.
  - Evidence: pending.
- [ ] T09.03 — Write only the required date migration/backfill.
  - Estimate: 15–20 min. Depends on: T09.02.
  - Done when: Existing publication values are preserved.
  - Evidence: pending.
- [ ] T09.04 — Implement newest query ordering.
  - Estimate: 15–20 min. Depends on: T09.03.
  - Done when: Publication descending and ID tie-break are applied before pagination.
  - Evidence: pending.
- [ ] T09.05 — Implement oldest query ordering.
  - Estimate: 15–20 min. Depends on: T09.04.
  - Done when: Publication ascending and ID tie-break are applied before pagination.
  - Evidence: pending.
- [ ] T09.06 — Add date options to the common selector.
  - Estimate: 15–20 min. Depends on: T09.05.
  - Done when: No second independent sorting control is created.
  - Evidence: pending.
- [ ] T09.07 — Test metadata editing preserves publication date.
  - Estimate: 15–20 min. Depends on: T09.06.
  - Done when: Original publication instant is unchanged.
  - Evidence: pending.
- [ ] T09.08 — Test equal-date pagination.
  - Estimate: 15–20 min. Depends on: T09.07.
  - Done when: Stable ties yield the expected pages.
  - Evidence: pending.
- [ ] T09.09 — Test date sort combined with tags and audience.
  - Estimate: 15–20 min. Depends on: T09.08.
  - Done when: Results and totals match the filtered fixture.
  - Evidence: pending.
- [ ] T09.10 — Localise displayed publication dates.
  - Estimate: 15–20 min. Depends on: T09.09.
  - Done when: Formatting changes but chronological order does not.
  - Evidence: pending.

## P10 — Display Liked Videos in the User Profile

Requirement: RF-10 (all AC). Design: [P10](plan.md#p10). Integration dependencies: P05 reaction contract; P00 page DTO.

SCRUM-51 implements P10 in its own branch. The existing reaction endpoints supply the P05 contract. This slice uses the catalogue page envelope with a small item payload and retains the existing `/profile` route. See the [coordination handoff](../../docs/ai/tasks/scrum-51.md) for scope and shared files.

- [x] T10.01 — Audit reaction timestamp availability.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Need for an additive timestamp migration is recorded.
  - Evidence: `V1__init_schema.sql` and `VideoLike.createdAt` already supply the timestamp. Prior reaction switches only updated the type.
- [x] T10.02 — Add reaction timestamp persistence if missing.
  - Estimate: 15–20 min. Depends on: T10.01.
  - Done when: New likes have ordering data without changing reaction uniqueness.
  - Evidence: `VideoLikeRepository.upsertReaction` retains uniqueness and records the transition to LIKE using the existing column. `SessionSecurityTest.likedVideosArePrivatePaginatedAndBasedOnCurrentPositiveReactions` verifies that retries preserve the order and new positive reactions move ahead of older ones.
- [x] T10.03 — Write own-liked-video paginated query.
  - Estimate: 15–20 min. Depends on: T10.02.
  - Done when: Only active LIKE entries for the principal are returned.
  - Evidence: `SessionSecurityTest` covers positive-only filtering, principal scoping, stable ties across pages, totals and an out-of-range page. `LikedVideosServiceTest` covers thumbnail and page mapping.
- [x] T10.04 — Expose own-liked-video DTO endpoint.
  - Estimate: 15–20 min. Depends on: T10.03.
  - Done when: Response uses the shared page envelope.
  - Evidence: `LikedVideosControllerTest` verifies the session principal, page defaults, DTO, no-store header and invalid paging. `SessionSecurityTest` verifies authentication on the real route.
- [x] T10.05 — Add liked-video client/hook.
  - Estimate: 15–20 min. Depends on: T10.04.
  - Done when: Cancellation and loading/error/empty states are provided.
  - Evidence: `userClient.test.ts` verifies credentialed requests and the abort signal. `ProfilePage.test.tsx` verifies loading, empty and retry states and rejects a late response from a previous account.
- [x] T10.06 — Render profile Liked videos entry.
  - Estimate: 15–20 min. Depends on: T10.05.
  - Done when: It opens the own collection.
  - Evidence: `ProfilePage.test.tsx` verifies the collapsed entry and fetch on expansion.
- [x] T10.07 — Render liked-video page and pagination.
  - Estimate: 15–20 min. Depends on: T10.06.
  - Done when: Cards link to matching video IDs.
  - Evidence: `ProfilePage.test.tsx` verifies video links, next/previous controls and the return to a valid page when the collection shrinks.
- [x] T10.08 — Invalidate collection after unlike/dislike.
  - Estimate: 15–20 min. Depends on: T10.07.
  - Done when: Refetch removes the no-longer-liked video.
  - Evidence: `VideoPlayerPage.test.tsx` verifies DELETE on an active like or dislike. `liked-videos.spec.ts` verifies the collection after adding, switching and removing a like from the player, with a second account and a profile reload.
- [x] T10.09 — Test private liked-list isolation.
  - Estimate: 15–20 min. Depends on: T10.08.
  - Done when: Caller-selected identity cannot expose another account's collection.
  - Evidence: `SessionSecurityTest` checks two separate accounts, an anonymous request, a different ID in the query and attempts to access the collection by account ID. The profile test checks cancellation on account change.
- [x] T10.10 — Test deleted liked video removal.
  - Estimate: 15–20 min. Depends on: T10.09.
  - Done when: No broken card appears after reload.
  - Evidence: `SessionSecurityTest` verifies deletion by the video owner and a fresh collection response without the deleted item.

### SCRUM-51 local validation

| Criterion | Passing evidence |
| --- | --- |
| RF-10.AC1–AC2 | `SessionSecurityTest` and `liked-videos.spec.ts` verify active positive likes and exclusion of dislikes and other users' reactions. |
| RF-10.AC3 | `SessionSecurityTest` verifies stable ties, pagination and the latest positive activation. `ProfilePage.test.tsx` verifies page navigation and recovery when the final page disappears. |
| RF-10.AC4 | `ProfilePage.test.tsx` verifies each link target. `liked-videos.spec.ts` follows a liked item to its player route. |
| RF-10.AC5 | `SessionSecurityTest` verifies unlike, dislike and video deletion. The browser test exercises unlike and dislike with the player buttons. |
| RF-10.AC6 | `LikedVideosControllerTest` and `SessionSecurityTest` verify identity from the session and no caching. The browser test confirms a second account has an independent collection. |
| RF-10.AC7 | `ProfilePage.test.tsx` and `liked-videos.spec.ts` verify the empty state. The profile component test also covers retry after failure. |
| RF-10.AC8 | `SessionSecurityTest` verifies a fresh sign-in. `liked-videos.spec.ts` verifies a page reload and successful navigation from the reloaded collection. |

- Backend `mvn -B -o clean verify` with Java 21 and isolated PostgreSQL Testcontainers. 198 passed and all JaCoCo checks passed. One existing `MediaStorageServiceTest` case was skipped because the Windows host cannot create symbolic links.
- Frontend `npm run build`, `npm run lint` and `npm run test -- --coverage --watchAll=false --ci --runInBand` passed. Jest ran 240 tests in 34 suites.
- Playwright `npm test -- --workers=2` passed all 31 tests against a freshly built, isolated Docker Compose deployment. The new flow ran at 375 px in Chromium. The first runs identified an ambiguous test locator and a player toggle that sent POST for an active reaction. Both were corrected before the passing run.
- Sprint-wide collection QA, remote CI, PR review and merge are tracked separately from this local verification.

## P11 — Complete Video Editing and Deletion for Owners

Requirement: RF-11 (all AC). Design: [P11](plan.md#p11). Integration dependencies: P12 audience data; P00 contracts; P13 list contracts.

- [ ] T11.01 — Audit existing metadata fields and owner guards.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Missing category/audience/thumbnail capabilities are listed.
  - Evidence: pending.
- [ ] T11.02 — Add own-video paginated query.
  - Estimate: 15–20 min. Depends on: T11.01.
  - Done when: Only principal-owned summaries are returned.
  - Evidence: pending.
- [ ] T11.03 — Expose own-video list DTO route.
  - Estimate: 15–20 min. Depends on: T11.02.
  - Done when: Owner identity cannot be supplied by the client.
  - Evidence: pending.
- [ ] T11.04 — Render My videos cards and edit links.
  - Estimate: 15–20 min. Depends on: T11.03.
  - Done when: Each action targets the correct video.
  - Evidence: pending.
- [ ] T11.05 — Extend metadata DTO validation for category.
  - Estimate: 15–20 min. Depends on: T11.04.
  - Done when: Existing category source is reused.
  - Evidence: pending.
- [ ] T11.06 — Persist category in partial updates.
  - Estimate: 15–20 min. Depends on: T11.05.
  - Done when: Absent fields preserve existing values.
  - Evidence: pending.
- [ ] T11.07 — Connect audience field from P12 to the editor.
  - Estimate: 15–20 min. Depends on: T11.06.
  - Done when: Saved selection is restored in the form.
  - Evidence: pending.
- [ ] T11.08 — Define thumbnail-only update multipart contract.
  - Estimate: 15–20 min. Depends on: T11.07.
  - Done when: File validation and preserve/remove/replace semantics are explicit.
  - Evidence: pending.
- [ ] T11.09 — Add thumbnail replacement service operation.
  - Estimate: 15–20 min. Depends on: T11.08.
  - Done when: Validated new file is linked only after successful persistence.
  - Evidence: pending.
- [ ] T11.10 — Add thumbnail rollback regression case.
  - Estimate: 15–20 min. Depends on: T11.09.
  - Done when: Failure retains the previously saved thumbnail.
  - Evidence: pending.
- [ ] T11.11 — Render thumbnail preview/remove controls.
  - Estimate: 15–20 min. Depends on: T11.10.
  - Done when: Selection changes thumbnail only, not video bytes.
  - Evidence: pending.
- [ ] T11.12 — Add deletion confirmation identifying the video.
  - Estimate: 15–20 min. Depends on: T11.11.
  - Done when: Cancel makes no DELETE request.
  - Evidence: pending.
- [ ] T11.13 — List deletion dependencies and media ownership.
  - Estimate: 15–20 min. Depends on: T11.12.
  - Done when: Relations and imported/shared-file exclusions are documented.
  - Evidence: pending.
- [ ] T11.14 — Persist a managed-media cleanup intent during deletion.
  - Estimate: 15–20 min. Depends on: T11.13.
  - Done when: Committed deletion has recoverable cleanup work.
  - Evidence: pending.
- [ ] T11.15 — Implement one cleanup-attempt operation.
  - Estimate: 15–20 min. Depends on: T11.14.
  - Done when: Only unreferenced paths under the configured store are eligible.
  - Evidence: pending.
- [ ] T11.16 — Add retry state for failed cleanup.
  - Estimate: 15–20 min. Depends on: T11.15.
  - Done when: A failed attempt retains an actionable record.
  - Evidence: pending.
- [ ] T11.17 — Test shared-file preservation.
  - Estimate: 15–20 min. Depends on: T11.16.
  - Done when: Deleting one reference does not delete a still-used file.
  - Evidence: pending.
- [ ] T11.18 — Test owner/other-user delete permissions.
  - Estimate: 15–20 min. Depends on: T11.17.
  - Done when: Authorized delete and forbidden mutation are distinguishable.
  - Evidence: pending.
- [ ] T11.19 — Invalidate affected UI collections after deletion.
  - Estimate: 15–20 min. Depends on: T11.18.
  - Done when: Catalogue and active personal-list views refresh.
  - Evidence: pending.
- [ ] T11.20 — Verify one end-to-end owner edit/delete scenario.
  - Estimate: 15–20 min. Depends on: T11.19.
  - Done when: Metadata persists and deleted video becomes unavailable.
  - Evidence: pending.
- [ ] T11.21 — Connect cleanup retries to the existing startup/job lifecycle.
  - Estimate: 15–20 min. Depends on: T11.20.
  - Done when: Pending intents are retried with bounded attempts/backoff and recorded failure state; unrelated imports are untouched.
  - Evidence: pending.
- [ ] T11.22 — Verify cleanup-window evidence on an isolated failed-delete case.
  - Estimate: 15–20 min. Depends on: T11.21.
  - Done when: Recovery succeeds within the agreed <=24-hour policy or records an unmet acceptance criterion.
  - Evidence: pending.

## P12 — Implement Audience Labels and Content Filtering

Requirement: RF-12 (all AC). Design: [P12](plan.md#p12). Integration dependencies: P00 filter contract.

- [ ] T12.01 — Define audience enum and request semantics.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: CHILDREN/NOT_CHILDREN/UNCLASSIFIED and omitted-filter behaviour are documented.
  - Evidence: pending.
- [ ] T12.02 — Write audience migration with legacy default.
  - Estimate: 15–20 min. Depends on: T12.01.
  - Done when: Old records become UNCLASSIFIED without being marked children.
  - Evidence: pending.
- [ ] T12.03 — Map audience in entity and detail DTO.
  - Estimate: 15–20 min. Depends on: T12.02.
  - Done when: Read path retains the three states.
  - Evidence: pending.
- [ ] T12.04 — Validate mandatory audience on new upload.
  - Estimate: 15–20 min. Depends on: T12.03.
  - Done when: Omitted or UNCLASSIFIED new choices are rejected.
  - Evidence: pending.
- [ ] T12.05 — Persist owner audience edits.
  - Estimate: 15–20 min. Depends on: T12.04.
  - Done when: Partial update uses existing owner checks.
  - Evidence: pending.
- [ ] T12.06 — Render audience upload field.
  - Estimate: 15–20 min. Depends on: T12.05.
  - Done when: Both selectable choices and validation are labelled.
  - Evidence: pending.
- [ ] T12.07 — Render audience metadata-edit field.
  - Estimate: 15–20 min. Depends on: T12.06.
  - Done when: Current selection is prefilled.
  - Evidence: pending.
- [ ] T12.08 — Render audience label on details/cards.
  - Estimate: 15–20 min. Depends on: T12.07.
  - Done when: Unknown legacy content is labelled honestly.
  - Evidence: pending.
- [ ] T12.09 — Add audience predicate to shared search.
  - Estimate: 15–20 min. Depends on: T12.08.
  - Done when: All has no restriction; each explicit option matches exactly.
  - Evidence: pending.
- [ ] T12.10 — Add audience control to catalogue and URL.
  - Estimate: 15–20 min. Depends on: T12.09.
  - Done when: Change resets page without dropping text/tags.
  - Evidence: pending.
- [ ] T12.11 — Apply audience eligibility to recommendations.
  - Estimate: 15–20 min. Depends on: T12.10.
  - Done when: Excluded candidates cannot re-enter through fallback.
  - Evidence: pending.
- [ ] T12.12 — Test audience migration and combined filtering.
  - Estimate: 15–20 min. Depends on: T12.11.
  - Done when: Legacy defaults and text/tag/order totals are correct.
  - Evidence: pending.

## P13 — Extend Watch History and Implement Watch Later and a Queue

Requirement: RF-13 (all AC). Design: [P13](plan.md#p13). Integration dependencies: P00 collection contracts; P14 for queue playback integration.

- [ ] T13.01 — Define history last-play projection.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: One entry per video and stable lastPlayedAt ordering are specified.
  - Evidence: pending.
- [ ] T13.02 — Implement own paginated history query.
  - Estimate: 15–20 min. Depends on: T13.01.
  - Done when: History is bounded and never selected from arbitrary user identity.
  - Evidence: pending.
- [ ] T13.03 — Design history hiding independently of playback events.
  - Estimate: 15–20 min. Depends on: T13.02.
  - Done when: Cutoff/hidden state does not remove public metrics.
  - Evidence: pending.
- [ ] T13.04 — Add history hiding persistence.
  - Estimate: 15–20 min. Depends on: T13.03.
  - Done when: An own removal survives reload.
  - Evidence: pending.
- [ ] T13.05 — Implement history removal service/controller.
  - Estimate: 15–20 min. Depends on: T13.04.
  - Done when: Only the principal's visible history is affected.
  - Evidence: pending.
- [ ] T13.06 — Render full history list.
  - Estimate: 15–20 min. Depends on: T13.05.
  - Done when: Pagination and empty/error states are present.
  - Evidence: pending.
- [ ] T13.07 — Test removal followed by a new playback.
  - Estimate: 15–20 min. Depends on: T13.06.
  - Done when: Counter is unchanged by removal and new playback restores the entry.
  - Evidence: pending.
- [ ] T13.08 — Write Watch Later relationship migration.
  - Estimate: 15–20 min. Depends on: T13.07.
  - Done when: Unique user/video pair and foreign keys are included.
  - Evidence: pending.
- [ ] T13.09 — Implement Watch Later add operation.
  - Estimate: 15–20 min. Depends on: T13.08.
  - Done when: Repeated add retains a single row and original order timestamp.
  - Evidence: pending.
- [ ] T13.10 — Implement Watch Later remove operation.
  - Estimate: 15–20 min. Depends on: T13.09.
  - Done when: Repeated remove is idempotent.
  - Evidence: pending.
- [ ] T13.11 — Implement own Watch Later paginated query.
  - Estimate: 15–20 min. Depends on: T13.10.
  - Done when: Stable newest-save ordering and privacy are enforced.
  - Evidence: pending.
- [ ] T13.12 — Add Watch Later controller DTO mappings.
  - Estimate: 15–20 min. Depends on: T13.11.
  - Done when: PUT/DELETE/GET use the common auth/error rules.
  - Evidence: pending.
- [ ] T13.13 — Add Watch Later client methods.
  - Estimate: 15–20 min. Depends on: T13.12.
  - Done when: API boundaries are reusable and mockable.
  - Evidence: pending.
- [ ] T13.14 — Render save/remove control.
  - Estimate: 15–20 min. Depends on: T13.13.
  - Done when: State and pending/error feedback are accessible.
  - Evidence: pending.
- [ ] T13.15 — Render Watch Later collection.
  - Estimate: 15–20 min. Depends on: T13.14.
  - Done when: Saved cards and pagination are usable.
  - Evidence: pending.
- [ ] T13.16 — Test Watch Later restart persistence.
  - Estimate: 15–20 min. Depends on: T13.15.
  - Done when: An isolated restart retains the saved list.
  - Evidence: pending.
- [ ] T13.17 — Implement queue add/remove reducer actions.
  - Estimate: 15–20 min. Depends on: T13.16.
  - Done when: Duplicate add is ignored and remove preserves remaining order.
  - Evidence: pending.
- [ ] T13.18 — Implement queue reorder/clear reducer actions.
  - Estimate: 15–20 min. Depends on: T13.17.
  - Done when: Order is deterministic and clear produces an empty queue.
  - Evidence: pending.
- [ ] T13.19 — Add tab-session queue persistence.
  - Estimate: 15–20 min. Depends on: T13.18.
  - Done when: Reload restores valid entries; storage failure remains in-memory.
  - Evidence: pending.
- [ ] T13.20 — Clear queue on identity changes.
  - Estimate: 15–20 min. Depends on: T13.19.
  - Done when: Logout or account change removes prior account state.
  - Evidence: pending.
- [ ] T13.21 — Render queue list with keyboard move controls.
  - Estimate: 15–20 min. Depends on: T13.20.
  - Done when: Items can move up/down without drag-only interaction.
  - Evidence: pending.
- [ ] T13.22 — Connect ended event to next queue item.
  - Estimate: 15–20 min. Depends on: T13.21.
  - Done when: Exactly one next item is selected.
  - Evidence: pending.
- [ ] T13.23 — Handle unavailable next item and blocked autoplay.
  - Estimate: 15–20 min. Depends on: T13.22.
  - Done when: Unavailable items are skipped and manual play remains available.
  - Evidence: pending.
- [ ] T13.24 — Test history/queue mini-player identity continuity.
  - Estimate: 15–20 min. Depends on: T13.23.
  - Done when: Route changes and pause/replay do not double-count an opening.
  - Evidence: pending.

## P14 — Implement a Persistent Mini-player and Picture-in-Picture

Requirement: RF-14 (all AC). Design: [P14](plan.md#p14). Integration dependencies: P00 playback contract; P13 queue reducer contract.

- [ ] T14.01 — Document player state and route lifecycle.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Current video, playId, position and ownership have one source.
  - Evidence: pending.
- [ ] T14.02 — Create shared playback-state context.
  - Estimate: 15–20 min. Depends on: T14.01.
  - Done when: State outlives route components without starting a second player.
  - Evidence: pending.
- [ ] T14.03 — Move the existing video element into the persistent shell.
  - Estimate: 15–20 min. Depends on: T14.02.
  - Done when: Internal route changes do not unmount that element.
  - Evidence: pending.
- [ ] T14.04 — Connect detail-page metadata to the shared player.
  - Estimate: 15–20 min. Depends on: T14.03.
  - Done when: Opening a new video updates source and playId once.
  - Evidence: pending.
- [ ] T14.05 — Implement minimise/restore state transitions.
  - Estimate: 15–20 min. Depends on: T14.04.
  - Done when: Same element and playback position are retained.
  - Evidence: pending.
- [ ] T14.06 — Render mini-player play/pause controls.
  - Estimate: 15–20 min. Depends on: T14.05.
  - Done when: Accessible controls operate the current element.
  - Evidence: pending.
- [ ] T14.07 — Implement close and focus restoration.
  - Estimate: 15–20 min. Depends on: T14.06.
  - Done when: Audio stops and focus moves to a valid control.
  - Evidence: pending.
- [ ] T14.08 — Preserve volume and paused state when restoring.
  - Estimate: 15–20 min. Depends on: T14.07.
  - Done when: Restored presentation matches previous playback state.
  - Evidence: pending.
- [ ] T14.09 — Connect queue source replacement.
  - Estimate: 15–20 min. Depends on: T14.08.
  - Done when: One active source changes when selecting next.
  - Evidence: pending.
- [ ] T14.10 — Detect native PiP support.
  - Estimate: 15–20 min. Depends on: T14.09.
  - Done when: Unsupported browsers retain internal mini-player controls.
  - Evidence: pending.
- [ ] T14.11 — Handle PiP enter/exit/rejection events.
  - Estimate: 15–20 min. Depends on: T14.10.
  - Done when: UI state matches actual browser PiP state.
  - Evidence: pending.
- [ ] T14.12 — Style the mini-player at narrow widths.
  - Estimate: 15–20 min. Depends on: T14.11.
  - Done when: Primary navigation remains reachable.
  - Evidence: pending.
- [ ] T14.13 — Test search navigation during playback.
  - Estimate: 15–20 min. Depends on: T14.12.
  - Done when: Position and active player identity are preserved.
  - Evidence: pending.
- [ ] T14.14 — Test one play event across minimise/restore.
  - Estimate: 15–20 min. Depends on: T14.13.
  - Done when: No duplicate reproduction request is emitted.
  - Evidence: pending.

## P15 — Improve Screen-Reader Accessibility and Add Voice Search

Requirement: RF-15 (all AC). Design: [P15](plan.md#p15). Integration dependencies: P00 accessibility contract; P16 locale adapter.

- [ ] T15.01 — Audit landmarks and heading order on main routes.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Header/main/navigation problems are listed by route.
  - Evidence: pending.
- [ ] T15.02 — Move route content into a semantic main landmark.
  - Estimate: 15–20 min. Depends on: T15.01.
  - Done when: One main landmark surrounds page content.
  - Evidence: pending.
- [ ] T15.03 — Add a skip-to-content link.
  - Estimate: 15–20 min. Depends on: T15.02.
  - Done when: Keyboard activation moves focus to main content.
  - Evidence: pending.
- [ ] T15.04 — Fix names for audited icon-only controls.
  - Estimate: 15–20 min. Depends on: T15.03.
  - Done when: Each affected control has a unique meaningful accessible name.
  - Evidence: pending.
- [ ] T15.05 — Correct focus restoration in one shared dialog/menu pattern.
  - Estimate: 15–20 min. Depends on: T15.04.
  - Done when: Escape and close return focus to the trigger.
  - Evidence: pending.
- [ ] T15.06 — Add a restrained search-results announcement.
  - Estimate: 15–20 min. Depends on: T15.05.
  - Done when: Result/error updates announce once without moving focus.
  - Evidence: pending.
- [ ] T15.07 — Define voice-search capability and states.
  - Estimate: 15–20 min. Depends on: T15.06.
  - Done when: idle/listening/result/error/unsupported transitions are documented.
  - Evidence: pending.
- [ ] T15.08 — Implement explicit recognition start.
  - Estimate: 15–20 min. Depends on: T15.07.
  - Done when: No microphone capture begins before user action.
  - Evidence: pending.
- [ ] T15.09 — Implement stop/cancel and cleanup.
  - Estimate: 15–20 min. Depends on: T15.08.
  - Done when: Recognition and listeners stop on cancel/unmount.
  - Evidence: pending.
- [ ] T15.10 — Handle denied permission and silence.
  - Estimate: 15–20 min. Depends on: T15.09.
  - Done when: Useful errors preserve the typed query.
  - Evidence: pending.
- [ ] T15.11 — Apply final transcript to editable search text.
  - Estimate: 15–20 min. Depends on: T15.10.
  - Done when: Partial transcripts do not submit searches.
  - Evidence: pending.
- [ ] T15.12 — Select supported recognition locale from UI language.
  - Estimate: 15–20 min. Depends on: T15.11.
  - Done when: Unsupported locales retain typed search and explain limits.
  - Evidence: pending.
- [ ] T15.13 — Render accessible microphone states.
  - Estimate: 15–20 min. Depends on: T15.12.
  - Done when: Name, listening feedback and stop/cancel actions are available.
  - Evidence: pending.
- [ ] T15.14 — Run a keyboard-only search/playback walkthrough.
  - Estimate: 15–20 min. Depends on: T15.13.
  - Done when: Steps and any blockers are recorded.
  - Evidence: pending.
- [ ] T15.15 — Run an NVDA desktop search/playback walkthrough.
  - Estimate: 15–20 min. Depends on: T15.14.
  - Done when: Reader/browser versions and observed outcome are recorded.
  - Evidence: pending.
- [ ] T15.16 — Run an available mobile screen-reader walkthrough.
  - Estimate: 15–20 min. Depends on: T15.15.
  - Done when: Actual device/reader and limitations are recorded.
  - Evidence: pending.

## P16 — Implement Spanish, Catalan and English Localisation

Requirement: RF-16 (all AC). Design: [P16](plan.md#p16). Integration dependencies: P00 locale contract.

- [x] T16.01 — Inventory hardcoded text by route.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Strings are grouped into navigation, account, catalogue, player and library namespaces.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.02 — Choose a minimal localisation adapter.
  - Estimate: 15–20 min. Depends on: T16.01.
  - Done when: Existing dependencies are checked and any new dependency is justified.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.03 — Create typed catalogue keys and Spanish fallback.
  - Estimate: 15–20 min. Depends on: T16.02.
  - Done when: Unknown keys have a controlled fallback and missing-key detection.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.04 — Create Catalan catalogue skeleton.
  - Estimate: 15–20 min. Depends on: T16.03.
  - Done when: Key parity with the fallback catalogue is enforced.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.05 — Create English catalogue skeleton.
  - Estimate: 15–20 min. Depends on: T16.04.
  - Done when: Key parity with the fallback catalogue is enforced.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.06 — Implement locale preference resolution.
  - Estimate: 15–20 min. Depends on: T16.05.
  - Done when: An account-scoped manual preference precedes the optional account language and Spanish fallback; browser language is not used.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.07 — Add persistent locale selection.
  - Estimate: 15–20 min. Depends on: T16.06.
  - Done when: Storage failure keeps the current locale in memory.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.08 — Render global language selector.
  - Estimate: 15–20 min. Depends on: T16.07.
  - Done when: Three language names and keyboard selection are accessible.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.09 — Update document language on selection.
  - Estimate: 15–20 min. Depends on: T16.08.
  - Done when: html.lang reflects es/ca/en.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.10 — Add shared date/number/plural formatting helpers.
  - Estimate: 15–20 min. Depends on: T16.09.
  - Done when: Formatting uses the current locale without changing stored data.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.11 — Map API error codes to translation keys.
  - Estimate: 15–20 min. Depends on: T16.10.
  - Done when: Known errors never display raw technical messages.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.12 — Test locale switch during playback/form editing.
  - Estimate: 15–20 min. Depends on: T16.11.
  - Done when: Video and unsaved values remain intact.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.13 — Test missing-key fallback and catalogue parity.
  - Estimate: 15–20 min. Depends on: T16.12.
  - Done when: Missing translations are reported before delivery.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.

## P17 — Optimise Database Queries and Supabase Performance

Requirement: RF-17 (all AC). Design: [P17](plan.md#p17). Integration dependencies: P00 dataset contract; P08/P09/P10/P13 final queries for final run.

- [x] T17.01 — Define benchmark dataset manifest.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Counts, distributions and deterministic seed are recorded.
  - Evidence: [deterministic fixture](../../backend/src/test/resources/benchmark/catalogue-537.sql) and the [catalogue checkpoint](#scrum-58-catalogue-checkpoint). Dataset approved for this slice on 22 November.
- [ ] T17.02 — Prepare one repeatable request workload.
  - Estimate: 15–20 min. Depends on: T17.01.
  - Done when: Catalogue/search/detail/library operations and concurrency are specified.
  - Evidence: pending.
- [x] T17.03 — Instrument SQL count for one catalogue request.
  - Estimate: 15–20 min. Depends on: T17.02.
  - Done when: Count and query categories are captured without secrets.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [ ] T17.04 — Record HTTP and backend timing separately.
  - Estimate: 15–20 min. Depends on: T17.03.
  - Done when: Measurement locations and warm/cold states are identified.
  - Evidence: pending.
- [x] T17.05 — Launch baseline benchmark runs.
  - Estimate: 15–20 min. Depends on: T17.04.
  - Done when: Three run IDs and identical configuration are recorded.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [x] T17.06 — Collect baseline p50/p95/errors.
  - Estimate: 15–20 min. Depends on: T17.05.
  - Done when: Actual measurements are stored or the collection stays pending.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [ ] T17.07 — Capture the current catalogue query plan.
  - Estimate: 15–20 min. Depends on: T17.06.
  - Done when: Plan and dataset reference are attached.
  - Evidence: pending.
- [x] T17.08 — Replace per-video reaction counts with one batch aggregate.
  - Estimate: 15–20 min. Depends on: T17.07.
  - Done when: Counts match the known fixture and query count is bounded.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [x] T17.09 — Replace per-video comment counts with one batch aggregate.
  - Estimate: 15–20 min. Depends on: T17.08.
  - Done when: Deleted-comment semantics remain correct.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [x] T17.10 — Replace per-video play counts with one batch aggregate.
  - Estimate: 15–20 min. Depends on: T17.09.
  - Done when: Only ProTube reproduction events are counted.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [x] T17.11 — Batch-load tags for the current result page.
  - Estimate: 15–20 min. Depends on: T17.10.
  - Done when: No lazy tag query is issued per row.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [ ] T17.12 — Measure one proposed search index.
  - Estimate: 15–20 min. Depends on: T17.11.
  - Done when: Before/after query plan justifies retaining or rejecting it.
  - Evidence: pending.
- [ ] T17.13 — Write the justified index migration.
  - Estimate: 15–20 min. Depends on: T17.12.
  - Done when: Applied migrations stay unchanged.
  - Evidence: pending.
- [ ] T17.14 — Review Hikari limits against the host budget.
  - Estimate: 15–20 min. Depends on: T17.13.
  - Done when: Connection settings and reason are documented without arbitrary increases.
  - Evidence: pending.
- [x] T17.15 — Launch the matching final benchmark runs.
  - Estimate: 15–20 min. Depends on: T17.14.
  - Done when: Dataset/client/workload match baseline and run IDs are recorded.
  - Evidence: [verified catalogue checkpoint](#scrum-58-catalogue-checkpoint); completion limited to the authorised local catalogue slice.
- [ ] T17.16 — Compare final metrics and functional results.
  - Estimate: 15–20 min. Depends on: T17.15.
  - Done when: p50/p95/errors/queries and filters/totals/privacy are reported honestly.
  - Evidence: pending.

### SCRUM-58 catalogue checkpoint

- RF-17.AC1/6/8 · The 537-video isolated dataset supersedes 1,000 for this slice. Neither the earlier 74-video sample nor single-user runs establish the concurrent p95.
- RF-17.AC2/3/4 · Check a full page at sizes 1, 6 and 24, partial and empty pages, tags, deleted comments, reactions and plays. The full page should require at most six SQL statements.
- RF-17.AC5/7 · Capture the existing page plan and compare workload and functional results on the same fixture. Track any unexecuted check here.

#### Fixture, workload and reproduction

Arithmetic seed 58 generates 537 videos owned by 64 synthetic accounts. Each fifth video has no tags and each other video has three of eight tags. The first 500 videos share 5,370 unique video/account reactions (every fourth is a dislike). The first 480 share 2,685 comments (every eleventh is soft-deleted). The first 520 share 1,074 play events. Sources: [SQL fixture](../../backend/src/test/resources/benchmark/catalogue-537.sql) and [isolated workload](../../backend/src/test/java/com/tecnocampus/LS2/protube_back/services/CatalogueBenchmarkIT.java).

From the repository root, run `python tooling/database/compare_catalogue.py --output ../scrum58-comparison` with Java 21, Maven and Docker available. Choose a new output directory. The [comparison runner](../../tooling/database/compare_catalogue.py) extracts the baseline backend at `2ef450d`, copies the same workload and fixture into it, then runs `mvn -B -ntp -Dtest=CatalogueBenchmarkIT test-compile surefire:test` sequentially for both versions. It retains both logs and checks the response hashes, samples, SQL bound and p95 targets in every measured round. Its parser and rejection cases were exercised with synthetic logs. Each invocation starts its own PostgreSQL Testcontainer. The in-process client uses the actual HTTP endpoint on a random loopback port. Ten workers cycle through the first page, a title/tag search, page two, and a detail request. The run prints isolated service times and statement counts first, then stable response hashes and HTTP results per route. Exclude warm-up (round 0, 30 seconds). Compare rounds 1–3 (300 seconds each) and their error counts, p50/p95 and hashes. For each 24-card listing/search operation check the 1,000 ms budget and, when the baseline exceeds it, the 30% reduction. Fixed data and concurrent readers exercise read consistency. Concurrent writes, private collections, production network latency and post-idle startup require separate evidence.

#### Shared Supabase sample before the change

Three sequential rounds from the Windows host with the original application already running on port 8080. Public GET, one worker, `python tooling/database/catalogue_probe.py --tag "(official"` from the repo root. Snapshot: 74 videos, 1,296 tag links, one reaction, one comment and six plays. The version of the running container was not established. Each SHA-256 covers the canonical JSON response including ordered cards and tags. Mutable counters can change between runs, so compare them on a stable dataset.

| Case | Cards | HTTP ms, three rounds | Median ms | SHA-256, stable over three rounds |
|---|---:|---|---:|---|
| page-1 | 1 | 392.6, 348.6, 352.5 | 352.5 | 7896d8cec775fcb878bee8d9101990c3872f931f335f1b9a0950c910990413b1 |
| page-6 | 6 | 1337.7, 1367.9, 1365.3 | 1365.3 | 753969e3422f2bc961f417dcd51739535ba4d9db111911a7e3821fabdb53f804 |
| page-24 | 24 | 5059.2, 5024.3, 5026.8 | 5026.8 | bfc7245734ef257ab76b19df1e65962b5e74845ee675553605cb0798ebb1154b |
| next-page | 24 | 5014.4, 5038.7, 5017.0 | 5017.0 | 931e60481e2694cd692863764fa5396942b50e38dd3a7bbb4cca0927a5a4c282 |
| filtered | 1 | 373.3, 375.7, 360.4 | 373.3 | a80a8194d0f49690ae8ade35e0bc155e2d90264c32a0677d09d43c322b8e39bd |
| empty | 0 | 112.2, 107.9, 88.7 | 107.9 | bc4f4968e23278b427b75d8102add339a337b25f36a325af836e8ca23aec090b |

All 18 requests returned 200. Earlier observation: 122 catalogue statements (120 video-specific) during a 5.088 s request, measured by shared pg_stat_statements deltas. For the equivalent unfiltered page selector, EXPLAIN (ANALYZE, BUFFERS) showed an index scan on videos_pkey, 24 rows, 14 shared hits and 0.125 ms execution. This is the page selector alone. PostgreSQL comparison on the same first 24 IDs found zero differences between grouped and individual tag/reaction/comment/play values. No new index is justified by this limited measurement.

#### Read-only PostgreSQL check of the 537-video fixture

Executed the fixture's seven SELECT expressions as in-memory query relations on PostgreSQL. Compared individual counts and sorted tag names against page-grouped results in both directions using EXCEPT ALL. All 537 IDs across 23 pages matched, including 5,370 distinct video/user reactions, 2,685 comments (245 soft-deleted) and 1,074 play events. This validates the SQL semantics independently of Spring. No rows were inserted into the shared application tables.

[Informe de antes y después de la respuesta HTTP](../../docs/SCRUM-58-ANTES-DESPUES-HTTP.md).

#### Candidate verification

| RF-17 criteria | Evidence | Status |
|---|---|---|
| AC2–4 | CatalogueSummaryTest: two passed. CatalogueQueryCountTest: one passed, including sizes 1/6/24, tags, totals, partial last page, empty page and independent counters. Benchmark SQL before 7/32/122, after 6/6/6. | Verified for catalogue; private-library permissions outside scope. |
| AC1, AC5, AC6, AC8 | Same 537-video fixture, PostgreSQL 16 Alpine, Java HTTP client in loopback, ten readers, 30 s warm-up and three 300 s rounds. [Comparison JSON](../../docs/evidence/scrum-58/comparison.json), [report](../../docs/SCRUM-58-ANTES-DESPUES-HTTP.md). | All catalogue/search rounds meet p95 ≤1,000 ms. Baseline already below budget; conditional 30% criterion not activated. No index change. |
| AC7 | All four HTTP hashes match between versions. Every measured request checks status 200 and reference bytes. Zero errors in all measured and warm-up route/round combinations. | Concurrent fixed-data readers verified; concurrent writes remain pending. |

Validated on 22 November 2026 (Europe/Madrid), branch `feature/Scrum--58-Supabase-optimization`, commits `3c8e948` and `4246803`, baseline `2ef450d`. The checked T17 tasks apply to the authorised catalogue slice; broader library/index/pool dependencies do not gate this batch-read-only measurement.

HTTP p95 R1/R2/R3 in ms: catalogue 106/99/98 → 12/12/10; filtered search 110/102/100 → 14/14/13; second page 107/99/98 → 11/11/10; detail 7/6/6 → 7/7/6. Detail's second-round p95 rises 1 ms. Measured requests: 123,433 baseline, 982,863 candidate. Exact p50, samples, errors and source-log SHA-256 are in the JSON.

The user ran `mvn clean verify` and reported BUILD SUCCESS. Available Surefire XML from 15:56–15:57 confirms 194 tests, zero failures/errors and one skipped: `MediaStorageServiceTest.refusesSymlinkedUploadDirectories`, aborted because the host cannot create symbolic links. Available JaCoCo XML satisfies the configured gates: instructions 7,531/7,854; lines 1,326/1,368; methods 377/391; no measured class below 50% line coverage. The later CatalogueBenchmarkIT XML is separate (one passed test, 16:38:49); candidate log finishes BUILD SUCCESS at 16:38:50. Earlier javac/Docker/temp failures are superseded by these available results.

The original launcher used phase `test`, so baseline Maven failed at 16:15:27 on global JaCoCo coverage after all benchmark rounds passed. It never launched the candidate or wrote JSON. The candidate was run separately with `test-compile surefire:test`; the launcher now uses that focused command. `pom.xml` and full-suite coverage gates are unchanged. The baseline's post-measurement coverage failure does not invalidate completed timings.

- [x] C58.01 — Compare completed logs without rerunning load. `python -B tooling/database/compare_catalogue.py --from-logs ../scrum58-comparison/baseline.log ../scrum58-comparison/candidate.log --output docs/evidence/scrum-58`: `failures: []`; candidate UTF-16 BOM, baseline UTF-8.
- [x] C58.02 — Correct focused Maven launch and verify offline parser. `python -B -m unittest discover -s tooling/database -p test_compare_catalogue.py -v`: four tests passed (command, encodings, offline mode, criteria, duplicate/incomplete rounds).
- [x] C58.03 — Document real local before/after, suite evidence and launcher incident; preserve pending team approval in prompt traceability.
- [x] C58.04 — Final documentation checks: 101 local links resolve, completed T17 tasks link verification evidence, real comparison totals match and `git diff --check` passes. Work remains on the requested branch; no publication or Jira transition.

T17.02 remains partial because the full workload includes library operations. T17.04 has HTTP and isolated service timings but no cold/post-idle measurement. T17.07 has only the historical page-selector plan. T17.12–14 (search index, any justified migration, host pool review) remain unverified. T17.16 has catalogue metrics/equivalence but no integrated private-library permission check. Collections, concurrent writes, Supabase remote latency and final integration/review remain pending for broader RF-17. No backend suite or load was repeated during this continuation. The local catalogue slice is ready for review, without implying shared ticket completion or merge.

## P16 — Additional translation slices

Depend on T16.13 and the corresponding UI group. Each slice covers at most 15 short strings; repeat with stable child IDs when a namespace is larger.

- [x] T16.14 — navigation: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.15 — navigation: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.16 — navigation: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.17 — navigation: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.18 — account: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.19 — account: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.20 — account: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.21 — account: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.22 — catalogue: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.23 — catalogue: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.24 — catalogue: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.25 — catalogue: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.26 — player: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.27 — player: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.28 — player: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.29 — player: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.30 — comments: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.31 — comments: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.32 — comments: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.33 — comments: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.34 — creator-management: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.35 — creator-management: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.36 — creator-management: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.37 — creator-management: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.38 — subscriptions: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.39 — subscriptions: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.40 — subscriptions: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.41 — subscriptions: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.42 — personal-library: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.43 — personal-library: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.44 — personal-library: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.45 — personal-library: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.46 — voice-and-errors: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.47 — voice-and-errors: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.48 — voice-and-errors: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.
- [x] T16.49 — voice-and-errors: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: [RF-16 local validation](#rf-16-local-validation); typed catalogues and route/client changes. Missing future UI is excluded below.

## Integration and release checks

Depend on affected feature groups, not on unimplemented unrelated stories for focused checks. Release requires every committed story and the common DoD. Each entry estimates <=20 minutes active work; external waits remain pending.

- [ ] QA.01 — Launch backend verification.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups.
  - Done when: Record command, commit and process/log reference; no success claim until results are reviewed.
  - Evidence: pending.
- [ ] QA.02 — Review backend verification results.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.01.
  - Done when: Record test/coverage results and triage each failure without weakening gates.
  - Evidence: pending.
- [ ] QA.03 — Run frontend build.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.02.
  - Done when: Record typecheck/build result for the integrated tree.
  - Evidence: pending.
- [ ] QA.04 — Run frontend lint.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.03.
  - Done when: Record lint outcome; unrelated cleanup is not included.
  - Evidence: pending.
- [ ] QA.05 — Launch frontend tests with coverage.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.04.
  - Done when: Record exact command and log reference.
  - Evidence: pending.
- [ ] QA.06 — Review frontend test/coverage results.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.05.
  - Done when: Record failures, counts and configured coverage gates.
  - Evidence: pending.
- [ ] QA.07 — Select existing isolated E2E runner.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.06.
  - Done when: Read package scripts/README and record the exact chosen command and isolated configuration.
  - Evidence: pending.
- [ ] QA.08 — Launch integrated E2E flows.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.07.
  - Done when: Record runner output location and covered scenarios.
  - Evidence: pending.
- [ ] QA.09 — Review integrated E2E results.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.08.
  - Done when: Map account/upload/search/comments/playback outcomes to AC.
  - Evidence: pending.
- [ ] QA.10 — Check registration-to-playback on two devices.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.09.
  - Done when: Record persistence and media accessibility after restart.
  - Evidence: pending.
- [ ] QA.11 — Check search/filter/sort matrix.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.10.
  - Done when: Known data validates ties, pagination and every audience/sort choice.
  - Evidence: pending.
- [ ] QA.12 — Check reaction/comment/subscription flow.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.11.
  - Done when: Record happy path and one network failure per interaction.
  - Evidence: pending.
- [ ] QA.13 — Check liked/history/saved list isolation.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.12.
  - Done when: Record two-account results and deletion effects.
  - Evidence: pending.
- [ ] QA.14 — Check mini-player and queue walkthrough.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.13.
  - Done when: Record playback continuity, no double-counting and blocked-autoplay recovery.
  - Evidence: pending.
- [ ] QA.15 — Check owner edit/delete walkthrough.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.14.
  - Done when: Record outsider rejection and cleanup intent/result.
  - Evidence: pending.
- [ ] QA.16 — Check mobile and tablet responsive matrix.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.15.
  - Done when: Record widths/orientations, long labels and five-line descriptions.
  - Evidence: pending.
- [ ] QA.17 — Check Spanish/Catalan/English route matrix.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.16.
  - Done when: Record missing keys and uninterrupted forms/playback.
  - Evidence: pending.
- [ ] QA.18 — Review performance comparison.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.17.
  - Done when: Record p50/p95/query counts/errors against agreed targets.
  - Evidence: pending.
- [ ] QA.19 — Prepare final PR evidence summary.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.18.
  - Done when: Link RF/AC evidence, actual checks, migrations and pending limits.
  - Evidence: pending.
- [ ] QA.20 — Record peer review and CI outcome.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.19.
  - Done when: Only actual review/CI results are recorded; external waits remain open.
  - Evidence: pending.
- [ ] QA.21 — Verify deployment in the authorised staging environment.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.20.
  - Done when: Record deployed commit, health and integrated smoke results after separate deployment authorisation.
  - Evidence: pending.
- [ ] QA.22 — Verify final Done status.
  - Estimate: 10–20 min. Depends on: relevant completed feature groups and QA.21.
  - Done when: Merge-to-main, staging and all committed AC evidence exist; incomplete items remain unchecked.
  - Evidence: pending.

## Requirement validation matrix

Proposed scenario IDs below are planning identifiers, not claims of existing test files. Record actual case names and commands when implemented.

| RF | Task group | Proposed verification | Command/location | Actual result |
| --- | --- | --- | --- | --- |
| RF-01 | T01.* + relevant QA | CrossDevicePersistence + isolated restore manifest; verify every numbered AC | [Historical cloud evidence](#p01-historical-cloud-evidence) | Prior active-source DB migration/restore/configuration verified; hosted backend/media and physical second-device checks pending. |
| RF-02 | T02.* + relevant QA | AccountAvatarUploadRollback + restart; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-03 | T03.* + relevant QA | CatalogueResponsive + ThemeContrast; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-04 | T04.* + relevant QA | FiveLineOverflow + RecommendationEligibility; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-05 | T05.* + relevant QA | ReactionTransitions + StaleResponse; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-06 | T06.* + relevant QA | ThreadResponsive + DraftFailure; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-07 | T07.* + relevant QA | Subscription uniqueness, private-list isolation, creator navigation and restart | [SCRUM-48 local validation](#scrum-48-local-validation) | Passed locally |
| RF-08 | T08.* + relevant QA | PopularitySearchTest, VideosControllerTest, app/URL tests and Chromium search | [RF-08 local verification](#rf-08-local-verification-2026-11-25) | Passed locally; review/remote CI/merge pending |
| RF-09 | T09.* + relevant QA | PublicationSort + EditPreservesDate; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-10 | T10.* + relevant QA | Own-list isolation, pagination, player toggle, deletion and reload | [SCRUM-51 local validation](#scrum-51-local-validation) | Passed locally |
| RF-11 | T11.* + relevant QA | OwnerMetadataDelete + SafeMediaCleanup; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-12 | T12.* + relevant QA | AudienceMigration + CombinedFilter; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-13 | T13.* + relevant QA | HistoryHideMetrics + SavedPersistence + QueueOrder; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-14 | T14.* + relevant QA | RoutePlaybackContinuity + SinglePlayId; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-15 | T15.* + relevant QA | KeyboardReaderJourney + VoiceFailures; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-16 | T16.* + relevant QA | LocaleParity + PreserveState and optional account default | [Local evidence](#rf-16-local-validation) | Passed locally; expanded browser assertions typechecked but final rerun stopped by user. |
| RF-17 | T17.* + relevant QA | RepeatableBenchmark + QueryCountBound | [Catalogue checkpoint](#scrum-58-catalogue-checkpoint) | Catalogue verified locally; collections, concurrent writes, remote/cold environment and integration/review pending. |

## Documentation handoff and current verdict

- Prepared: spec/plan/task documents with all 17 requirements and small work slices.
- Document verification: identifier uniqueness, <=20-minute estimate bounds, requirement/design coverage and local link existence checked by the authoring script; no application checks executed.
- Historical spec-only baseline: implementation was not started in the original documentation request. Subsequent scoped implementation and checked tasks are recorded in their checkpoints above.
- Team approval/ownership/remote CI/merge/staging: unverified or pending; no reservation claimed.
- Next step: select the first implementation slice and establish P00 contracts/ownership before changing runtime code.
- Verdict: planning documents prepared; Sprint 4 features not validated.


## RF-16 local validation

2026-11-25, Europe/Madrid; feature/LanguageLocalisation, baseline 3c266c4. User-authorized local implementation and publication; no team approval or remote CI claimed.

- T16.01–T16.11: `frontend/src/i18n/catalogues.ts` supplies Spanish, Catalan and English with typed key parity. The adapter uses existing React/Intl dependencies, account-scoped browser preferences, optional account defaults, Spanish fallback, document language, controlled errors, dates, numbers and plurals. Built-in category labels are translated without changing API values. Failed storage retains the current selection in memory.
- T16.12–T16.13: `locale.test.tsx` and `LocalisationFlows.test.tsx` cover key/parameter parity, missing/unknown fallback, invalid/missing language, all profile languages, registration payloads, account isolation, storage failures, dates/numbers/plurals, preserved forms, user content and the same media element/current time.
- T16.14–T16.49 translation slices: navigation/appearance in App, AccountMenu, AppearanceControls, LanguageSelector; account in AuthPage/AuthProvider; catalogue in SearchBar/TagSearch/VideoCard/Pagination; player and comments in their components; creator management in UploadVideoPage/VideoMetadataPage/ProfilePage/AnalyticsPage; subscriptions via the shared subscriptionMessages adapter; personal library in LikedVideosSection and profile history; errors in clients and the shared adapter. Each catalogue has the same reviewed strings and placeholders. Autonyms Español/Català/English remain native. User-authored text remains unchanged. Unimplemented speech, Watch Later, queue and mini-player controls are outside this slice, with the adapter ready for their future keys.
- Account extension: optional `preferredLanguage` es/ca/en in RegisterRequest and private UserResponse; nullable V11 column with a database constraint. Existing users retain null. Account-created/session-failed responses have a stable code. No shared database or deployment was modified.

| Criteria | Evidence | Result |
| --- | --- | --- |
| AC1–AC3 | Locale unit tests, registration/session component flows; AuthControllerTest and UserServiceTest; profile persistence through dev/prod restarts | Passed locally |
| AC4–AC5 | Typed catalogues, key/value/placeholder parity; date/number/plural/category tests; build and lint | Passed locally |
| AC6, AC8 | Form drafts, selected account language, untouched titles/descriptions and media identity/current time in Jest; native canvas-stream playback continuity in Chromium | Passed locally; no new queue feature introduced |
| AC7 | Unknown-key controlled fallback and missing-key/value tests | Passed locally |
| AC9 | Chrome: 18 tests, es/ca/en at 1280px and 375px; keyboard selector, reload, registration/login/profile, drafts and active native playback; overflow assertions and screenshots | Passed for the executed browser version. Final additions for upload files/categories, analytics and subscriptions were typechecked but their rerun was stopped at the user's request |

Commands actually completed:

- Backend Java 21: `mvn -B -ntp clean verify`: 216 tests, 0 failures/errors, 1 existing opt-in skip; JaCoCo passed. Additional `mvn -B -ntp -Dtest=AuthControllerTest,PostgreSqlPersistenceTest test`: 18 passed, including legacy null-language/invalid-value checks and restart persistence.
- Frontend: `npm run build` and `npm run lint`: passed. `npm run test -- --coverage --watchAll=false --ci --runInBand`: 38 suites, 264 tests, 1 snapshot passed; configured coverage thresholds met.
- Browser: `node node_modules/@playwright/test/cli.js test --config playwright.locale.config.ts`: 18 passed in the executed version, with isolated mocked APIs and a native canvas MediaStream. This does not claim full-stack media decoding or shared/staging verification. The final requested repetition was rejected/stopped by the user; no further browser run performed.
- Scoped E2E TypeScript check for localisation.spec.ts and playwright.locale.config.ts passed, reusing frontend Node types. The broad pre-existing E2E typecheck reports a multipart type mismatch in fixtures/api.ts and missing DOM.Iterable in appearance.spec.ts; those unrelated issues remain. Existing integration selectors were updated for Spanish; the entire Docker E2E suite was not rerun.

Remote CI, shared task ownership, team review and staging remain unverified. No audit was performed, per user request. Next action: commit and integrate into the user's existing feature branch, then push that branch as explicitly requested.
