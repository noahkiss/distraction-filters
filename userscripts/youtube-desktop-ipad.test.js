// Runs youtube-desktop-ipad.user.js under mocked browser globals and checks
// its redirect decisions. No dependencies:
//   node userscripts/youtube-desktop-ipad.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(process.argv[2] || path.join(__dirname, 'youtube-desktop-ipad.user.js'), 'utf8');

const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

function run({ href, ua, platform = 'MacIntel', touch, storage = {}, now = 1_000_000, storageThrows = false }) {
  const calls = { replace: null, replaceState: null, warn: [] };
  const origin = new URL(href).origin;
  const store = storage[origin] || (storage[origin] = {});
  const ctx = {
    navigator: { userAgent: ua, platform, maxTouchPoints: touch },
    location: { href, replace: (u) => { calls.replace = u; } },
    history: { state: null, replaceState: (s, t, u) => { calls.replaceState = u; } },
    sessionStorage: storageThrows ? { getItem() { throw new Error('nope'); }, setItem() { throw new Error('nope'); }, removeItem() { throw new Error('nope'); } } : {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    console: { warn: (m) => calls.warn.push(m) },
    Date: { now: () => now },
    URL, JSON,
  };
  vm.runInNewContext(src, ctx);
  return calls;
}

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('ok   ', name);
  else { failed++; console.log('FAIL ', name, extra === undefined ? '' : JSON.stringify(extra)); }
}

// 1. Real Mac: untouched.
let r = run({ href: 'https://m.youtube.com/?ra=m', ua: MAC_UA, touch: 0 });
check('mac is ignored', r.replace === null, r);

// 2. iPad UA on m.youtube.com watch page: bounced to www with params, path and v kept, ra dropped.
r = run({ href: 'https://m.youtube.com/watch?v=abc123&ra=m&t=42s', ua: IPAD_UA, touch: 5 });
check('m watch -> www desktop', r.replace === 'https://www.youtube.com/watch?v=abc123&t=42s&app=desktop&persist_app=1', r);

// 3. Desktop-UA iPad (Request Desktop Website) on plain www: eager rewrite.
r = run({ href: 'https://www.youtube.com/', ua: MAC_UA, touch: 5 });
check('desktop-UA iPad plain www -> params', r.replace === 'https://www.youtube.com/?app=desktop&persist_app=1', r);

// 4. platform missing but Macintosh UA + touch: still detected.
r = run({ href: 'https://www.youtube.com/', ua: MAC_UA, platform: undefined, touch: 5 });
check('no navigator.platform still detects iPad', r.replace !== null, r);

// 5. www with params: no redirect, address bar cleaned, other params kept.
r = run({ href: 'https://www.youtube.com/watch?v=abc&app=desktop&persist_app=1', ua: IPAD_UA, touch: 5 });
check('www+params: no redirect', r.replace === null, r);
check('www+params: URL cleaned', r.replaceState === 'https://www.youtube.com/watch?v=abc', r);

// 6. Bare youtube.com: rewritten to www.
r = run({ href: 'https://youtube.com/feed/subscriptions', ua: IPAD_UA, touch: 5 });
check('bare host -> www', r.replace === 'https://www.youtube.com/feed/subscriptions?app=desktop&persist_app=1', r);

// 7. Skipped paths.
for (const p of ['/embed/abc', '/redirect?q=x', '/tv', '/s/player/x.js', '/oembed?url=x']) {
  r = run({ href: 'https://m.youtube.com' + p, ua: IPAD_UA, touch: 5 });
  check('skip ' + p, r.replace === null, r);
}

// 8. Loop guard: repeated loads on m within the window stop after 3.
const storage = {};
const results = [];
for (let i = 0; i < 5; i++) {
  r = run({ href: 'https://m.youtube.com/?ra=m', ua: IPAD_UA, touch: 5, storage, now: 1_000_000 + i * 1000 });
  results.push(r.replace !== null);
}
check('loop guard stops after 3', JSON.stringify(results) === JSON.stringify([true, true, true, false, false]), results);
check('loop guard warns', r.warn.length === 1 && /gave up/.test(r.warn[0]), r.warn);

// 9. Stale counter (outside window) resets.
r = run({ href: 'https://m.youtube.com/?ra=m', ua: IPAD_UA, touch: 5, storage, now: 1_000_000 + 60_000 });
check('stale counter resets', r.replace !== null, r);

// 10. Landing on www with params clears the www counter.
const s2 = { 'https://www.youtube.com': { 'yt-desktop-ipad:attempts': JSON.stringify({ n: 3, t: 1_000_000 }) } };
r = run({ href: 'https://www.youtube.com/?app=desktop&persist_app=1', ua: IPAD_UA, touch: 5, storage: s2 });
check('success clears counter', !('yt-desktop-ipad:attempts' in s2['https://www.youtube.com']), s2);
r = run({ href: 'https://www.youtube.com/', ua: IPAD_UA, touch: 5, storage: s2, now: 1_000_500 });
check('redirect works again after clear', r.replace !== null, r);

// 11. Storage throws: still redirects.
const ctxThrow = run({ href: 'https://m.youtube.com/?ra=m', ua: IPAD_UA, touch: 5, storageThrows: true });
check('storage failure still redirects', ctxThrow.replace !== null, ctxThrow);

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
