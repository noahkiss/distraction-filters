# Filter Test Commands

Paste these into browser DevTools Console (F12) to test filters.

## Remove Command

```javascript
// Remove injected styles
document.getElementById('distraction-filter-test')?.remove();
```

## news.ycombinator.com

**URL**: https://news.ycombinator.com/

```javascript
// news.ycombinator.com - Paste this in DevTools Console (F12)
(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = 'body, .c00 { color: #f8f8f2 !important; background-color: #21222c !important;  }\ntd[bgcolor="#ff6600"] { background-color: #444757 !important;  }\n[bgcolor="#f6f6ef"] { background-color: #21222c !important;  }\n[bgcolor="#000000"] { background-color: #ff5555 !important;  }\ntr#pagespace { display: none !important;  }\nb.hnname > a { color: #50fa7b !important;  }\na { color: #bd93f9 !important;  }\n.subline, .toptext { color: #f8f8f2 !important;  }\n.subline a { color: #999 !important;  }\n.score,#hnmain > tbody > tr td:last-child > span.pagetop { color: #ff79c6 !important;  }\n.sitestr { color: #8be9fd !important;  }\ntextarea, input:not([type="hidden"]) { background-color: #444757 !important; color: #f8f8f2 !important; border: 1px solid #6272a4 !important; border-radius: 3px !important;  }\ninput[type="submit"] { cursor: pointer !important; font-weight: bold !important; }\n#hnmain > tbody > tr > td > table:not(.comment-tree):not(.fatitem),\n.yclinks { display: none !important; }\n';
  document.head.appendChild(style);
  console.log('Injected 13 style rules, 2 hide rules');
})();
```

## hckrnews.com

**URL**: https://hckrnews.com/

```javascript
// hckrnews.com - Paste this in DevTools Console (F12)
(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = 'body, #page, .menu, header, .settings { background-color: #21222c !important; color: #f8f8f2 !important; }\n.logo h1 a { color: #50fa7b !important; }\n.mainnav a { color: #bd93f9 !important; }\nheader h3, header h3 a { color: #6272a4 !important; }\n.link.story { color: #8be9fd !important; font-weight: 500 !important; }\n.link.story:visited { color: #6272a4 !important; }\n.source { color: #6272a4 !important; font-size: 0.85em !important; }\n.comments { color: #bd93f9 !important; }\n.points { color: #f1fa8c !important; }\n.points.homepage { color: #ffb86c !important; font-weight: bold !important; }\n.entries.io .link span { color: #6272a4 !important; border-bottom: 1px solid #6272a4 !important; }\n.filters a { color: #bd93f9 !important; }\n.filters a.active { background-color: #44475a !important; color: #f8f8f2 !important; }\n.autorefresh { color: #6272a4 !important; }\n';
  document.head.appendChild(style);
  console.log('Injected 14 style rules, 0 hide rules');
})();
```

## reddit.com

**URL**: https://reddit.com/

```javascript
// reddit.com - Paste this in DevTools Console (F12)
(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = '.avatar,\n.community-hover-card,\n.flex-sidebar,\n.h-header-large,\n.left-sidebar,\n.masthead,\n.reddit-header-large,\n.relative.inline-block.rounded-full,\n.right-sidebar,\n.shreddit-subreddit-icon__icon,\n.user-hover-card,\n.w-full.masthead,\n#feed-next-page-partial,\narticle,\nauth-flow-google-one-tap-prompt,\nfaceplate-loader,\nfaceplate-perfmetric-collector,\nfaceplate-server-session,\nfaceplate-tracker span[avatar],\nhr,\nprotected-community-modal,\nreddit-page-data,\nshreddit-activated-feature-meta,\nshreddit-async-loader,\nshreddit-feed-page-loading,\nshreddit-good-visit-tracker,\nshreddit-page-meta,\nshreddit-recent-communities-data,\nshreddit-screenview-data,\nshreddit-post-share-button,\naward-button,\n.premium-banner,\n.footer-parent,\n.debuginfo,\n.listingsignupbar.infobar,\n#header,\n.menuarea,\n.listing-chooser,\n.side,\n.bottom-area > .reddiquette,\n.bottom-area > .help-toggle,\n.commentsignupbar.infobar,\n.sitetable.linklisting > .thing[data-context="listing"],\n.nav-buttons,\n.panestack-title > .title-button { display: none !important; }\n';
  document.head.appendChild(style);
  console.log('Injected 0 style rules, 45 hide rules');
})();
```

## facebook.com

**URL**: https://facebook.com/

```javascript
// facebook.com - Paste this in DevTools Console (F12)
(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = 'div[aria-label="Stories"],\ndiv[role="complementary"] { display: none !important; }\n';
  document.head.appendChild(style);
  console.log('Injected 0 style rules, 2 hide rules');
})();
```

## youtube.com

**URL**: https://youtube.com/

```javascript
// youtube.com - Paste this in DevTools Console (F12)
(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = '.ytp-next-button,\n.ytp-suggestion-set,\n.ytp-endscreen-content,\n.ytp-videowall-still-info { display: none !important; }\n';
  document.head.appendChild(style);
  console.log('Injected 0 style rules, 4 hide rules');
})();
```

## m.youtube.com

**URL**: https://m.youtube.com/

```javascript
// m.youtube.com - Paste this in DevTools Console (F12)
(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = '#primary,\n#columns,\n#header-bar,\nytm-browse,\n.single-column-watch-next-modern-panels,\n.rich-grid-renderer-contents,\n.rich-grid-single-column,\n.chip-bar-contents,\n.rich-grid-sticky-header,\n.frosted-glass,\n.related-items-container,\n.modern-tap-target-ui.center.player-controls-middle-core-buttons > div:nth-of-type(1),\n.modern-tap-target-ui.center.player-controls-middle-core-buttons > div:nth-of-type(3),\nytm-standalone-collection-badge-renderer,\n.clickable-metadata > button-view-model.yt-spec-button-view-model { display: none !important; }\n';
  document.head.appendChild(style);
  console.log('Injected 0 style rules, 15 hide rules');
})();
```

