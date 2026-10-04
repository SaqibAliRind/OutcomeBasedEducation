const fs = require('fs');
const path = require('path');
const dir = 'd:/Al-Kawthar/client/src/components';

function replaceInFile(fp) {
    let content = fs.readFileSync(fp, 'utf8');
    let original = content;

    // 1. Standardize forms
    // Change <form onSubmit=...> to <form className="modal-form" onSubmit=...>
    content = content.replace(/<form(?!\s+className)[^>]*>/g, match => {
        return match.replace('<form', '<form className="modal-form"');
    });

    // Change <form className="something"> to <form className="modal-form something">
    content = content.replace(/<form\s+className="([^"]*)"/g, (match, p1) => {
        if (!p1.includes('modal-form')) {
            return `<form className="modal-form ${p1}"`;
        }
        return match;
    });

    // 2. Buttons styling
    // Primary gradient buttons
    content = content.replace(/<button[^>]*style=\{\{[^}]*background:\s*(?:'|")linear-gradient[^}]*\}\}[^>]*>/g, match => {
        let newMatch = match.replace(/style=\{\{[^}]*\}\}/, 'className="primary-btn"');
        if (!newMatch.includes('className=')) {
            newMatch = newMatch.replace('<button', '<button className="primary-btn"');
        } else if (match.includes('className="')) {
            newMatch = newMatch.replace(/className="([^"]*)"/, (m, p1) => {
                if(!p1.includes('primary-btn')) return `className="${p1} primary-btn"`;
                return m;
            });
        }
        return newMatch;
    });

    // Transparent / Reset / Delete action buttons
    content = content.replace(/<button[^>]*style=\{\{[^}]*background:\s*(?:'|")transparent(?:'|")[^}]*\}\}[^>]*>/g, match => {
        let btnClass = 'action-btn';
        if (match.includes('Trash') || match.includes('color: \'#ff1b6b\'') || match.includes('color: "#ff1b6b"')) btnClass += ' delete';
        else if (match.includes('Edit') || match.includes('color: \'#2196f3\'') || match.includes('color: "#2196f3"')) btnClass += ' edit';
        else if (match.includes('color: \'#ff9800\'') || match.includes('color: "#ff9800"')) btnClass += ' toggle';
        
        let newMatch = match.replace(/style=\{\{[^}]*\}\}/, `className="${btnClass}"`);
        if (!newMatch.includes('className=')) {
            newMatch = newMatch.replace('<button', `<button className="${btnClass}"`);
        }
        return newMatch;
    });

    if (content !== original) {
        fs.writeFileSync(fp, content, 'utf8');
        console.log('Fixed UI styles in ' + path.basename(fp));
    }
}

function scan(directory) {
    let files = fs.readdirSync(directory);
    files.forEach(f => {
        const fp = path.join(directory, f);
        if (fs.statSync(fp).isDirectory()) {
            scan(fp);
        } else if (f.endsWith('.jsx')) {
            replaceInFile(fp);
        }
    });
}
scan(dir);
