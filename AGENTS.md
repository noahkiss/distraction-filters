# Agent Instructions for distraction-filters

## Project Overview

This repo contains cosmetic filters for uBlock Origin and AdGuard that:
1. Hide distracting UI elements (sidebars, feeds, recommendations)
2. Apply dark themes (Dracula) to specific sites

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

## Filter Syntax Reference

### Compatibility: uBlock Origin vs AdGuard

Both support the same core cosmetic filter syntax. The filters here use only the common subset.

### Basic Syntax

```
domain.com##selector           # Hide element matching CSS selector
domain.com##selector:style(css)  # Apply inline CSS instead of hiding
```

### The `:style()` Procedural Cosmetic

```
domain.com##selector:style(property: value !important;)
```

- Use `!important` to override site styles
- Multiple properties separated by semicolons
- Must end with `)` - incomplete rules break the filter

Lines starting with `!` are comments.

## Site Notes

### hckrnews.com
- Story entries use the `.entries.io` class.
- Time markers use `.link span` inside entries.
- Filter tabs use `.filters a`; the `.active` class marks the selected tab.
- The auto-refresh indicator uses the `.autorefresh` class.
- A "Last Visit" marker appears between entries.
- Points and active tabs stay orange, because orange means "popular" on this site.

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
- The mobile site (`m.youtube.com`) has a different structure and more active filters.
- Player filters (next button, suggestions, endscreen) are visible only on hover or at video end.
- YouTube sends a signed-in iPad Safari to `m.youtube.com/?ra=m`, even with "Request Desktop Website" on. `?app=desktop&persist_app=1` on `www.youtube.com` forces the desktop site. `userscripts/youtube-desktop-ipad.user.js` applies that on every load. It derives from Greasy Fork script 594338 (MIT) and adds a per-origin `sessionStorage` redirect-loop guard, address-bar cleanup via `history.replaceState`, and iPad detection that does not depend only on the deprecated `navigator.platform`.
- With "Request Desktop Website" on, iPad Safari reports a Mac user agent. Detect the iPad as Mac + `navigator.maxTouchPoints > 1`; a real Mac has zero touch points.

## Userscripts

- Scripts live in `userscripts/` as `<name>.user.js` with a sibling `<name>.test.js`.
- The existing test mocks `navigator`, `location`, `history`, and `sessionStorage`, runs the script with `vm.runInNewContext`, and asserts on what `location.replace` was called with. It needs only Node.
- `sessionStorage` is per origin. A redirect between `m.youtube.com` and `www.youtube.com` sees a separate store on each side, which is why the loop guard counts on the origin it redirects from.
- CI (`test-filters.yml`) only fires on `social.txt` changes; userscript changes do not create test issues.

## Testing Approaches

Use uBlock Origin's element picker, or add a `<style>` block in DevTools, for a quick check. `generate-test-css.js` and `test-filters.js` are described under "Testing Filters".

### Converting Filters to CSS for Testing

The `:style()` filters can be extracted to plain CSS:

```
hckrnews.com##body:style(background: #21222c !important;)
```

Becomes:

```css
body { background: #21222c !important; }
```

## File Structure

- `social.txt` - Main filter list for social/news sites
- `generate-test-css.js` - Generate console commands for manual testing (recommended)
- `test-filters.js` - Playwright-based automated screenshot testing
- `test-commands.md` - Pre-generated console commands for all sites (generated by --all)
- `userscripts/*.user.js` - Greasemonkey-style scripts for behavior a cosmetic filter cannot express (redirects, URL rewrites)
- `userscripts/*.test.js` - Node test for the matching script, run with `node userscripts/<name>.test.js`
- `README.md` - User-facing documentation
- `AGENTS.md` - This file (agent and contributor notes); `CLAUDE.md` imports it

## Testing Filters

### Quick Manual Testing (Recommended)

Use `generate-test-css.js` to create copy-paste console commands:

```bash
# List all domains and their rule counts
node generate-test-css.js

# Generate console command for a specific site
node generate-test-css.js hckrnews

# Generate all commands to test-commands.md
node generate-test-css.js --all
```

Then:
1. Open the target site in your browser
2. Open DevTools (F12) > Console
3. Paste the generated command
4. To remove: paste the remove command

**For mobile sites** (m.youtube.com): Use DevTools device toolbar (Ctrl+Shift+M) to emulate mobile viewport before testing.

### Automated Playwright Testing

Use `test-filters.js` for automated screenshot comparison:

```bash
# Requires: npm install playwright
node test-filters.js --list
node test-filters.js hckrnews        # Generate before/after screenshots
node test-filters.js hn --headed     # Test with visible browser
```

**Note**: Reddit blocks Playwright (403). Use manual DevTools testing for Reddit.

### GitHub Workflow (Automatic)

When `social.txt` is pushed to main, a GitHub Action automatically:
1. Creates a new issue titled "🧪 Test filters: YYYY-MM-DD"
2. Adds a comment for each domain with copy-paste console commands
3. Each comment has checkboxes to track testing progress

Just close the issue when testing is complete.

**Setup**: Create a `testing` label in the repo (the workflow uses it).

## Adding New Filters

1. Add a comment header: `! sitename`
2. Group hiding rules first, then `:style()` theming rules
3. Test in browser DevTools before committing

## Sites Covered

| Site | Hiding | Theme |
|------|--------|-------|
| news.ycombinator.com | Yes | Catppuccin Macchiato |
| hckrnews.com | No | Catppuccin Macchiato |
| reddit.com | Yes | No |
| old.reddit.com | Yes | No |
| facebook.com | Yes | No |
| youtube.com | Yes | No |
| m.youtube.com | Yes | No |

## Theme Accessibility Notes

- **Preserve semantic colors**: If the original site uses color to convey meaning (e.g., orange = HN homepage), keep that color
- **Contrast ratios**: Aim for WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Catppuccin Macchiato** palette:
  - Background: `#24273a`
  - Text: `#cad3f5`
  - Muted: `#6e738d`, `#8087a2`
  - Surface: `#363a4f`, `#494d64`
  - Links: `#8aadf4` (blue), `#91d7e3` (sky)
  - Accent: `#a6da95` (green), `#ff9f43` (bright orange for semantic)

### hckrnews.com Points System
- `.points.homepage` = orange - post made it to HN homepage (important)
- `.points` (no homepage) = gray - regular post
- Filter tabs: `active` class is on parent `<li>`, not `<a>`
