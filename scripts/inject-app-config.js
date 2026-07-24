const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'dist', 'todoapp', 'browser');
const indexPath = path.join(outputDir, 'index.html');
const apiBaseUrl = process.env.API_BASE_URL ?? '';

if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found. Run ng build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const injection = `<script>window.__APP_CONFIG__ = { apiBaseUrl: '${apiBaseUrl}' };</script>`;
const modified = html.replace('<body>', `<body>\n  ${injection}`);
fs.writeFileSync(indexPath, modified, 'utf8');
console.log(`Injected API base URL: ${apiBaseUrl}`);
