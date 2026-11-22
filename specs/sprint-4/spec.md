# Specification — Sprint 4

Status: specified for planning; no implementation or feature validation claimed.
Request: Sprint 4 backlog and English planning document discussed on 2026-11-18.
[Plan](plan.md) | [Tasks/evidence](task.md) | [Constitution](../../.agents/constitution.md) | [Instructions](../../AGENTS.md) | [Requirements](../../REQUIREMENT.md).

## Sprint goal

The goal of this sprint is to make ProTube a reliable, shared and accessible video platform where users can discover, watch, manage and return to content across desktop, tablet and mobile devices. The team will complete the shared cloud environment, verify persistent storage of accounts and media, improve discovery and playback, and introduce subscriptions and personal video collections. The sprint also includes continuous playback while browsing, Spanish/Catalan/English interface support, accessibility improvements and measurable database performance improvements.

Existing functionality should be reviewed, extended and verified rather than implemented again. Registration, profile/avatar editing, uploads, reactions, comments, playback recording and video metadata management already have implementations in the inspected project. The acceptance criteria below describe the required Sprint 4 outcome, not functionality claimed to be completed or tested.


## Requirement origins

RF-01/02/17 support NFR-01..05; RF-02 also US-01..03/06; RF-03/04/05 support US-04/05; RF-06 supports US-09/10; RF-08/09/12 extend US-08; RF-10/13 extend US-03; RF-11 extends US-06/07. RF-07/14/15/16 and additional audience/library behaviour are explicit Sprint 4 improvements, not previously fulfilled MVP claims. NFR-06/07 and repository coordination apply throughout.

## Functional requirements and acceptance

### RF-01 — Complete the Shared Cloud Database and Application Environment

When an eligible actor invokes this capability, the system shall make the same persisted records and media available to all agreed team clients. The observable scenarios and exceptions below define this requirement.

**User story:**

As a team member, I want all members to use the same shared data and media environment so that accounts, videos and changes are consistently available across devices.

**Main use case:**

One member creates or updates content through the shared application. Another member accesses it from a different device. After the application restarts, both can still access the same information and files.

**Acceptance criteria:**

- **RF-01.AC1:** All team members can access the same agreed shared dataset through the application.
- **RF-01.AC2:** Data created or modified by one member becomes visible to another member after refreshing or retrieving it again.
- **RF-01.AC3:** Videos, thumbnails and avatars are accessible from other devices, not only from the computer that uploaded them.
- **RF-01.AC4:** Database records and media files survive application and host restarts through persistent storage.
- **RF-01.AC5:** Existing data sources are inventoried and reconciled; unresolved conflicts are documented before migration is declared complete.
- **RF-01.AC6:** A backup has been restored successfully in an isolated environment.
- **RF-01.AC7:** Invalid shared configuration produces a clear failure rather than silently connecting to a separate local database.
- **RF-01.AC8:** Credentials are not committed, exposed in frontend bundles or printed in logs.
- **RF-01.AC9:** Automated tests use isolated databases and media directories rather than the team's shared data.

**Architecture clarification:** A static frontend host alone cannot run the Spring Boot backend. The proposed deployment uses a shared application server with persistent media storage and Supabase PostgreSQL. Keep one writer per media store, consistent with the existing recovery design. An alternative object-storage integration would require its own implementation tasks.

### RF-02 — Verify Reliable Storage of Registration, Profiles and Uploads

When an eligible actor invokes this capability, the system shall preserve valid account, profile and upload changes consistently across sessions and restarts. The observable scenarios and exceptions below define this requirement.

**User story:**

As a user, I want my account, profile and uploaded content to be stored reliably so that I do not lose information or publish incomplete videos.

**Main use case:**

A visitor registers, edits their profile and avatar, uploads a video, signs out and returns from another browser. Their saved information and playable content remain available.

**Acceptance criteria:**

- **RF-02.AC1:** Valid registration creates a persistent account that can log in after an application restart.
- **RF-02.AC2:** Duplicate or invalid registration does not create partial or duplicate accounts.
- **RF-02.AC3:** Saved profile information and avatar changes remain correct after refresh, a new login and access from another device.
- **RF-02.AC4:** Failed avatar replacement preserves the previously saved profile and image.
- **RF-02.AC5:** A successful upload is associated with the authenticated owner and remains playable after a restart.
- **RF-02.AC6:** Failed uploads do not expose incomplete videos in the catalogue; temporary files are removed or tracked for recovery.
- **RF-02.AC7:** Retrying the same interrupted submission does not accidentally publish duplicate videos.
- **RF-02.AC8:** Only the authenticated owner can modify their profile or content, including through direct API requests.
- **RF-02.AC9:** Loading, validation, progress, success and failure states reflect the actual server outcome.

### RF-03 — Improve the Main Page UI/UX and Responsive Layout

When an eligible actor invokes this capability, the system shall present a responsive, legible and accessible catalogue. The observable scenarios and exceptions below define this requirement.

**User story:**

As a visitor, I want a clear, attractive and accessible main page so that I can discover videos comfortably on any supported device.

**Main use case:**

A visitor opens the catalogue, searches, applies filters, changes the sort order, moves between pages and opens a video using a desktop, tablet or mobile screen.

**Acceptance criteria:**

- **RF-03.AC1:** Search, filters, sorting and pagination remain easy to identify and operate.
- **RF-03.AC2:** The layout works at reference widths of 320, 375, 768, 1024 and 1440 CSS pixels without page-level horizontal overflow or overlapping controls.
- **RF-03.AC3:** Cards preserve image proportions and handle missing thumbnails and long titles cleanly.
- **RF-03.AC4:** Users can select high contrast, and the preference persists across navigation and reloads when browser storage is available.
- **RF-03.AC5:** Selected filters, errors and other meaningful states can be understood without relying on colour alone.
- **RF-03.AC6:** Text, controls and focus indicators meet the contrast targets defined in Shared Technical Tasks.
- **RF-03.AC7:** Loading, empty and error states are distinguishable; recoverable failures provide a retry action.
- **RF-03.AC8:** The page remains usable with keyboard navigation, 200% zoom and each supported interface language.

### RF-04 — Improve the Video Page, Recommendations and Description

When an eligible actor invokes this capability, the system shall present eligible recommendations and a description initially limited to five rendered lines. The observable scenarios and exceptions below define this requirement.

**User story:**

As a viewer, I want a well-organised video page with related content and a collapsible description so that I can watch comfortably and discover what to play next.

**Main use case:**

A viewer opens a video, reads the initial description, expands and collapses it, and selects a recommended video without layout problems or playback resets.

**Acceptance criteria:**

- **RF-04.AC1:** Recommendations appear on the right on suitable desktop widths and are reorganised appropriately on mobile and tablet.
- **RF-04.AC2:** The collapsed description displays no more than five visible lines at the current width.
- **RF-04.AC3:** Show more is displayed only when additional description text is hidden.
- **RF-04.AC4:** Expanding reveals the complete description; collapsing restores the five-line limit.
- **RF-04.AC5:** Description controls communicate their expanded state to assistive technology and do not restart playback.
- **RF-04.AC6:** Recommendations exclude the current video, duplicates, deleted videos and content excluded by the active audience filter.
- **RF-04.AC7:** A recommendation request failure does not prevent playback of the selected video.
- **RF-04.AC8:** Orientation changes, long descriptions and translated labels do not break the layout.

**Proposed recommendation scope:** Return up to eight eligible videos, prioritising shared tags, then category, then recent publication, with deterministic tie-breaking. Personalised machine-learning recommendations are outside this initial implementation.

### RF-05 — Improve the Like/Dislike Interface

When an eligible actor invokes this capability, the system shall present accurate, accessible reaction states and feedback. The observable scenarios and exceptions below define this requirement.

**User story:**

As an authenticated user, I want clear and responsive reaction controls so that I can express or change my opinion without uncertainty.

**Main use case:**

A user likes a video, switches to dislike and then removes the reaction. The selected state and counters remain consistent throughout the interaction.

**Acceptance criteria:**

- **RF-05.AC1:** Each authenticated user has at most one active reaction per video: like or dislike.
- **RF-05.AC2:** Selecting the active reaction removes it; selecting the opposite reaction replaces it.
- **RF-05.AC3:** Displayed counts and selected states agree with the server after the operation completes.
- **RF-05.AC4:** Visitors are prompted to authenticate before reacting.
- **RF-05.AC5:** Reaction state is recognisable without colour alone and is exposed to screen readers.
- **RF-05.AC6:** Repeated clicks do not create duplicate reactions or inconsistent counters.
- **RF-05.AC7:** Failure restores or refreshes a valid state and presents an understandable error.
- **RF-05.AC8:** A delayed response for one video cannot update the controls of a different video.

### RF-06 — Improve the Comment Section

When an eligible actor invokes this capability, the system shall present usable threaded discussions without changing established permissions or reply rules. The observable scenarios and exceptions below define this requirement.

**User story:**

As a viewer, I want readable discussions and clear comment controls so that I can follow and participate in conversations from any supported device.

**Main use case:**

A user reads a discussion, publishes a comment, replies, likes a comment and edits or deletes their own contribution.

**Acceptance criteria:**

- **RF-06.AC1:** Visitors can read comments; publishing, replying and liking require authentication.
- **RF-06.AC2:** Existing editing, deletion, reply and like functionality continues to work.
- **RF-06.AC3:** Users can edit or delete only their own comments, enforced by the backend.
- **RF-06.AC4:** Deleted comments retain the existing placeholder behaviour and preserve their replies.
- **RF-06.AC5:** Deleted comments cannot be edited, replied to or liked; replies belong to the same video as their parent.
- **RF-06.AC6:** Long text and nested replies remain readable on mobile/tablet without horizontal overflow.
- **RF-06.AC7:** Failed submission preserves the draft and offers a clear recovery action; repeated submission does not create accidental duplicates.
- **RF-06.AC8:** Comment forms and actions work with keyboard and screen-reader navigation.
- **RF-06.AC9:** Existing sibling ordering, safe text rendering and blank-comment validation are preserved.

### RF-07 — Implement Subscriptions to Creators

When an eligible actor invokes this capability, the system shall persist subscription changes and expose the authenticated user's own subscriptions. The observable scenarios and exceptions below define this requirement.

**User story:**

As an authenticated user, I want to subscribe to other creators so that I can easily return to their content.

**Main use case:**

A user subscribes from a creator's video or public profile, finds the creator in My subscriptions, visits their content and later unsubscribes.

**Acceptance criteria:**

- **RF-07.AC1:** Authenticated users can subscribe to and unsubscribe from other creators.
- **RF-07.AC2:** A user cannot subscribe to themselves, including through a direct API request.
- **RF-07.AC3:** Repeated subscription requests create only one relationship; repeated removal does not cause an inconsistent state.
- **RF-07.AC4:** Subscription state persists after reload, a new login and an application restart.
- **RF-07.AC5:** My subscriptions displays the current user's subscriptions and links to the correct public creator information/content.
- **RF-07.AC6:** Users cannot modify or read another user's private subscription list.
- **RF-07.AC7:** Failed actions do not display a false successful subscription state.
- **RF-07.AC8:** Controls and list states are responsive, keyboard accessible and translated.

The public creator page shows the public name, avatar, description and videos. An account can open its own public page without a subscribe control. The subscription list is accessible from the signed-in account menu.

**Scope:** Email notifications, push notifications and a personalised subscription feed are not included unless added as separate requirements.

### RF-08 — Sort Search Results by Most Liked and Most Viewed

When an eligible actor invokes this capability, the system shall sort the entire filtered dataset by positive likes or ProTube reproductions before pagination. The observable scenarios and exceptions below define this requirement.

**User story:**

As a user, I want to sort filtered videos by likes or reproductions so that I can discover popular content relevant to my interests.

**Main use case:**

A user enters a text query, selects several tags and an audience filter, chooses Most liked or Most viewed and navigates through the matching results.

**Acceptance criteria:**

- **RF-08.AC1:** Most liked orders matching videos by positive like count in descending order.
- **RF-08.AC2:** Most viewed orders matching videos by ProTube reproduction count in descending order.
- **RF-08.AC3:** Sorting applies to the complete matching dataset before pagination, not only to the loaded page.
- **RF-08.AC4:** Text, tag and audience filters remain active when the sort order changes.
- **RF-08.AC5:** Multiple selected tags use the existing OR rule; text and the tag condition are combined with AND.
- **RF-08.AC6:** An explicit popularity sort takes precedence over relevance ranking; ties use a stable video-ID ordering.
- **RF-08.AC7:** Results contain no duplicate videos, and totals use the same filters as the returned page.
- **RF-08.AC8:** Stale requests do not overwrite newer searches; invalid sort values receive a controlled validation response.

### RF-09 — Sort Search Results by Newest and Oldest

When an eligible actor invokes this capability, the system shall sort the entire filtered dataset by ProTube publication date before pagination. The observable scenarios and exceptions below define this requirement.

**User story:**

As a user, I want to sort videos by publication date while keeping my filters so that I can find recent or older content.

**Main use case:**

A user searches with text and tags, selects Newest, switches to Oldest and moves between result pages without losing the search criteria.

**Acceptance criteria:**

- **RF-09.AC1:** Newest orders matching videos by ProTube publication date in descending order.
- **RF-09.AC2:** Oldest orders matching videos by the same date in ascending order.
- **RF-09.AC3:** Equal publication dates use a stable video-ID tie-breaker.
- **RF-09.AC4:** Text, tags and audience filters combine correctly with either date order.
- **RF-09.AC5:** Changing the order resets pagination without removing the filters.
- **RF-09.AC6:** Editing title, description, tags or other metadata does not make an old video appear newly published.
- **RF-09.AC7:** Legacy date handling is documented; inferred dates are not misrepresented as verified original publication dates.
- **RF-09.AC8:** Local date formatting does not change the chronological ordering of stored timestamps.

### RF-10 — Display Liked Videos in the User Profile

When an eligible actor invokes this capability, the system shall display the authenticated user's current liked videos in a private paginated collection. The observable scenarios and exceptions below define this requirement.

**User story:**

As an authenticated user, I want to see the videos I have liked so that I can easily find them again.

**Main use case:**

A user likes a video, opens Liked videos in their profile and plays it. Removing the like removes the video from that collection when the list updates.

**Acceptance criteria:**

- **RF-10.AC1:** The section contains only videos with an active positive like from the authenticated user.
- **RF-10.AC2:** Disliked videos and removed reactions are excluded.
- **RF-10.AC3:** The list is paginated and ordered by most recent like, with stable tie-breaking.
- **RF-10.AC4:** Selecting an item opens the correct video.
- **RF-10.AC5:** Removing a like, replacing it with a dislike or deleting the video removes it from the refreshed collection.
- **RF-10.AC6:** Another account cannot retrieve the user's private liked-video list by changing an identifier.
- **RF-10.AC7:** An empty collection displays a useful message rather than an error.
- **RF-10.AC8:** The collection remains correct across reloads and new sessions.

### RF-11 — Complete Video Editing and Deletion for Owners

When an eligible actor invokes this capability, the system shall allow only the owner to update or delete video content and preserve related-data consistency. The observable scenarios and exceptions below define this requirement.

**User story:**

As a video owner, I want to manage my uploaded videos so that I can keep their information accurate or remove content I no longer want to publish.

**Main use case:**

A creator opens My videos, edits a video's information, verifies the saved result and then deletes a selected video after confirmation.

**Acceptance criteria:**

- **RF-11.AC1:** Users can list and manage their own videos; another user cannot edit or delete them.
- **RF-11.AC2:** Ownership restrictions are enforced by the backend, not only by hiding buttons.
- **RF-11.AC3:** Saved changes persist and appear in the catalogue, player and search results after refresh.
- **RF-11.AC4:** Updating selected fields preserves all fields that were not changed.
- **RF-11.AC5:** Invalid updates preserve the last valid saved data and show clear validation feedback.
- **RF-11.AC6:** Metadata or thumbnail changes do not replace the underlying video file.
- **RF-11.AC7:** Cancelling deletion preserves the video; confirming deletion removes it from application discovery and makes its detail unavailable.
- **RF-11.AC8:** Related collections and dependent records remain consistent after deletion.
- **RF-11.AC9:** Unreferenced managed files are cleaned up safely; shared/imported files are not removed while still needed by other records.
- **RF-11.AC10:** If cleanup fails, it is tracked for retry and does not leave a falsely playable published item. The team defines and verifies a bounded cleanup window.

### RF-12 — Implement Audience Labels and Content Filtering

When an eligible actor invokes this capability, the system shall persist creator-declared audience classification and apply the selected discovery filter. The observable scenarios and exceptions below define this requirement.

**User story:**

As a creator, I want to classify my video's intended audience, and as a viewer, I want to filter by that classification so that I can discover content matching my selection.

**Main use case:**

A creator selects Made for children or Not made for children when uploading or editing. A viewer selects the corresponding audience filter alongside text, tags and sorting.

**Acceptance criteria:**

- **RF-12.AC1:** New uploads require one of the two creator-selectable audience classifications.
- **RF-12.AC2:** Only the video owner can change the classification.
- **RF-12.AC3:** Legacy unclassified videos are not automatically treated as made for children.
- **RF-12.AC4:** The children filter returns only explicitly classified matching videos; All includes unclassified content.
- **RF-12.AC5:** Audience filtering combines correctly with text, tags and every supported sort order.
- **RF-12.AC6:** Counts and pagination reflect the same audience condition as the returned results.
- **RF-12.AC7:** Recommendations respect the active audience filter.
- **RF-12.AC8:** Classification changes persist and are reflected after retrieving results again.

**Scope:** This is creator-declared classification and discovery filtering. It does not introduce automated content assessment, age verification or parental access controls. A direct video URL remains subject to the existing access rules.

### RF-13 — Extend Watch History and Implement Watch Later and a Queue

When an eligible actor invokes this capability, the system shall provide private persistent history and Watch Later plus an ordered tab-session queue. The observable scenarios and exceptions below define this requirement.

**User story:**

As a viewer, I want to return to watched videos, save content for later and organise upcoming playback so that I can continue watching conveniently.

**Main use case:**

A user starts a video and later finds it in their history, saves another video to Watch Later and adds several videos to an ordered playback queue.

**Acceptance criteria:**

- **RF-13.AC1:** Opening a video without starting playback does not create a new history entry or reproduction.
- **RF-13.AC2:** Pause, resume, replay within the same opening and mini-player transitions do not create extra reproductions. A new opening followed by playback may count again.
- **RF-13.AC3:** History is private, paginated and ordered by last playback; repeated viewing updates the displayed entry.
- **RF-13.AC4:** Removing a history entry leaves public reproduction counts unchanged. Starting a new playback later makes the video reappear with the new date.
- **RF-13.AC5:** Watch Later persists between sessions and devices for the same authenticated account.
- **RF-13.AC6:** Adding the same video to Watch Later repeatedly creates only one entry; watching it does not automatically remove it.
- **RF-13.AC7:** Users can remove their own saved entries, and other accounts cannot read or modify these private collections.
- **RF-13.AC8:** The queue preserves its selected order, supports removal/reordering and does not add duplicate entries in this initial version.
- **RF-13.AC9:** When a queued video ends, the next eligible item is selected; if autoplay is blocked, a clear manual play action is available.
- **RF-13.AC10:** Deleted/unavailable videos do not leave broken collection entries or block the queue indefinitely.
- **RF-13.AC11:** An empty queue stops naturally without a loop, and only one video plays at a time.

**Proposed persistence scope:** History and Watch Later are stored per account in the database. The queue belongs to the current browser-tab session and is not synchronised across devices. Estimate and track these three deliverables separately.

### RF-14 — Implement a Persistent Mini-player and Picture-in-Picture

When an eligible actor invokes this capability, the system shall preserve a single playback instance during internal navigation and presentation changes. The observable scenarios and exceptions below define this requirement.

**User story:**

As a viewer, I want to minimise the current video while browsing ProTube so that I can explore the application without interrupting playback.

**Main use case:**

A viewer starts playback, minimises the video, navigates through search or profile pages and restores the full player at the current playback position.

**Acceptance criteria:**

- **RF-14.AC1:** Internal navigation does not restart or stop the current video unintentionally.
- **RF-14.AC2:** Restoring the full player preserves current position, volume and paused/playing state.
- **RF-14.AC3:** There is only one active playback instance and no duplicated audio.
- **RF-14.AC4:** Minimising, restoring or navigating does not register an additional reproduction for the same opening.
- **RF-14.AC5:** Closing the mini-player stops playback and leaves focus in a sensible location.
- **RF-14.AC6:** Opening another video replaces the previous playback consistently.
- **RF-14.AC7:** Controls are usable by touch, keyboard and screen reader and do not obscure essential page actions.
- **RF-14.AC8:** Native PiP is offered only when available; failure leaves the internal mini-player usable.

**Scope:** Guaranteed continuity covers internal application navigation. Continuing after a full document reload or browser closure is not required by this story. Native PiP availability must be detected; see [MDN: Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API).

### RF-15 — Improve Screen-Reader Accessibility and Add Voice Search

When an eligible actor invokes this capability, the system shall support keyboard/screen-reader operation and explicitly activated editable voice search. The observable scenarios and exceptions below define this requirement.

**User story:**

As a user who relies on a screen reader, keyboard or voice input, I want accessible search and navigation so that I can use ProTube independently.

**Main use case:**

A user identifies the main navigation, enters or dictates a query, reviews the recognised text, searches, opens a result and controls playback and interactions using assistive technology.

**Acceptance criteria:**

- **RF-15.AC1:** Main navigation, page content, headings and forms are identifiable to screen readers.
- **RF-15.AC2:** Search, filtering, playback and principal interaction controls can be operated with keyboard alone.
- **RF-15.AC3:** Keyboard focus is visible, follows a logical order and is not trapped unintentionally.
- **RF-15.AC4:** Icon-only buttons and dynamic controls have understandable accessible names and current states.
- **RF-15.AC5:** Voice capture starts only after an explicit user action and clearly indicates when listening is active.
- **RF-15.AC6:** Users can stop/cancel dictation and correct the recognised text before submitting.
- **RF-15.AC7:** Partial recognition results do not automatically trigger duplicate searches.
- **RF-15.AC8:** Unsupported recognition, denied permission, silence and cancellation do not disable typed search.
- **RF-15.AC9:** Voice controls, errors and accessible labels are localised.
- **RF-15.AC10:** Manual test evidence identifies the screen reader, browser and versions used, including NVDA with a supported desktop browser and an available mobile screen reader.

**Scope:** These criteria cover application-interface accessibility. Captions, transcripts and audio descriptions for every uploaded video require separate content requirements; passing these checks does not establish complete WCAG conformance. Recognition support and possible remote audio processing must be accounted for; see [MDN: SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

### RF-16 — Implement Spanish, Catalan and English Localisation

When an eligible actor invokes this capability, the system shall present application-controlled text and formats in the selected supported language. The observable scenarios and exceptions below define this requirement.

**User story:**

As a user, I want to choose Spanish, Catalan or English so that I can understand and use the interface in my preferred language.

**Main use case:**

A user selects a language, navigates through the application, submits forms and reloads the page. Interface text and formatting remain consistent with that selection.

**Acceptance criteria:**

- **RF-16.AC1:** Users can select any of the three languages from the application interface.
- **RF-16.AC2:** A manual selection takes precedence and persists across navigation and reloads when browser storage is available.
- **RF-16.AC3:** On first use, a supported browser language is selected; otherwise Spanish is used as the proposed fallback.
- **RF-16.AC4:** Application-controlled text in the agreed screens is translated; translation keys and unintended mixed-language messages are not shown.
- **RF-16.AC5:** Accessible labels, document language, plural forms, dates and numbers match the selected language.
- **RF-16.AC6:** Changing language preserves entered form values, filters, queue state and current playback.
- **RF-16.AC7:** Missing translations use a controlled fallback and are detected before the story is closed.
- **RF-16.AC8:** User-generated titles, descriptions, names and comments remain unchanged rather than being automatically translated.
- **RF-16.AC9:** Main flows are verified in all three languages on mobile and desktop.

### RF-17 — Optimise Database Queries and Supabase Performance

When an eligible actor invokes this capability, the system shall return functionally equivalent results within the agreed measured performance budget. The observable scenarios and exceptions below define this requirement.

**User story:**

As a user, I want catalogue, search and personal collections to respond promptly so that I can browse without unnecessary waiting.

**Main use case:**

A user opens the catalogue, applies combined filters, changes sorting, paginates and opens their collections. The team measures these operations under repeatable conditions before and after optimisation.

**Acceptance criteria:**

- **RF-17.AC1:** Baseline and final measurements use the same documented dataset, environment, client location and workload.
- **RF-17.AC2:** The main video listing no longer performs a separate counter query for every metric of every returned video.
- **RF-17.AC3:** Optimisation preserves filters, sorting, pagination totals and access permissions.
- **RF-17.AC4:** List endpoints return bounded pages rather than downloading full collections unnecessarily.
- **RF-17.AC5:** Index and query changes are supported by measured plans or execution evidence.
- **RF-17.AC6:** The agreed latency budget is met, and before/after p50, p95, query counts and errors are recorded.
- **RF-17.AC7:** Concurrent requests do not introduce lost updates, incorrect counters or application-caused failures in the agreed test.
- **RF-17.AC8:** Performance results state their limits; an unmeasured improvement is not reported as completed optimisation.

**Proposed benchmark, to agree before implementation:** Use 1,000 videos, 10,000 reactions and 5,000 comments with 10 concurrent virtual users. Run the same five-minute workload three times after warm-up. Target p95 HTTP latency at or below 1,000 ms for catalogue and filtered search pages of 24 videos, measured from a fixed documented client. For a baseline operation exceeding that budget, also target at least a 30% p95 reduction. Report cold-start behaviour separately and exclude MP4 transfer time from API measurements. These are proposed acceptance targets, not measured capabilities of the current deployment.

Query-plan analysis and index selection should follow measured workloads; see [Supabase: Query Optimization](https://supabase.com/docs/guides/database/query-optimization).

## Non-functional requirements and compatibility

Preserve existing video JSON mappings under meta and MP4/thumbnail compatibility; imported identities/counters stay distinct. Keep the one-reproduction-per-opening rule, including pause/resume/replay and mini-player transitions. Authentication/CSRF and private collection isolation are mandatory.

UI reference widths: 320,375,768,1024,1440 CSS px; check orientation and 200% zoom. Normal-text contrast >=4.5:1, large-text/control-state contrast >=3:1; principal touch-control target 44x44 CSS px. Check light/dark/high contrast and colour-independent states. These checks do not establish full WCAG conformance. Translate interface, errors and accessible labels into es/ca/en without translating user content.

RF-17's benchmark numbers are proposed budgets requiring baseline/host confirmation before optimisation, not measured facts. No full database/media migrations or hosting purchases are authorised by this documentation request.

## Assumptions, dependencies and exclusions

- Proposed defaults from the reviewed plan: private subscription/liked/history/saved lists; tab-session queue; simple deterministic recommendations; Spanish locale fallback; declared audience with unknown legacy state.
- Hosting credentials, source exports, actual budget/capacity, target browser/device availability and team task ownership are implementation prerequisites. They do not prevent preparing these documents. Never invent completion or approval for them.
- Preserve current source-specific upload/avatar limits; resolve a discrepancy against code/tests before changing limits. This spec does not silently replace MiB limits with MB limits from an older example.
- No personalised ML recommendation system, notification delivery, parental-control system, automatic translation of user media, full audiovisual accessibility programme, queue cross-device synchronisation, OAuth replacement or party-mode implementation.
- Scope is documentation only for this request. Future implementation follows the plan and task evidence rules. Any feature/budget change updates spec, plan and affected tasks before code.

## Definition of Done

A story is Done only when its own acceptance criteria and the applicable shared criteria below are satisfied. The sprint backlog must distinguish completed stories from remaining work.

1. **Acceptance:** All agreed acceptance criteria are satisfied and linked to test results, screenshots, recordings or a reproducible demonstration.
2. **Implementation:** The required frontend, backend, database and storage changes are integrated and function together.
3. **Review and merge:** Code is reviewed by another team member and merged into main through the project's PR workflow, with required CI checks passing.
4. **Testing:** Relevant automated unit, integration and end-to-end tests pass, including meaningful success, failure and authorization cases.
5. **Coverage:** Existing coverage gates pass and the project maintains the greater-than-50% coverage requirement in REQUIREMENT.md without weakening stricter existing gates.
6. **Regression:** Registration, login, catalogue, search, upload, playback and existing interactions continue to work.
7. **Persistence:** Durable data and media remain correct after refresh, new sessions and application restart where applicable.
8. **Migrations:** Schema changes are versioned, documented and verified on both an empty database and an isolated existing-data copy.
9. **Authorization and privacy:** Private collections and owner actions are protected by backend checks; another account cannot retrieve or change private data by manipulating identifiers.
10. **Failure handling:** Invalid input, loading, empty results, recoverable errors and retries have coherent behaviour without false success or partial published content.
11. **Responsive design:** Affected screens are verified on the agreed desktop, tablet and mobile sizes without blocking overflow, hidden controls or broken layouts.
12. **Accessibility:** Keyboard navigation, focus, accessible names, relevant announcements and contrast are checked; manual screen-reader evidence covers affected flows.
13. **Localisation:** New and changed interface text is available and reviewed in Spanish, Catalan and English, including error messages and accessible labels.
14. **Performance:** Relevant operations meet the agreed performance budget, with reproducible measurements for Story 17 and no unresolved material regression caused by the change.
15. **Repository hygiene:** Credentials, local environment files, private data and generated artifacts are not committed.
16. **Documentation:** API contracts, setup, configuration, migration/recovery instructions and task handoff information are updated where affected.
17. **Staging:** The application is deployed and the relevant integrated flows are verified in the staging environment.
18. **Demo readiness:** The team can demonstrate the delivered behaviour with prepared data and explain any remaining limitations or incomplete stories.

Each story should have one responsible member, a reviewer, tracked dependencies and completion evidence. Estimate and select the final commitment using the team's available sprint capacity; the full list above preserves all 17 requested areas without assuming a delivery date or an unverified velocity.
