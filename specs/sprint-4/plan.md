# Plan — Sprint 4

Spec: [spec.md](spec.md) | Execution/evidence: [task.md](task.md).
Status: sprint plan. See [task.md](task.md) for per-slice implementation and validation evidence.
Baseline: ed0bd16, feature/shared-database-supabase, initially clean working tree on 2026-11-18. No remote tracker or PR coordination was verified. Responsible member/reviewer remain unassigned.

## Architecture and existing implementation

Keep Java 21/Spring Boot/Maven, React/TypeScript/Vite, PostgreSQL/Flyway and existing authentication. Controllers map HTTP/validation/DTOs; services own business rules; repositories own persistence. Frontend network access stays in reusable clients/hooks. Read [AGENTS.md](../../AGENTS.md), [constitution](../../.agents/constitution.md), [SDD](../../docs/SDD.md) and nested area instructions before implementation.

The inspected checkout already contains registration/profile/avatar updates, multipart uploads and recovery, reactions, threaded comments, plays/history, metadata PATCH/DELETE, paginated text/tag search and theme controls. Supabase hosting currently concerns the database; backend/media remain local according to the handoff. Existing source/documentation evidence is not proof of a passing Sprint 4 test. Recheck branch-specific source before implementing each slice.

The user explicitly requests English and task.md (singular), following Sprint 2. These choices take precedence over the general Spanish EARS/tasks.md template convention. No duplicate tasks.md is created.

## Proposed shared HTTP/data contracts

These additions are proposed, not claims of existing routes. Existing auth, reaction, comment and upload contracts remain authoritative. Freeze the additions in P00 before implementation; preserve current error envelopes with stable translatable codes.

| Operation | Contract | Permission / result |
| --- | --- | --- |
| Catalogue | GET /api/videos?q=&tag=&sort=relevance&page=0&size=24&audience=ALL | Public; existing page envelope; size 1..100; allowlisted sort relevance/likes/views/newest/oldest; audience ALL/CHILDREN/NOT_CHILDREN. Invalid input 400. |
| Recommendations | GET /api/videos/{id}/recommendations?audience=ALL | Public, non-cacheable array of <=8 cards (id, title, thumbnailUrl), ranked for the signed-in principal when available; unknown source 404; no matches 200 []. |
| Subscription state | GET /api/users/{creatorId}/subscription | Own authenticated state {subscribed}; 401 anonymous, 404 unknown creator. |
| Subscribe / remove | PUT or DELETE /api/users/{creatorId}/subscription | Principal + CSRF; 204 idempotent; 400 self-subscribe; 404 unknown creator. |
| Own subscriptions | GET /api/users/me/subscriptions?page=&size= | Private page of public creator summaries; newest followed first, creator ID ties. |
| Public creator | GET /api/creators/{id}; GET /api/creators/{id}/videos?page=&size= | Public id/displayName/avatarUrl/description and public video page only; never email/private account fields. |
| Own collections | GET /api/users/me/liked-videos, /videos, /watch-later, /watch-history with page/size | Principal-derived VideoPage-like responses; history adds lastPlayedAt, saved lists add savedAt. No caller-selected owner. |
| Watch Later writes | PUT or DELETE /api/users/me/watch-later/{videoId} | Principal + CSRF; idempotent 204; add unknown video 404. |
| Hide history | DELETE /api/users/me/watch-history/{videoId} | Principal + CSRF; 204; preserve playback events/counts. |
| Metadata | Existing PATCH /api/videos/{id}, additive category/audience support | Owner + CSRF; 200 detail; absent fields unchanged; invalid value 400. |
| Thumbnail | PUT /api/videos/{id}/thumbnail multipart file; DELETE same path | Proposed owner + CSRF operation; 200 updated detail; validate existing image policy; retain video bytes. |
| Deletion | Existing DELETE /api/videos/{id} | Owner + CSRF; 204; absent target 404, including repeated delete unless the team explicitly revises this contract. Cleanup retries are idempotent independently. |

Private endpoints: 401 missing identity, 403 forbidden actor/invalid CSRF, 404 absent resource, 400 invalid request, 409 business conflicts; infrastructure failure remains 5xx. Public reads never leak private collections. Existing GET /api/users/{id}/watch-history must retain its owner check while new paginated /me route is introduced; migrate frontend consumers and do not silently change old response shape.

Additive schema candidates: subscriptions(subscriber_id,creator_id,created_at,unique pair), watch_later(user_id,video_id,created_at,unique pair), audience on videos, missing timestamps only after audit, private history visibility/cutoff, durable managed-media cleanup intents. Reserve real Flyway versions during implementation, not in this document. Validate existing rows and an empty schema; retain old applied migrations. Media stays under ENV_PROTUBE_STORE_DIR, paths checked against the resolved store; no binary files in Git. Cleanup window proposal: <=24 hours after committed deletion, with retries and preserved failure evidence.

## P00 — Shared contracts and preparation

Agree ownership per task and exact shared symbols in the tracker before code edits. Record contract examples, migration reservations, locale namespaces, player identity and benchmark conditions. No tracker publication, deployment, commit or implementation is performed by this planning request. Prepare i18n/theme/player interfaces early so independent UI work does not require redesign later.

## Implementation points

The 17 points map one-to-one to RF-01..RF-17 and task groups T01..T17. Dependencies below identify integration requirements; contract work can precede completed implementations. In particular P13/P14 agree a contract in P00, then independently build queue reducer/player shell before integration; there is no cyclic implementation dependency.

<a id="p01"></a>
### P01 — Complete the Shared Cloud Database and Application Environment

- Requirements: RF-01, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: Shared Compose, deployment runbook, external media store.
- Design: Reuse compose.supabase.yaml and existing credentials launcher. Consolidate exports in isolation; one hosted backend writes the shared media store. No live migration is executed by this documentation task.
- Dependencies: none.
- Work slices: T01.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-01 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p02"></a>
### P02 — Verify Reliable Storage of Registration, Profiles and Uploads

- Requirements: RF-02, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: UserService, VideoUploadService, MediaStorageService; profile/upload clients.
- Design: Audit and repair individual failures rather than rebuild persistence. Keep commit/rollback manifests; add a logical submission guard only if duplicate-submit tests expose a gap.
- Dependencies: P01 for shared verification.
- Work slices: T02.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-02 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p03"></a>
### P03 — Improve the Main Page UI/UX and Responsive Layout

- Requirements: RF-03, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: App.tsx, App.css, public/themes.css, theme hook and catalogue components.
- Design: Reuse semantic tokens and add high contrast as a distinct preference. Grid/layout updates preserve catalogue request state.
- Dependencies: P00 contracts; P16 adapter for translated UI.
- Work slices: T03.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-03 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p04"></a>
### P04 — Improve the Video Page, Recommendations and Description

- Requirements: RF-04, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: VideoPlayerPage, description component, recommendation query/service/client.
- Design: Aggregate tag frequencies from the last 20 session-owned watch events and use the score before the contextual ranking. Use a portrait-only top-three comment preview ordered by likes then ID. Keep desktop recommendations beside the player.
- Contextual selection: shared tags, category, recent fallback, stable ID ties. Observe rendered overflow and resize for five-line disclosure.
- Dependencies: P12 audience contract; P14 shell contract.
- Work slices: T04.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-04 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p05"></a>
### P05 — Improve the Like/Dislike Interface

- Requirements: RF-05, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: VideoPlayerPage reactions and theme styles.
- Design: Reuse existing reaction endpoints, uniqueness and aria-pressed. Present pending state and reject stale results by video/account identity.
- Dependencies: P03 visual tokens.
- Work slices: T05.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-05 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p06"></a>
### P06 — Improve the Comment Section

- Requirements: RF-06, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: CommentSection, comments.css, useComments.
- Design: Preserve current flat response/tree building, soft deletion and sibling ordering. Change presentation/focus without a silent pagination or threading contract change.
- Dependencies: P03 visual tokens.
- Work slices: T06.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-06 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p07"></a>
### P07 — Implement Subscriptions to Creators

- Requirements: RF-07, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: New subscription persistence/service/controller/client; creator and profile UI.
- Design: `GET /api/users/{id}/subscription` returns `{ "subscribed": false }` for a known creator without a current relationship. PUT and DELETE return 204 and require CSRF; 400 on self-mutation, 404 for an unknown creator. `GET /api/users/me/subscriptions` returns `{ content, page, size, hasNext, totalElements }` with public creator objects `{ id, displayName, avatarUrl, description }`. Both authenticated GET routes send `Cache-Control: no-store`; no request selects a subscriber.
- Public creator endpoints return the same creator object and a bounded page of `{ id, title, thumbnailUrl }` videos. Default `page=0`, `size=24`; size 1–100, and negative pages or unsupported offsets return 400. Public video order is newest first, then video ID.
- Persistence: additive Flyway V9 on this branch, two cascading account references, a unique pair and a database self-check. Atomic `ON CONFLICT DO NOTHING` keeps the original follow date. Own lists sort by timestamp descending and creator ID ascending. Recheck the migration number against teammates’ branches before integration.
- UI: add `/subscriptions` and `/creators/:id`, a menu entry, and the subscription control beside the player’s creator identity and on the public page. Mutation errors retain the last confirmed state. Use subscription-scoped Spanish, Catalan and English strings selected from browser language preferences until P16 provides the application-wide locale adapter.
- Dependencies: P00 identity/contracts; P16 adapter.
- Work slices: T07.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-07 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p08"></a>
### P08 — Sort Search Results by Most Liked and Most Viewed

- Requirements: RF-08, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: VideosController, VideoService, repository search fragment; useAllVideos and SearchBar.
- Design: Allowlisted sort; predicates shared by result and COUNT; aggregate before limit/offset. Explicit sort supersedes relevance; preserve exact case-insensitive tag OR and text AND.
- Dependencies: P00 search contract; P12 filter contract; P17 measurements.
- Work slices: T08.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-08 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p09"></a>
### P09 — Sort Search Results by Newest and Oldest

- Requirements: RF-09, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: Video publication metadata, search repository and sort UI.
- Design: Use ProTube publication instant, never updatedAt or an external source date. Inspect existing data before any additive/backfill migration; unknown-date provenance is documented.
- Dependencies: P08 sort parser.
- Work slices: T09.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-09 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p10"></a>
### P10 — Display Liked Videos in the User Profile

- Requirements: RF-10, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: Reaction repository, own-collection DTO/controller/client, ProfilePage.
- Design: `GET /api/users/me/liked-videos?page=0&size=24` uses the session principal and returns the shared page fields `content`, `page`, `size`, `hasNext` and `totalElements`. Each entry contains `id`, `title` and nullable `thumbnailUrl`. Use `Cache-Control: no-store`; anonymous requests return 401, invalid page or size returns 400, and empty or out-of-range pages return 200. Accept size 1–100 and a non-negative page within the supported database offset.
- Data: Page over existing positive `video_likes` joined to `videos`, ordered by `created_at` descending and video ID ascending. Reuse the saved timestamp and the existing cascade on video deletion. Update the timestamp atomically only when a stored dislike becomes a like. A repeated positive like keeps its timestamp. Existing rows keep their stored date. No migration is needed for this slice.
- UI: Add a collapsible collection to the existing profile, with thumbnail/title links, loading, empty, retry and pagination states. Fetch each time the collection opens, including on return from the player, and after session revalidation while open. Cancel obsolete requests and keep the collection scoped to the confirmed account. Reuse the existing player and reaction HTTP contract.
- Player toggle: Resolve the selected state against the singular `LIKE` or `DISLIKE` value. Pressing the selected button sends DELETE to its existing path. Pressing the other button sends POST and switches the reaction. The player control keeps its existing labels and layout.
- Dependencies: P05 reaction contract; P00 page DTO.
- Work slices: T10.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-10 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p11"></a>
### P11 — Complete Video Editing and Deletion for Owners

- Requirements: RF-11, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: VideoService/metadata editor, own-list UI, MediaStorageService cleanup.
- Design: Extend existing PATCH/DELETE and owner guards. Thumbnail replacement uses a separate multipart operation. Deletion persists recoverable cleanup intent; worker rechecks references and store containment before deleting managed bytes.
- Dependencies: P12 audience data; P00 contracts; P13 list contracts.
- Work slices: T11.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-11 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p12"></a>
### P12 — Implement Audience Labels and Content Filtering

- Requirements: RF-12, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: Video entity, new Flyway migration, upload/update DTOs, catalogue filters.
- Design: Persist CHILDREN/NOT_CHILDREN/UNCLASSIFIED separately from category. Legacy default is UNCLASSIFIED; new uploads require a chosen classified value. One eligibility predicate also serves recommendations.
- Dependencies: P00 filter contract.
- Work slices: T12.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-12 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p13"></a>
### P13 — Extend Watch History and Implement Watch Later and a Queue

- Requirements: RF-13, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: Playback/history repositories, Watch Later relationship, shared queue state and collection UI.
- Design: Separate visible history cutoff from immutable playback metrics. New play after cutoff restores visibility. Watch Later uses unique user/video rows. Queue is tab-session state with account isolation and keyboard reordering.
- Dependencies: P00 collection contracts; P14 for queue playback integration.
- Work slices: T13.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-13 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p14"></a>
### P14 — Implement a Persistent Mini-player and Picture-in-Picture

- Requirements: RF-14, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: App-level playback provider/shell, VideoPlayerPage, queue integration.
- Design: One persistent HTML video element lives outside unmounted routes. Route metadata and source changes are distinct; preserve playId when minimising. Native PiP is optional capability of the same element.
- Dependencies: P00 playback contract; P13 queue reducer contract.
- Work slices: T14.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-14 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p15"></a>
### P15 — Improve Screen-Reader Accessibility and Add Voice Search

- Requirements: RF-15, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: App landmarks, shared controls, SearchBar and new recognition hook.
- Design: Use semantic HTML before ARIA. Voice adapter owns lifecycle and only fills editable query; explicit search submits. Mock recognition in component tests and record real browser/reader limitations.
- Dependencies: P00 accessibility contract; P16 locale adapter.
- Work slices: T15.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-15 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p16"></a>
### P16 — Implement Spanish, Catalan and English Localisation

- Requirements: RF-16, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: New locale adapter/catalogues, shared formatters and language selector.
- Account default (user clarification, 2026-11-25): optional `preferredLanguage` in registration and private UserResponse, allowlisted es/ca/en. Nullable app_users.preferred_language via new V11 migration; existing accounts remain null. Resolve a manual browser preference scoped to account ID, then account preference, then Spanish. Anonymous preference has a separate key. Do not consult navigator.languages. Failed storage keeps the selection in memory. Rechecks of the same session preserve a manual selection; changing identity resolves the new account's preference.
- Adapter: a small identity-scoped store connected through React useSyncExternalStore, typed catalogues and Intl, reusing installed dependencies. No new production dependency. The inventory groups navigation, account, catalogue, player, comments, upload, profile, analytics and library strings. Locale changes rerender without keying/remounting forms or media. API codes/status map to controlled translated messages, never arbitrary server text.
- Design: Justify dependency choice before installation. Namespace translations by route, preserve component identity on locale changes, translate errors through stable codes and accessible labels too.
- Dependencies: P00 locale contract.
- Work slices: T16.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-16 validation row; existing behaviour is retained unless the spec explicitly changes it.

<a id="p17"></a>
### P17 — Optimise Database Queries and Supabase Performance

- Requirements: RF-17, all numbered acceptance criteria in [spec.md](spec.md).
- Areas: VideoService.toSummary, repository aggregates/indexes, benchmark harness.
- Design: Baseline first: inspect four per-video COUNT operations and lazy tags. Use page-scoped aggregates/projections, not parallel remote queries per card. Index only measured predicates; compare identical workloads.
- Dependencies: P00 dataset contract; P08/P09/P10/P13 final queries for final run.
- Work slices: T17.01 onward in [task.md](task.md).
- Verification: targeted component/service tests plus the RF-17 validation row; existing behaviour is retained unless the spec explicitly changes it.

#### SCRUM-58 catalogue implementation

Validation continuation (22 November): reuse the completed baseline/candidate logs, including UTF-16 BOM output from Windows PowerShell. The runner must offer an offline comparison mode that needs neither Maven nor Docker and emits the same acceptance checks and source-log fingerprints. Launch focused benchmarks with `test-compile surefire:test`: the phase `test` binds global JaCoCo checks and is inappropriate for a single workload. Keep `pom.xml` and the full-suite coverage gates unchanged. Verify invocation, encoding, completeness and rejection paths with focused Python tests; preserve the completed load runs rather than repeating them.

Keep the two existing paged searches, ranking and counts. After selecting the page, read only its IDs in four queries for tag names, reactions by type, visible comments and plays. Build DTOs in the original order with natural Java tag ordering and zeros for absent groups. An empty page needs no enrichment. Keep these reads in the existing service transaction. Verify the actual statement bound with Hibernate statistics after clearing the persistence context and compare public response hashes independently of timing. Use an isolated 537-video fixture for the agreed load test and the read-only probe for the existing 74-video sample. Record both sets of results separately. P08/P09 ordering and the P10/P13 collections stay with their tickets.

## Verification and execution order

Start P00, P01 inventory, P02 persistence audits and P17 baseline. Establish P16 locale adapter/P03 tokens/P14 player contract early. Then P12/P08/P09 contracts and queries, UI P03..P06, subscriptions/collections/management, and P13/P14 integration. Finish each feature with its AC evidence, then integrated QA. No publication or live migration follows merely from preparing this plan.

Commands for later implementation (not executed during documentation authoring):

| Area / directory | Command | Purpose |
| --- | --- | --- |
| backend | mvn clean verify | Java tests, isolated PostgreSQL/Testcontainers and configured JaCoCo gates; Docker required. |
| frontend | npm run build | Typecheck and production compilation. |
| frontend | npm run test -- --coverage --watchAll=false --ci | Mocked API-boundary component/hook tests and coverage. |
| frontend | npm run lint | Existing lint gates. |
| e2e | Inspect e2e/package.json and e2e/README.md before selecting the existing isolated runner | Never invent an E2E command or run against shared data. |

Record exact focused test command and actual case name per task when implemented; proposed case identifiers in task.md are not existing files. Full suites may exceed 20 minutes of wall time: launching and inspecting their results are separate tasks, and passing evidence is required before closing validation. Unattended execution time is not hidden as a completed task.

## Constitution check and risks

1. Simplicity: retain stack and reuse implemented flows; review any dependency before adding it.
2. Spec first: all 17 RF map to a numbered design point and task group; implementation remains unstarted.
3. Responsibilities: services enforce ownership, repositories query, public DTOs and reusable frontend clients preserve boundaries.
4. Evidence: all feature checkboxes start unchecked; commands, results, failures and pending gates are recorded honestly.
5. Data/work protection: backups/restoration before consolidation, additive migrations, one media writer, external validated paths, no secrets or destructive live tests.
6. Traceability: [handoff](../../docs/ai/tasks/sprint4-specs.md), [prompt](../../prompts/25-sprint4-specs-plan-tasks.md), RF -> P -> T mapping. No owner reservation, team approval, PR review or staging outcome is presumed.

Risks: remote latency versus SQL cost; inconsistent source data/Flyway histories; files outside shared DB; media cleanup references; stale frontend responses; browser-specific speech/PiP; unknown device access; shared App.tsx/VideoService/DTOs/CSS/migrations touched by multiple stories. Mitigate with isolated rehearsals, explicit contracts, single-writer recovery, capability detection, precise task ownership and measured results. Do not switch back to an older local database without reconciling writes made to the cloud.
