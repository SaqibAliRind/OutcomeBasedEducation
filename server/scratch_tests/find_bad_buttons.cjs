const fs = require('fs');
const path = require('path');

const dir = 'D:/Al-Kawthar/client/src/components';
const badPatterns = [];

const walk = (d) => {
    fs.readdirSync(d).forEach(f => {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.jsx')) {
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, i) => {
                // Find buttons with className that also have inline style overriding background/color
                if (line.includes('className=') && line.includes('primary-btn') && line.includes('style=') && 
                    (line.includes('background') || line.includes('color'))) {
                    badPatterns.push({
                        file: full.replace('D:/Al-Kawthar/client/src/', ''),
                        line: i + 1,
                        content: line.trim().substring(0, 120)
                    });
                }
            });
        }
    });
};

walk(dir);
console.log(`Found ${badPatterns.length} buttons with inline style overrides:\n`);
badPatterns.forEach(p => console.log(`${p.file}:${p.line}\n  ${p.content}\n`));
