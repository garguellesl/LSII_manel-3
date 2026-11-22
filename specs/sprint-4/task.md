# Tasks — Sprint 4

[Spec](spec.md) | [Plan](plan.md) | [Handoff](../../docs/ai/tasks/sprint4-specs.md).
Authorised now: prepare documents only. All implementation and validation tasks below are pending.

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

- [ ] T01.01 — Inventory one source database's migration versions and table counts.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: A redacted inventory identifies that source and missing exports.
  - Evidence: pending.
- [ ] T01.02 — Inventory media references for the same source.
  - Estimate: 15–20 min. Depends on: T01.01.
  - Done when: Missing files and managed/imported ownership are listed.
  - Evidence: pending.
- [ ] T01.03 — Document the shared host and one-writer topology.
  - Estimate: 15–20 min. Depends on: T01.02.
  - Done when: Frontend, backend, DB and persistent media locations are distinguished without secrets.
  - Evidence: pending.
- [ ] T01.04 — Prepare one source backup command and manifest.
  - Estimate: 15–20 min. Depends on: T01.03.
  - Done when: Command uses an external destination and records checksums without credentials.
  - Evidence: pending.
- [ ] T01.05 — Launch an isolated restore of that backup.
  - Estimate: 15–20 min. Depends on: T01.04.
  - Done when: Restore job ID and destination are recorded; completion remains pending if running.
  - Evidence: pending.
- [ ] T01.06 — Compare restored table counts against the manifest.
  - Estimate: 15–20 min. Depends on: T01.05.
  - Done when: Differences are recorded and no live data was overwritten.
  - Evidence: pending.
- [ ] T01.07 — Check one restored video's file references.
  - Estimate: 15–20 min. Depends on: T01.06.
  - Done when: MP4, thumbnail and avatar resolution are recorded.
  - Evidence: pending.
- [ ] T01.08 — List source-account and ID collisions.
  - Estimate: 15–20 min. Depends on: T01.07.
  - Done when: Each collision has a proposed reconciliation rule; unresolved rows remain pending.
  - Evidence: pending.
- [ ] T01.09 — Validate shared Compose settings with synthetic secrets.
  - Estimate: 15–20 min. Depends on: T01.08.
  - Done when: Configuration validation succeeds without printing real values.
  - Evidence: pending.
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
- [ ] T01.13 — Record the restore job result.
  - Estimate: 15–20 min. Depends on: T01.12.
  - Done when: Exit result and reconciliation evidence are attached, or task stays open.
  - Evidence: pending.
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

- [ ] T04.01 — Define recommendation response fields and deterministic order.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Contract includes cap eight, eligibility and stable ID ties.
  - Evidence: pending.
- [ ] T04.02 — Write a recommendation exclusion repository case.
  - Estimate: 15–20 min. Depends on: T04.01.
  - Done when: Current, deleted and audience-excluded videos are absent.
  - Evidence: pending.
- [ ] T04.03 — Implement the shared-tag recommendation query slice.
  - Estimate: 15–20 min. Depends on: T04.02.
  - Done when: Tag candidates are bounded and unique.
  - Evidence: pending.
- [ ] T04.04 — Add category/recent fallback selection.
  - Estimate: 15–20 min. Depends on: T04.03.
  - Done when: The ordered result is capped at eight without duplicates.
  - Evidence: pending.
- [ ] T04.05 — Expose the recommendation GET through service and DTO.
  - Estimate: 15–20 min. Depends on: T04.04.
  - Done when: Endpoint delegates and returns an empty list when appropriate.
  - Evidence: pending.
- [ ] T04.06 — Add a recommendation client with cancellation.
  - Estimate: 15–20 min. Depends on: T04.05.
  - Done when: A stale response cannot overwrite another video's data.
  - Evidence: pending.
- [ ] T04.07 — Render the recommendation card list.
  - Estimate: 15–20 min. Depends on: T04.06.
  - Done when: Loading, empty and error outputs are distinct.
  - Evidence: pending.
- [ ] T04.08 — Add desktop two-column player layout.
  - Estimate: 15–20 min. Depends on: T04.07.
  - Done when: Recommendations sit beside a usable player.
  - Evidence: pending.
- [ ] T04.09 — Add mobile recommendation stacking.
  - Estimate: 15–20 min. Depends on: T04.08.
  - Done when: The player retains width and cards appear below the main block.
  - Evidence: pending.
- [ ] T04.10 — Change description clamp to five lines.
  - Estimate: 15–20 min. Depends on: T04.09.
  - Done when: Collapsed CSS has a five-line limit.
  - Evidence: pending.
- [ ] T04.11 — Detect description overflow after width changes.
  - Estimate: 15–20 min. Depends on: T04.10.
  - Done when: Show more appears only when rendered text exceeds the clamp.
  - Evidence: pending.
- [ ] T04.12 — Add expand/collapse accessible state.
  - Estimate: 15–20 min. Depends on: T04.11.
  - Done when: Button has matching expanded/controls state and retains focus.
  - Evidence: pending.
- [ ] T04.13 — Test expansion without playback reset.
  - Estimate: 15–20 min. Depends on: T04.12.
  - Done when: Player instance and playback position are preserved.
  - Evidence: pending.
- [ ] T04.14 — Check five-line descriptions at narrow and desktop widths.
  - Estimate: 15–20 min. Depends on: T04.13.
  - Done when: Short, long and zoomed examples are recorded.
  - Evidence: pending.

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

- [ ] T07.01 — Define subscription DTO and endpoint examples.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Own-list privacy and public creator fields are separated.
  - Evidence: pending.
- [ ] T07.02 — Write subscription table migration.
  - Estimate: 15–20 min. Depends on: T07.01.
  - Done when: Unique subscriber/creator pair and foreign keys are present.
  - Evidence: pending.
- [ ] T07.03 — Map the subscription entity/repository.
  - Estimate: 15–20 min. Depends on: T07.02.
  - Done when: No controller accesses the repository directly.
  - Evidence: pending.
- [ ] T07.04 — Add self-subscription service rejection.
  - Estimate: 15–20 min. Depends on: T07.03.
  - Done when: Same actor and creator are rejected with 400.
  - Evidence: pending.
- [ ] T07.05 — Implement idempotent subscription insert.
  - Estimate: 15–20 min. Depends on: T07.04.
  - Done when: Repeated PUT keeps one pair.
  - Evidence: pending.
- [ ] T07.06 — Implement idempotent subscription removal.
  - Estimate: 15–20 min. Depends on: T07.05.
  - Done when: Repeated DELETE leaves no pair and returns no-content.
  - Evidence: pending.
- [ ] T07.07 — Implement own paginated subscription query.
  - Estimate: 15–20 min. Depends on: T07.06.
  - Done when: Identity comes from the principal and ordering is stable.
  - Evidence: pending.
- [ ] T07.08 — Add subscribe/remove controller mappings.
  - Estimate: 15–20 min. Depends on: T07.07.
  - Done when: DTO/status/CSRF policy follows the agreed contract.
  - Evidence: pending.
- [ ] T07.09 — Add own-list and state controller mappings.
  - Estimate: 15–20 min. Depends on: T07.08.
  - Done when: Unauthenticated callers receive 401 with otherwise valid request context.
  - Evidence: pending.
- [ ] T07.10 — Add subscription client methods.
  - Estimate: 15–20 min. Depends on: T07.09.
  - Done when: Requests reuse auth and API utilities.
  - Evidence: pending.
- [ ] T07.11 — Render subscribe button states.
  - Estimate: 15–20 min. Depends on: T07.10.
  - Done when: Pending/error/selected labels are exposed accessibly.
  - Evidence: pending.
- [ ] T07.12 — Render My subscriptions list.
  - Estimate: 15–20 min. Depends on: T07.11.
  - Done when: Empty and populated responses use public creator links.
  - Evidence: pending.
- [ ] T07.13 — Add public creator summary retrieval.
  - Estimate: 15–20 min. Depends on: T07.12.
  - Done when: DTO exposes no email or private collection data.
  - Evidence: pending.
- [ ] T07.14 — Add public creator video-list retrieval.
  - Estimate: 15–20 min. Depends on: T07.13.
  - Done when: Only public video summaries are returned with pagination.
  - Evidence: pending.
- [ ] T07.15 — Add a creator navigation destination.
  - Estimate: 15–20 min. Depends on: T07.14.
  - Done when: Subscription cards resolve to the correct creator content.
  - Evidence: pending.
- [ ] T07.16 — Test subscription uniqueness with PostgreSQL.
  - Estimate: 15–20 min. Depends on: T07.15.
  - Done when: Concurrent duplicate writes retain one relationship.
  - Evidence: pending.
- [ ] T07.17 — Test private-list account isolation.
  - Estimate: 15–20 min. Depends on: T07.16.
  - Done when: Another principal cannot retrieve the target user's private list.
  - Evidence: pending.

## P08 — Sort Search Results by Most Liked and Most Viewed

Requirement: RF-08 (all AC). Design: [P08](plan.md#p08). Integration dependencies: P00 search contract; P12 filter contract; P17 measurements.

- [ ] T08.01 — Define the shared search sort allowlist.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: relevance/likes/views/newest/oldest and invalid-value behaviour are documented.
  - Evidence: pending.
- [ ] T08.02 — Add request parsing for sort.
  - Estimate: 15–20 min. Depends on: T08.01.
  - Done when: Unknown values return 400 and default preserves relevance.
  - Evidence: pending.
- [ ] T08.03 — Create a known-metrics search fixture.
  - Estimate: 15–20 min. Depends on: T08.02.
  - Done when: Likes/views/ties/zero counts have expected IDs.
  - Evidence: pending.
- [ ] T08.04 — Add likes aggregate to the search query.
  - Estimate: 15–20 min. Depends on: T08.03.
  - Done when: Counts represent positive ProTube reactions without join multiplication.
  - Evidence: pending.
- [ ] T08.05 — Add view aggregate to the search query.
  - Estimate: 15–20 min. Depends on: T08.04.
  - Done when: Imported counters remain excluded.
  - Evidence: pending.
- [ ] T08.06 — Implement explicit popularity ordering.
  - Estimate: 15–20 min. Depends on: T08.05.
  - Done when: Selected metric precedes stable ID ties.
  - Evidence: pending.
- [ ] T08.07 — Share predicates between rows and COUNT.
  - Estimate: 15–20 min. Depends on: T08.06.
  - Done when: Text/tags/audience constraints match totalElements.
  - Evidence: pending.
- [ ] T08.08 — Serialize sort in the catalogue client.
  - Estimate: 15–20 min. Depends on: T08.07.
  - Done when: Existing repeated tags and page parameters remain intact.
  - Evidence: pending.
- [ ] T08.09 — Render the sort selector.
  - Estimate: 15–20 min. Depends on: T08.08.
  - Done when: Selection changes sort and resets page to zero.
  - Evidence: pending.
- [ ] T08.10 — Synchronise catalogue criteria with the URL.
  - Estimate: 15–20 min. Depends on: T08.09.
  - Done when: Back/forward restores query/tags/audience/sort/page.
  - Evidence: pending.
- [ ] T08.11 — Test a combined text/tag/popularity request.
  - Estimate: 15–20 min. Depends on: T08.10.
  - Done when: Expected global ordering holds beyond the first page.
  - Evidence: pending.
- [ ] T08.12 — Test stale search-response rejection.
  - Estimate: 15–20 min. Depends on: T08.11.
  - Done when: An older request cannot replace the current results.
  - Evidence: pending.

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

- [ ] T10.01 — Audit reaction timestamp availability.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Need for an additive timestamp migration is recorded.
  - Evidence: pending.
- [ ] T10.02 — Add reaction timestamp persistence if missing.
  - Estimate: 15–20 min. Depends on: T10.01.
  - Done when: New likes have ordering data without changing reaction uniqueness.
  - Evidence: pending.
- [ ] T10.03 — Write own-liked-video paginated query.
  - Estimate: 15–20 min. Depends on: T10.02.
  - Done when: Only active LIKE entries for the principal are returned.
  - Evidence: pending.
- [ ] T10.04 — Expose own-liked-video DTO endpoint.
  - Estimate: 15–20 min. Depends on: T10.03.
  - Done when: Response uses the shared page envelope.
  - Evidence: pending.
- [ ] T10.05 — Add liked-video client/hook.
  - Estimate: 15–20 min. Depends on: T10.04.
  - Done when: Cancellation and loading/error/empty states are provided.
  - Evidence: pending.
- [ ] T10.06 — Render profile Liked videos entry.
  - Estimate: 15–20 min. Depends on: T10.05.
  - Done when: It opens the own collection.
  - Evidence: pending.
- [ ] T10.07 — Render liked-video page and pagination.
  - Estimate: 15–20 min. Depends on: T10.06.
  - Done when: Cards link to matching video IDs.
  - Evidence: pending.
- [ ] T10.08 — Invalidate collection after unlike/dislike.
  - Estimate: 15–20 min. Depends on: T10.07.
  - Done when: Refetch removes the no-longer-liked video.
  - Evidence: pending.
- [ ] T10.09 — Test private liked-list isolation.
  - Estimate: 15–20 min. Depends on: T10.08.
  - Done when: Caller-selected identity cannot expose another account's collection.
  - Evidence: pending.
- [ ] T10.10 — Test deleted liked video removal.
  - Estimate: 15–20 min. Depends on: T10.09.
  - Done when: No broken card appears after reload.
  - Evidence: pending.

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

- [ ] T16.01 — Inventory hardcoded text by route.
  - Estimate: 15–20 min. Depends on: T00.07 and the group contract dependencies.
  - Done when: Strings are grouped into navigation, account, catalogue, player and library namespaces.
  - Evidence: pending.
- [ ] T16.02 — Choose a minimal localisation adapter.
  - Estimate: 15–20 min. Depends on: T16.01.
  - Done when: Existing dependencies are checked and any new dependency is justified.
  - Evidence: pending.
- [ ] T16.03 — Create typed catalogue keys and Spanish fallback.
  - Estimate: 15–20 min. Depends on: T16.02.
  - Done when: Unknown keys have a controlled fallback and missing-key detection.
  - Evidence: pending.
- [ ] T16.04 — Create Catalan catalogue skeleton.
  - Estimate: 15–20 min. Depends on: T16.03.
  - Done when: Key parity with the fallback catalogue is enforced.
  - Evidence: pending.
- [ ] T16.05 — Create English catalogue skeleton.
  - Estimate: 15–20 min. Depends on: T16.04.
  - Done when: Key parity with the fallback catalogue is enforced.
  - Evidence: pending.
- [ ] T16.06 — Implement locale preference resolution.
  - Estimate: 15–20 min. Depends on: T16.05.
  - Done when: Manual preference precedes supported browser language and Spanish fallback.
  - Evidence: pending.
- [ ] T16.07 — Add persistent locale selection.
  - Estimate: 15–20 min. Depends on: T16.06.
  - Done when: Storage failure keeps the current locale in memory.
  - Evidence: pending.
- [ ] T16.08 — Render global language selector.
  - Estimate: 15–20 min. Depends on: T16.07.
  - Done when: Three language names and keyboard selection are accessible.
  - Evidence: pending.
- [ ] T16.09 — Update document language on selection.
  - Estimate: 15–20 min. Depends on: T16.08.
  - Done when: html.lang reflects es/ca/en.
  - Evidence: pending.
- [ ] T16.10 — Add shared date/number/plural formatting helpers.
  - Estimate: 15–20 min. Depends on: T16.09.
  - Done when: Formatting uses the current locale without changing stored data.
  - Evidence: pending.
- [ ] T16.11 — Map API error codes to translation keys.
  - Estimate: 15–20 min. Depends on: T16.10.
  - Done when: Known errors never display raw technical messages.
  - Evidence: pending.
- [ ] T16.12 — Test locale switch during playback/form editing.
  - Estimate: 15–20 min. Depends on: T16.11.
  - Done when: Video and unsaved values remain intact.
  - Evidence: pending.
- [ ] T16.13 — Test missing-key fallback and catalogue parity.
  - Estimate: 15–20 min. Depends on: T16.12.
  - Done when: Missing translations are reported before delivery.
  - Evidence: pending.

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
- [ ] T17.03 — Instrument SQL count for one catalogue request.
  - Estimate: 15–20 min. Depends on: T17.02.
  - Done when: Count and query categories are captured without secrets.
  - Evidence: pending.
- [ ] T17.04 — Record HTTP and backend timing separately.
  - Estimate: 15–20 min. Depends on: T17.03.
  - Done when: Measurement locations and warm/cold states are identified.
  - Evidence: pending.
- [ ] T17.05 — Launch baseline benchmark runs.
  - Estimate: 15–20 min. Depends on: T17.04.
  - Done when: Three run IDs and identical configuration are recorded.
  - Evidence: pending.
- [ ] T17.06 — Collect baseline p50/p95/errors.
  - Estimate: 15–20 min. Depends on: T17.05.
  - Done when: Actual measurements are stored or the collection stays pending.
  - Evidence: pending.
- [ ] T17.07 — Capture the current catalogue query plan.
  - Estimate: 15–20 min. Depends on: T17.06.
  - Done when: Plan and dataset reference are attached.
  - Evidence: pending.
- [ ] T17.08 — Replace per-video reaction counts with one batch aggregate.
  - Estimate: 15–20 min. Depends on: T17.07.
  - Done when: Counts match the known fixture and query count is bounded.
  - Evidence: pending.
- [ ] T17.09 — Replace per-video comment counts with one batch aggregate.
  - Estimate: 15–20 min. Depends on: T17.08.
  - Done when: Deleted-comment semantics remain correct.
  - Evidence: pending.
- [ ] T17.10 — Replace per-video play counts with one batch aggregate.
  - Estimate: 15–20 min. Depends on: T17.09.
  - Done when: Only ProTube reproduction events are counted.
  - Evidence: pending.
- [ ] T17.11 — Batch-load tags for the current result page.
  - Estimate: 15–20 min. Depends on: T17.10.
  - Done when: No lazy tag query is issued per row.
  - Evidence: pending.
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
- [ ] T17.15 — Launch the matching final benchmark runs.
  - Estimate: 15–20 min. Depends on: T17.14.
  - Done when: Dataset/client/workload match baseline and run IDs are recorded.
  - Evidence: pending.
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

From the repository root, run `python tooling/database/compare_catalogue.py --output ../scrum58-comparison` with Java 21, Maven and Docker available. Choose a new output directory. The [comparison runner](../../tooling/database/compare_catalogue.py) extracts the baseline backend at `2ef450d`, copies the same workload and fixture into it, then runs `mvn -Dtest=CatalogueBenchmarkIT test` sequentially for both versions. It retains both logs and checks the response hashes, samples, SQL bound and p95 targets in every measured round. Its parser and rejection cases were exercised with synthetic logs. Each invocation starts its own PostgreSQL Testcontainer. The in-process client uses the actual HTTP endpoint on a random loopback port. Ten workers cycle through the first page, a title/tag search, page two, and a detail request. The run prints isolated service times and statement counts first, then stable response hashes and HTTP results per route. Exclude warm-up (round 0, 30 seconds). Compare rounds 1–3 (300 seconds each) and their error counts, p50/p95 and hashes. For each 24-card listing/search operation check the 1,000 ms budget and, when the baseline exceeds it, the 30% reduction. Fixed data and concurrent readers exercise read consistency. Concurrent writes, private collections, production network latency and post-idle startup require separate evidence.

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

#### Candidate verification

| RF-17 criteria | Evidence | Status |
|---|---|---|
| AC2–4 | Two CatalogueSummaryTest cases passed with Surefire. They exercise mapping by ID, ordering, absent groups, zero counts and the empty-page path. Hibernate 6.5.2 translated all four JPQL reads with the PostgreSQL dialect. | Implemented. The end-to-end six-statement bound still needs CatalogueQueryCountTest. |
| AC1, AC5, AC6, AC8 | Reproducible pre-change HTTP sample, shared read-only SQL cross-check and a deterministic isolated workload. | Candidate HTTP p50/p95 and reduction are pending. |
| AC7 | Concurrent read workload compares each response with its warmed reference. | Pending isolated execution. |

Java 21 compilation of all production and test sources succeeded with the Eclipse compiler. The default Maven clean verify failed in javac while resolving Windows file paths. Running Surefire on the compiled classes reached the tests. The initial full run recorded 192 tests, 86 errors and one skip. Testcontainers could not start PostgreSQL because Docker Engine access was denied in this session. Separate MediaStorageServiceTest cases also encountered Windows temporary-directory access errors. The two focused unit tests added afterward passed. An explicit CatalogueBenchmarkIT invocation stopped during container startup, before any timed samples. The integration gate and the benchmark remain open.

## P16 — Additional translation slices

Depend on T16.13 and the corresponding UI group. Each slice covers at most 15 short strings; repeat with stable child IDs when a namespace is larger.

- [ ] T16.14 — navigation: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.15 — navigation: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.16 — navigation: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.17 — navigation: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.18 — account: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.19 — account: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.20 — account: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.21 — account: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.22 — catalogue: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.23 — catalogue: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.24 — catalogue: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.25 — catalogue: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.26 — player: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.27 — player: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.28 — player: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.29 — player: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.30 — comments: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.31 — comments: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.32 — comments: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.33 — comments: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.34 — creator-management: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.35 — creator-management: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.36 — creator-management: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.37 — creator-management: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.38 — subscriptions: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.39 — subscriptions: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.40 — subscriptions: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.41 — subscriptions: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.42 — personal-library: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.43 — personal-library: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.44 — personal-library: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.45 — personal-library: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.46 — voice-and-errors: extract-keys for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded batch of hardcoded labels is replaced with stable keys without remounting UI.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.47 — voice-and-errors: Spanish for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Spanish translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.48 — voice-and-errors: Catalan for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded Catalan translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.
- [ ] T16.49 — voice-and-errors: English for one <=15-string batch.
  - Estimate: 15–20 min. Depends on: T16.13 and the implemented namespace controls; translation follows key extraction for that namespace.
  - Done when: One bounded English translation batch includes visible and accessible labels and is reviewed in context.
  - Evidence: pending; record covered keys and remaining batches.

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
| RF-01 | T01.* + relevant QA | CrossDevicePersistence + isolated restore manifest; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-02 | T02.* + relevant QA | AccountAvatarUploadRollback + restart; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-03 | T03.* + relevant QA | CatalogueResponsive + ThemeContrast; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-04 | T04.* + relevant QA | FiveLineOverflow + RecommendationEligibility; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-05 | T05.* + relevant QA | ReactionTransitions + StaleResponse; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-06 | T06.* + relevant QA | ThreadResponsive + DraftFailure; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-07 | T07.* + relevant QA | SubscriptionUniqueness + OwnListIsolation; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-08 | T08.* + relevant QA | CombinedPopularitySearch + MultiPageTies; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-09 | T09.* + relevant QA | PublicationSort + EditPreservesDate; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-10 | T10.* + relevant QA | LikedListIsolation + UnlikeRefresh; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-11 | T11.* + relevant QA | OwnerMetadataDelete + SafeMediaCleanup; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-12 | T12.* + relevant QA | AudienceMigration + CombinedFilter; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-13 | T13.* + relevant QA | HistoryHideMetrics + SavedPersistence + QueueOrder; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-14 | T14.* + relevant QA | RoutePlaybackContinuity + SinglePlayId; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-15 | T15.* + relevant QA | KeyboardReaderJourney + VoiceFailures; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-16 | T16.* + relevant QA | LocaleParity + PreserveState; verify every numbered AC | Focused command/case to record; full area checks in plan.md | Not run |
| RF-17 | T17.* + relevant QA | RepeatableBenchmark + QueryCountBound | [Catalogue checkpoint](#scrum-58-catalogue-checkpoint) | Partial. PostgreSQL integration and isolated before/after timing pending. |

## Documentation handoff and current verdict

- Prepared: spec/plan/task documents with all 17 requirements and small work slices.
- Document verification: identifier uniqueness, <=20-minute estimate bounds, requirement/design coverage and local link existence checked by the authoring script; no application checks executed.
- Feature implementation: not started in this request; all checkboxes intentionally open.
- Team approval/ownership/remote CI/merge/staging: unverified or pending; no reservation claimed.
- Next step: select the first implementation slice and establish P00 contracts/ownership before changing runtime code.
- Verdict: planning documents prepared; Sprint 4 features not validated.
