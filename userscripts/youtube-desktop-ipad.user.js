// ==UserScript==
// @name         YouTube Desktop for iPad
// @namespace    https://github.com/noahkiss/distraction-filters
// @version      1.1.0
// @description  Keeps YouTube on the desktop site on iPad Safari. Bounces m.youtube.com back to www.youtube.com, persists the desktop preference, guards against redirect loops, and keeps the address bar clean.
// @author       noahkiss
// @license      MIT
// @homepageURL  https://github.com/noahkiss/distraction-filters
// @supportURL   https://github.com/noahkiss/distraction-filters/issues
// @downloadURL  https://raw.githubusercontent.com/noahkiss/distraction-filters/main/userscripts/youtube-desktop-ipad.user.js
// @updateURL    https://raw.githubusercontent.com/noahkiss/distraction-filters/main/userscripts/youtube-desktop-ipad.user.js
// @match        https://youtube.com/*
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

// Derived from "YouTube Desktop for iPad" 1.0.0 by Floris (MIT),
// https://greasyfork.org/en/scripts/594338-youtube-desktop-for-ipad
//
// Background: since early August 2026 YouTube redirects iPad Safari to
// m.youtube.com even with "Request Desktop Website" enabled. The redirect
// is server-side and appears tied to the signed-in account. Opening
// https://www.youtube.com/?app=desktop&persist_app=1 forces the desktop
// site; this script applies that on every load.
//
// Changes from 1.0.0:
//   - Redirect-loop guard. If YouTube ever ignores app=desktop and bounces
//     back to m.youtube.com, the script stops after MAX_ATTEMPTS within
//     ATTEMPT_WINDOW_MS instead of spinning until Safari gives up.
//   - Clean address bar. Once the desktop site loads, app=desktop and
//     persist_app=1 are removed from the URL so copied links stay clean.
//   - iPad detection no longer depends only on navigator.platform, which
//     is deprecated. It also accepts a Macintosh user agent with touch.
//   - Skips paths that must not be rewritten (embeds, redirects, TV UI).

(() => {
  'use strict';

  const DESKTOP_HOST = 'www.youtube.com';
  const MOBILE_HOST = 'm.youtube.com';
  const MAX_ATTEMPTS = 3;
  const ATTEMPT_WINDOW_MS = 15000;
  const GUARD_KEY = 'yt-desktop-ipad:attempts';
  const SKIP_PATH = /^\/(embed\/|redirect\b|oembed\b|tv\b|iframe_api\b|s\/)/;

  function isIPad() {
    const ua = navigator.userAgent || '';
    const touch = (navigator.maxTouchPoints || 0) > 1;
    if (/\biPad\b/i.test(ua)) return true;
    // "Request Desktop Website" reports a Mac user agent. A real Mac has no
    // touch points, so Mac + touch means an iPad.
    const looksMac = navigator.platform === 'MacIntel' || /\bMacintosh\b/.test(ua);
    return looksMac && touch;
  }

  // Attempt counter lives in sessionStorage, which is per origin. Every
  // redirect this script issues increments the counter on the origin it left,
  // so a loop through www and m stops after MAX_ATTEMPTS on either side.
  // Entries older than ATTEMPT_WINDOW_MS reset, so a stale count never blocks
  // a later visit.
  function readAttempts() {
    try {
      const raw = sessionStorage.getItem(GUARD_KEY);
      if (!raw) return 0;
      const { n, t } = JSON.parse(raw);
      if (typeof n !== 'number' || typeof t !== 'number') return 0;
      if (Date.now() - t > ATTEMPT_WINDOW_MS) return 0;
      return n;
    } catch {
      return 0;
    }
  }

  function writeAttempts(n) {
    try {
      sessionStorage.setItem(GUARD_KEY, JSON.stringify({ n, t: Date.now() }));
    } catch {
      // Storage unavailable (private mode quirks). Fall through; the redirect
      // still happens, just without a guard.
    }
  }

  function clearAttempts() {
    try {
      sessionStorage.removeItem(GUARD_KEY);
    } catch {
      // Ignore.
    }
  }

  function cleanAddressBar(url) {
    if (!url.searchParams.has('app') && !url.searchParams.has('persist_app')) return;
    url.searchParams.delete('app');
    url.searchParams.delete('persist_app');
    try {
      history.replaceState(history.state, '', url.href);
    } catch {
      // Ignore. A visible query string is cosmetic.
    }
  }

  if (!isIPad()) return;

  const url = new URL(location.href);
  if (SKIP_PATH.test(url.pathname)) return;

  const onDesktopHost = url.hostname === DESKTOP_HOST;
  const hasDesktopParams =
    url.searchParams.get('app') === 'desktop' && url.searchParams.get('persist_app') === '1';

  // Already on the desktop site with the persist params: YouTube honored the
  // request. Tidy the URL and stop.
  if (onDesktopHost && hasDesktopParams) {
    clearAttempts();
    cleanAddressBar(url);
    return;
  }

  // Anything else (m.youtube.com, bare youtube.com, or www without the persist
  // params) gets sent to the desktop site with the params. Plain www is
  // rewritten eagerly, before the server can bounce it to m.youtube.com: for
  // an affected account that saves a hop on every new tab, at the cost of one
  // extra fetch on a manual refresh.
  const attempts = readAttempts();
  if (attempts >= MAX_ATTEMPTS) {
    console.warn(
      `[YouTube Desktop for iPad] gave up after ${attempts} redirects from ${url.hostname} in ${ATTEMPT_WINDOW_MS / 1000}s; YouTube is not honoring app=desktop.`
    );
    return;
  }
  writeAttempts(attempts + 1);

  url.hostname = DESKTOP_HOST;
  url.searchParams.delete('ra'); // YouTube's mobile-redirect marker
  url.searchParams.set('app', 'desktop');
  url.searchParams.set('persist_app', '1');
  location.replace(url.href);
})();
