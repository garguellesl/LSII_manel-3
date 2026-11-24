# RF-04 player recommendations

Requested by the user, implemented locally by Codex on `feat/improve-videoplay-page-buttons-UIX`. Team review pending. Scope covers the recommendation endpoint, V10 audience eligibility, player layout, description and portrait comments. P12 owns audience assignment and catalogue controls. Existing rows start as UNCLASSIFIED.

Verification and changes are recorded in [P04](../../../specs/sprint-4/task.md#p04--improve-the-video-page-recommendations-and-description). The isolated E2E delivery uses port 18080. Next step is team review before integrating the migration. [Prompt](../../../prompts/33-player-recommendations.md).

Header follow-up: logo placed beside appearance controls, shared search moved upward by removing the separate logo row and reducing header/search spacing. Build/lint and 243 Jest tests pass. Chrome at 1280, 768 and 320 px confirms logo inside toolbar, search above player, desktop recommendation alignment, working home navigation and no horizontal overflow. Available in the isolated deployment on port 18080.

Header refinement: logo now precedes appearance controls in visual and keyboard order, as requested. Frontend build/lint passed.
