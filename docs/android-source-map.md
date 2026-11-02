# Android source mapping and account API

This note records only behavior and routes verified in the supplied APK extraction.

## Verified home and navigation layouts

| Android resource | Observed structure | Desktop implementation target |
| --- | --- | --- |
| home_content.xml | Top course/status area, tab content containers, five bottom tabs | Shared app shell and Learn / Leagues / Quests / Shop / Profile navigation |
| fragment_path.xml | Scrollable learning path, persistent unit header, auto-scroll control, level popups | Learn path, sticky unit header, current-level jump, level sheet |
| view_path_level_oval.xml | 70dp × 65dp clickable CardView, 8dp lip, centered progress ring, stars and tooltip | Oval node face/lip, ring, star states and tooltips |
| view_path_level_rive.xml | 70dp × 65dp outer frame with 160dp × 300dp Rive view; children may overflow the node frame | Animated character/node rendering, clipped to the Android-equivalent frame |
| fragment_goals_home.xml | 48dp TabLayout and ViewPager2 for goals pages | Daily / Monthly Challenge tabs |
| tab_redesign_view_daily_quests_card.xml | Quest title, refresh timer and vertical RecyclerView | Daily quest heading and list |
| tab_redesign_view_daily_quest_item.xml | Individual card with title, progress bar and end illustration | Individual daily quest cards |
| fragment_shop.xml | RecyclerView with 48dp top margin and item-get overlay | Scrollable shop catalog |
| fragment_profile_double_sided.xml | Action bar, tabs and ViewPager2 | Profile Achievements / Stats tabs |
| fragment_leagues_contest_screen.xml | Banner occupying the top third and a cohort RecyclerView below | League header and standings list |

## Verified path resources

The APK contains resources/res/raw/node_and_ring_119.riv (613,267 bytes) and node_and_ring_31.riv (271,594 bytes). view_path_level_rive.xml hosts a Rive view at 160dp × 300dp inside the 70dp × 65dp node frame. The current web frontend recreates node geometry and state motion in CSS/SVG, but it does not yet load these original Rive binaries. That remains a fidelity gap.

The Android raw resources also include Duolingo Sans and DIN Next font files. They are not yet bundled in this repository; the current frontend uses system fallbacks.

## Verified authenticated read-only API

The Android source defines these origins in ApiOrigin.java:

- Production: https://android-api.duolingo.com
- Regional: https://android-api-cf.duolingo.com
- China: https://android-api.duolingo.cn

DuoJwtInterceptor.java attaches the session as Authorization: Bearer <JWT>. ManagerDuoJwt.java parses the numeric user ID from the JWT payload's sub claim.

The decompiled interface defpackage.kci declares the following read-only requests:

| Method | Path | Query parameters |
| --- | --- | --- |
| GET | /users/{userId}/quests | timezone |
| GET | /users/{userId}/progress | ui_language, timezone |
| GET | /users/{userId}/schema | ui_language, timezone |

The desktop Tauri backend now calls those three routes over HTTPS after decoding the JWT's sub claim. It does not send lesson answers, modify progress, make purchases, or perform a password login. The token is held in frontend memory only; it is not written to local storage or a file. The user must reconnect after restarting the app.

## Still unverified / not implemented

- Original Rive state-machine names and exact input values for every node state.
- Complete course catalogue mapping to the current account's active course.
- Full course/path/lesson challenge API contract and answer submission payloads.
- League cohort API and real leaderboard refresh.
- Profile/avatar/achievement APIs and complete shop inventory / purchase contracts.
- Official Duolingo desktop OAuth or browser-based sign-in flow.

Do not infer write endpoints from the read-only routes above. Do not claim sample data is synchronized account data.
