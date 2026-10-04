import fs from 'fs';
const file = '../client/src/components/AnalyticsManagement.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/(<KpiCard[^>]*?value=)"[^"]+"/g, '$1"—"');
fs.writeFileSync(file, content);
console.log('Replaced all KpiCard mock values with —');
