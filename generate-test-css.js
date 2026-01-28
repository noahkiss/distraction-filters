#!/usr/bin/env node
/**
 * Generate browser console commands to test filter CSS
 *
 * Usage:
 *   node generate-test-css.js              # List all sites
 *   node generate-test-css.js <domain>     # Generate console command for a site
 *   node generate-test-css.js --all        # Generate all commands to a file
 *
 * Then paste the output into browser DevTools console (F12 > Console)
 *
 * For mobile testing: Use DevTools device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
 */

const fs = require('fs');
const path = require('path');

const filterPath = path.join(__dirname, 'social.txt');

/**
 * Parse filter file and group rules by domain
 */
function parseFilters() {
  const content = fs.readFileSync(filterPath, 'utf-8');
  const lines = content.split('\n');
  const domains = new Map();

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('!')) continue;

    // Match domain##selector or domain##selector:style(...)
    const match = trimmed.match(/^([a-zA-Z0-9.-]+)##(.+)$/);
    if (!match) continue;

    const [, domain, selectorPart] = match;

    if (!domains.has(domain)) {
      domains.set(domain, { styleRules: [], hideSelectors: [] });
    }

    const domainRules = domains.get(domain);

    // Check for :style() rules
    const styleMatch = selectorPart.match(/^(.+?):style\((.+)\)$/);
    if (styleMatch) {
      const selector = styleMatch[1];
      const styles = styleMatch[2];
      domainRules.styleRules.push({ selector, styles });
    } else {
      // It's a hiding rule
      domainRules.hideSelectors.push(selectorPart);
    }
  }

  return domains;
}

/**
 * Generate CSS string from rules
 */
function generateCSS(rules) {
  let css = '';

  // Add style rules
  for (const { selector, styles } of rules.styleRules) {
    css += `${selector} { ${styles} }\n`;
  }

  // Add hiding rules
  if (rules.hideSelectors.length > 0) {
    css += `${rules.hideSelectors.join(',\n')} { display: none !important; }\n`;
  }

  return css;
}

/**
 * Generate a console command that injects CSS
 */
function generateConsoleCommand(domain, rules) {
  const css = generateCSS(rules);

  // Escape for JavaScript string
  const escapedCSS = css
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');

  return `// ${domain} - Paste this in DevTools Console (F12)
(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = '${escapedCSS}';
  document.head.appendChild(style);
  console.log('Injected ${rules.styleRules.length} style rules, ${rules.hideSelectors.length} hide rules');
})();`;
}

/**
 * Generate a removal command
 */
function generateRemoveCommand() {
  return `// Remove injected styles
document.getElementById('distraction-filter-test')?.remove();`;
}

// CLI
const args = process.argv.slice(2);
const domains = parseFilters();

if (args.length === 0 || args[0] === '--list') {
  console.log('Available domains:\n');
  for (const [domain, rules] of domains) {
    const styleCount = rules.styleRules.length;
    const hideCount = rules.hideSelectors.length;
    const type = styleCount > 0 && hideCount > 0 ? 'theme + hide' :
                 styleCount > 0 ? 'theme' : 'hide';
    console.log(`  ${domain.padEnd(25)} ${styleCount} style, ${hideCount} hide (${type})`);
  }
  console.log('\nUsage: node generate-test-css.js <domain>');
  console.log('\nFor mobile sites (m.youtube.com), use DevTools device toolbar:');
  console.log('  Chrome/Edge: Ctrl+Shift+M (Cmd+Shift+M on Mac)');
  console.log('  Then select a mobile device from the dropdown');
  process.exit(0);
}

if (args[0] === '--all') {
  // Generate all commands to a markdown file
  let output = '# Filter Test Commands\n\n';
  output += 'Paste these into browser DevTools Console (F12) to test filters.\n\n';
  output += '## Remove Command\n\n```javascript\n' + generateRemoveCommand() + '\n```\n\n';

  for (const [domain, rules] of domains) {
    output += `## ${domain}\n\n`;
    output += `**URL**: https://${domain}/\n\n`;
    output += '```javascript\n' + generateConsoleCommand(domain, rules) + '\n```\n\n';
  }

  const outPath = path.join(__dirname, 'test-commands.md');
  fs.writeFileSync(outPath, output);
  console.log(`Generated: ${outPath}`);
  process.exit(0);
}

// Find matching domain
const query = args[0].toLowerCase();
let foundDomain = null;

for (const domain of domains.keys()) {
  if (domain === query || domain.includes(query)) {
    foundDomain = domain;
    break;
  }
}

if (!foundDomain) {
  console.error(`Domain not found: ${query}`);
  console.log('Available:', [...domains.keys()].join(', '));
  process.exit(1);
}

const rules = domains.get(foundDomain);
console.log(generateConsoleCommand(foundDomain, rules));
console.log('\n// ---');
console.log(generateRemoveCommand());
