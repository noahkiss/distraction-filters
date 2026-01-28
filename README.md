# distraction-filters

Cosmetic filters for uBlock Origin and AdGuard to reduce distractions and apply dark themes to websites.

## Installation

1. Install [uBlock Origin](https://ublockorigin.com/) or [AdGuard](https://adguard.com/)
2. Open the extension dashboard
3. Go to "Filter lists" or "My filters"
4. Add the raw URL of `social.txt` as a custom filter list:
   ```
   https://raw.githubusercontent.com/noahkiss/distraction-filters/main/social.txt
   ```

Or copy the contents directly into your custom filters.

## What's Included

### Distraction Hiding

| Site | What's Hidden |
|------|---------------|
| Hacker News | Main story list, navigation links |
| Reddit | Sidebars, headers, feeds, avatars, hover cards |
| old.reddit.com | Premium banners, sidebars, footers, listings |
| Facebook | Stories, complementary sidebars |
| YouTube | Next button, suggestions, end screens |
| m.youtube.com | Browse feeds, related items, various UI elements |

### Dark Themes (Dracula)

- **news.ycombinator.com** - Full Dracula theme
- **hckrnews.com** - Full Dracula theme

## Filter Syntax

These filters use cosmetic filtering syntax compatible with both uBlock Origin and AdGuard.

### Hiding Elements

```
domain.com##.class-name        # Hide by class
domain.com###element-id        # Hide by ID
domain.com##div[attr="value"]  # Hide by attribute
```

### Applying Styles

```
domain.com##selector:style(property: value !important;)
```

The `:style()` procedural cosmetic applies CSS instead of hiding the element.

### Comments

```
! This is a comment
! Title: Section header
```

## Customization

To modify these filters:

1. Fork this repo or copy the filters locally
2. Edit `social.txt`
3. Test changes using browser DevTools:
   - Open DevTools (F12)
   - Add a `<style>` tag in Elements panel
   - Or use uBlock's element picker

## Testing Filters

### Quick Manual Testing

Generate console commands to paste into browser DevTools:

```bash
node generate-test-css.js              # List all domains
node generate-test-css.js hckrnews     # Get command for a site
node generate-test-css.js --all        # Generate test-commands.md with all commands
```

Then open DevTools (F12) > Console and paste the command.

For mobile sites, use DevTools device toolbar (Ctrl+Shift+M) to emulate mobile.

### Automated Playwright Testing

```bash
# Requires: npm install playwright
node test-filters.js hckrnews      # Generate before/after screenshots
node test-filters.js hn --headed   # Test with visible browser
```

### GitHub Workflow

When you push changes to `social.txt`, a GitHub Action automatically creates a test issue with copy-paste console commands for each domain. Just test each site and close the issue when done.

## Theme Colors (Dracula)

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#21222c` | Page backgrounds |
| Foreground | `#f8f8f2` | Main text |
| Comment | `#6272a4` | Muted text, borders |
| Cyan | `#8be9fd` | Story links |
| Green | `#50fa7b` | Logo/brand |
| Orange | `#ffb86c` | Highlights |
| Pink | `#ff79c6` | Scores, accents |
| Purple | `#bd93f9` | Links |
| Red | `#ff5555` | Errors, separators |
| Yellow | `#f1fa8c` | Points |

## Contributing

Issues and PRs welcome. When adding filters:
- Test in both uBlock Origin and AdGuard
- Group related rules together
- Add comments to explain non-obvious selectors
