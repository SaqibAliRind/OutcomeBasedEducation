const fs = require('fs');
const path = require('path');
const dir = 'D:/Al-Kawthar/client/src/components';
let buttonClasses = new Set();
const walk = (d) => {
    fs.readdirSync(d).forEach(f => {
        let full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.jsx')) {
            let content = fs.readFileSync(full, 'utf8');
            let matches = content.match(/className=["']([^"']+)["']/g);
            if(matches) {
                matches.forEach(m => {
                    let cls = m.match(/className=["']([^"']+)["']/)[1];
                    cls.split(' ').forEach(c => {
                        if(c.includes('badge') || c.includes('status')) buttonClasses.add(c);
                    });
                });
            }
        }
    });
};
walk(dir);
console.log(Array.from(buttonClasses));
