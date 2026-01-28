#!/usr/bin/env node
/**
 * Test filter themes by injecting CSS via Playwright
 *
 * Usage:
 *   node test-filters.js <site>           # Test a specific site
 *   node test-filters.js --list           # List available sites
 *   node test-filters.js <site> --headed  # Run with visible browser
 *
 * Examples:
 *   node test-filters.js hckrnews
 *   node test-filters.js hn --headed
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Site configurations
const sites = {
  'hn': {
    url: 'https://news.ycombinator.com',
    filterDomain: 'news.ycombinator.com',
    description: 'Hacker News'
  },
  'hckrnews': {
    url: 'https://hckrnews.com',
    filterDomain: 'hckrnews.com',
    description: 'hckr news (HN alternative interface)'
  },
  'reddit': {
    url: 'https://old.reddit.com/r/programming',
    filterDomain: 'reddit.com',
    description: 'Reddit (old.reddit.com)'
  },
  'reddit-new': {
    url: 'https://reddit.com/r/programming',
    filterDomain: 'reddit.com',
    description: 'Reddit (new interface)'
  },
  'youtube': {
    url: 'https://youtube.com',
    filterDomain: 'youtube.com',
    description: 'YouTube'
  },
  'youtube-mobile': {
    url: 'https://m.youtube.com',
    filterDomain: 'm.youtube.com',
    description: 'YouTube Mobile'
  }
};

/**
 * Parse filter file and extract :style() rules for a domain
 */
function parseFilters(filterPath, domain) {
  const content = fs.readFileSync(filterPath, 'utf-8');
  const lines = content.split('\n');
  const cssRules = [];
  const hideSelectors = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('!')) continue;

    // Check if line starts with our domain
    if (!trimmed.startsWith(domain + '##')) continue;

    // Extract the selector part after domain##
    const selectorPart = trimmed.slice(domain.length + 2);

    // Check for :style() rules
    const styleMatch = selectorPart.match(/^(.+?):style\((.+)\)$/);
    if (styleMatch) {
      const selector = styleMatch[1];
      const styles = styleMatch[2];
      cssRules.push(`${selector} { ${styles} }`);
    } else {
      // It's a hiding rule
      hideSelectors.push(selectorPart);
    }
  }

  return { cssRules, hideSelectors };
}

/**
 * Generate CSS from parsed filters
 */
function generateCSS(cssRules, hideSelectors) {
  let css = '';

  // Add style rules
  css += cssRules.join('\n');

  // Add hiding rules
  if (hideSelectors.length > 0) {
    css += `\n${hideSelectors.join(', ')} { display: none !important; }`;
  }

  return css;
}

async function testSite(siteKey, options = {}) {
  const site = sites[siteKey];
  if (!site) {
    console.error(`Unknown site: ${siteKey}`);
    console.log('Available sites:', Object.keys(sites).join(', '));
    process.exit(1);
  }

  const filterPath = path.join(__dirname, 'social.txt');
  const { cssRules, hideSelectors } = parseFilters(filterPath, site.filterDomain);
  const css = generateCSS(cssRules, hideSelectors);

  console.log(`Testing: ${site.description}`);
  console.log(`URL: ${site.url}`);
  console.log(`Found ${cssRules.length} style rules, ${hideSelectors.length} hide rules`);
  console.log('---');

  if (options.showCSS) {
    console.log('Generated CSS:');
    console.log(css);
    console.log('---');
  }

  const browser = await chromium.launch({
    headless: !options.headed,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to page...');
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Take before screenshot
    const beforePath = path.join(__dirname, `test-${siteKey}-before.png`);
    await page.screenshot({ path: beforePath });
    console.log(`Before screenshot: ${beforePath}`);

    // Inject CSS
    if (css.trim()) {
      await page.addStyleTag({ content: css });
      console.log('CSS injected');
    }

    // Wait a moment for styles to apply
    await page.waitForTimeout(500);

    // Take after screenshot
    const afterPath = path.join(__dirname, `test-${siteKey}-after.png`);
    await page.screenshot({ path: afterPath });
    console.log(`After screenshot: ${afterPath}`);

    if (options.headed) {
      console.log('\nBrowser is open. Press Ctrl+C to close.');
      await new Promise(() => {}); // Wait forever
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (!options.headed) {
      await browser.close();
    }
  }
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--list') || args.length === 0) {
  console.log('Available sites:');
  for (const [key, site] of Object.entries(sites)) {
    console.log(`  ${key.padEnd(15)} - ${site.description}`);
  }
  console.log('\nUsage: node test-filters.js <site> [--headed] [--show-css]');
  process.exit(0);
}

const siteKey = args[0];
const options = {
  headed: args.includes('--headed'),
  showCSS: args.includes('--show-css')
};

testSite(siteKey, options);
