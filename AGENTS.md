# Agent Instructions for distraction-filters

## Project Overview

This repo contains cosmetic filters for uBlock Origin and AdGuard that:
1. Hide distracting UI elements (sidebars, feeds, recommendations)
2. Apply dark themes to specific sites

`README.md` covers installation, filter syntax, the test commands, the GitHub test-issue
workflow, and the theme palette. This file holds what a contributor needs beyond that.

## Filter List Header & Versioning

`social.txt` begins with a uBO/AdGuard metadata header (`! Title:`, `! Version:`,
`! Last modified:`, `! Expires:`, etc.). uBlock Origin surfaces `Version` and
`Last modified` in the filter-list details, so they must be kept current.

The version is **date-based**: `! Version: YYYY.MM.DD`. If more than one change lands on
the same day, append a monotonic same-day counter: `2026.07.13` → `2026.07.13.1` →
`2026.07.13.2` (uBO compares dot-separated numeric components, so these order correctly).

**MANDATORY — do this on EVERY change to `social.txt`, in the same commit, without
exception:**
1. **Set `! Version:` to today's date** (`YYYY.MM.DD`). If today's date already equals the
   current version, append/increment the same-day counter instead so the value always
   changes upward.
2. **Set `! Last modified:` to today's date** (`YYYY-MM-DD`).

Never edit `social.txt` rules without updating both fields. If you touch a filter line and
the version still shows a past date, that is a bug — fix it before committing.

## Writing Filters

- Use only the cosmetic syntax common to uBlock Origin and AdGuard.
- A `:style()` rule must end with `)`; an incomplete rule breaks the filter. Use `!important` to override site styles.
- Add a comment header per site: `! sitename`.
- Group hiding rules first, then `:style()` theming rules.
- Test in browser DevTools before committing (`node generate-test-css.js <site>`, see README).
- To check a `:style()` rule by hand, convert it to plain CSS: `hckrnews.com##body:style(background: #21222c !important;)` becomes `body { background: #21222c !important; }`.

## Theme Rules

- **Preserve semantic colors**: if the original site uses color to convey meaning (e.g., orange = HN homepage), keep that color.
- **Contrast ratios**: aim for WCAG AA (4.5:1 for normal text, 3:1 for large text).
- Use the Catppuccin Macchiato palette listed in `README.md`.

## Site Notes

### hckrnews.com
- Story entries use the `.entries.io` class.
- Time markers use `.link span` inside entries.
- Filter tabs use `.filters a`; the `active` class is on the parent `<li>`, not the `<a>`.
- The auto-refresh indicator uses the `.autorefresh` class.
- A "Last Visit" marker appears between entries.
- `.points.homepage` = orange: the post made the HN homepage. `.points` alone = gray. Points and active tabs stay orange, because orange means "popular" on this site.

### Hacker News (news.ycombinator.com)
- Uses table-based layout with `bgcolor` attributes
- Main content in `#hnmain`
- Orange header bar: `td[bgcolor="#ff6600"]`

### Reddit
- New Reddit uses web components (`shreddit-*`, `faceplate-*`).
- Old Reddit uses traditional classes (`.side`, `.menuarea`).
- Both need separate rules.
- `faceplate-loader` does not wrap post content images.
- On the feed, `article` (the whole post card, hidden on purpose) and `shreddit-async-loader` wrap post media.
- On post pages, `shreddit-async-loader` wraps post media with `bundlename="gallery_carousel"` (galleries), `shreddit_player_loader` (Reddit video) and `embed` (YouTube and other embeds). The rule excludes those three bundles and hides the other loaders (header items, overflow menu, ads).
- Plain image posts and link thumbnails match no rule.
- Some elements appear only when logged in (`.avatar`, `.user-hover-card`, `.community-hover-card`, `.relative.inline-block.rounded-full` avatars). A logged-out browser reports 0 matches for them. Do not prune rules based on logged-out match counts.
- Reddit blocks standard Playwright with a 403. `playwright-extra` with a stealth plugin or a residential proxy works around it. For CSS filter testing, manual DevTools testing is simpler.

### YouTube
- Desktop YouTube works in Playwright.
- The page is heavily dynamic; elements load async.
- Player controls use `.ytp-*` classes.
- Desktop elements (sidebar, header) are commented out; only player distractions are active.
- The mobile site (`m.youtube.com`) has a different structure and more active filters. Emulate a mobile viewport in DevTools to test it.
- Player filters (next button, suggestions, endscreen) are visible only on hover or at video end.
- YouTube sends a signed-in iPad Safari to `m.youtube.com/?ra=m`, even with "Request Desktop Website" on. `?app=desktop&persist_app=1` on `www.youtube.com` forces the desktop site. `userscripts/youtube-desktop-ipad.user.js` applies that on every load. It derives from Greasy Fork script 594338 (MIT) and adds a per-origin `sessionStorage` redirect-loop guard, address-bar cleanup via `history.replaceState`, and iPad detection that does not depend only on the deprecated `navigator.platform`.
- With "Request Desktop Website" on, iPad Safari reports a Mac user agent. Detect the iPad as Mac + `navigator.maxTouchPoints > 1`; a real Mac has zero touch points.

## Userscripts

- Scripts live in `userscripts/` as `<name>.user.js` with a sibling `<name>.test.js`. Run a test with `node userscripts/<name>.test.js`.
- The existing test mocks `navigator`, `location`, `history`, and `sessionStorage`, runs the script with `vm.runInNewContext`, and asserts on what `location.replace` was called with. It needs only Node.
- `sessionStorage` is per origin. A redirect between `m.youtube.com` and `www.youtube.com` sees a separate store on each side, which is why the loop guard counts on the origin it redirects from.
- CI (`test-filters.yml`) only fires on `social.txt` changes; userscript changes do not create test issues.

## Files

- `social.txt` - the filter list
- `generate-test-css.js` - generates DevTools console commands for manual testing
- `test-commands.md` - output of `node generate-test-css.js --all`; regenerate, do not hand-edit
- `test-filters.js` - Playwright before/after screenshot testing
- `.github/workflows/test-filters.yml` - opens a test issue on `social.txt` pushes; needs a `testing` label in the repo
