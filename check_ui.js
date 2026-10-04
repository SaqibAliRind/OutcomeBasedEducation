const fs = require('fs');
const path = require('path');
const dir = 'd:/Al-Kawthar/client/src/components';

function scan(directory) {
    let files = fs.readdirSync(directory);
    let inconsistentForms = [];
    files.forEach(f => {
        const fp = path.join(directory, f);
        if (fs.statSync(fp).isDirectory()) {
            scan(fp);
        } else if (f.endsWith('.jsx')) {
            const content = fs.readFileSync(fp, 'utf8');
            if (content.includes('<form') && !content.includes('className="modal-form"')) {
                inconsistentForms.push(f);
            }
        }
    });
    if(inconsistentForms.length > 0) {
        console.log('Files with unstyled <form>: ' + inconsistentForms.join(', '));
    }
}
scan(dir);
