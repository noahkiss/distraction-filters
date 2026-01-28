#!/usr/bin/env node
/**
 * Generates JSON data for GitHub issue creation
 * Output: { body: string, domains: [{ name: string, comment: string }] }
 */

const fs = require('fs');
const path = require('path');

const filterPath = path.join(__dirname, '../../social.txt');

function parseFilters() {
  const content = fs.readFileSync(filterPath, 'utf-8');
  const lines = content.split('\n');
  const domains = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('!')) continue;

    const match = trimmed.match(/^([a-zA-Z0-9.-]+)##(.+)$/);
    if (!match) continue;

    const [, domain, selectorPart] = match;

    if (!domains.has(domain)) {
      domains.set(domain, { styleRules: [], hideSelectors: [] });
    }

    const domainRules = domains.get(domain);
    const styleMatch = selectorPart.match(/^(.+?):style\((.+)\)$/);

    if (styleMatch) {
      domainRules.styleRules.push({ selector: styleMatch[1], styles: styleMatch[2] });
    } else {
      domainRules.hideSelectors.push(selectorPart);
    }
  }

  return domains;
}

function generateCSS(rules) {
  let css = '';
  for (const { selector, styles } of rules.styleRules) {
    css += `${selector} { ${styles} }\n`;
  }
  if (rules.hideSelectors.length > 0) {
    css += `${rules.hideSelectors.join(',\n')} { display: none !important; }\n`;
  }
  return css;
}

function generateConsoleCommand(domain, rules) {
  const css = generateCSS(rules);
  const escapedCSS = css
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');

  return `(function() {
  const style = document.createElement('style');
  style.id = 'distraction-filter-test';
  style.textContent = '${escapedCSS}';
  document.head.appendChild(style);
  console.log('✅ Injected ${rules.styleRules.length} style rules, ${rules.hideSelectors.length} hide rules');
})();`;
}

function generateRemoveCommand() {
  return `document.getElementById('distraction-filter-test')?.remove(); console.log('🗑️ Removed test styles');`;
}

// Main
const domains = parseFilters();
const domainList = [];

for (const [domain, rules] of domains) {
  const styleCount = rules.styleRules.length;
  const hideCount = rules.hideSelectors.length;
  const type = styleCount > 0 && hideCount > 0 ? 'theme + hide' :
               styleCount > 0 ? 'theme' : 'hide';

  const isMobile = domain.startsWith('m.');
  const mobileNote = isMobile ? '\n\n> 📱 **Mobile site**: Use DevTools device toolbar (Ctrl+Shift+M) to emulate mobile viewport' : '';

  const comment = `## ${domain}

**Type**: ${type} (${styleCount} style, ${hideCount} hide)
**URL**: https://${domain}/${mobileNote}

### Inject styles

\`\`\`javascript
${generateConsoleCommand(domain, rules)}
\`\`\`

### Remove styles

\`\`\`javascript
${generateRemoveCommand()}
\`\`\`

---
- [ ] Tested and working`;

  domainList.push({
    name: domain,
    comment: comment
  });
}

const body = `# Filter Test Checklist

This issue was automatically created because \`social.txt\` was updated.

## How to test

1. Open each domain URL in your browser
2. Open DevTools (F12) → Console
3. Copy the "Inject styles" code block from each comment below
4. Paste and run in console
5. Verify the styles work correctly
6. Check the checkbox in the comment when done

## Domains to test

${domainList.map(d => `- [ ] ${d.name}`).join('\n')}

## Remove command (same for all)

\`\`\`javascript
${generateRemoveCommand()}
\`\`\`

Close this issue when all domains are tested.`;

console.log(JSON.stringify({ body, domains: domainList }, null, 2));
