const fs = require('fs');
const path = require('path');
const dir = 'd:/Al-Kawthar/client/src/pages';

const files = [
    'teacher/TeacherDashboard.jsx',
    'superadmin/SuperAdminDashboard.jsx',
    'qec/QECDashboard.jsx',
    'hod/HODDashboard.jsx',
    'dean/DeanDashboard.jsx',
    'coordinator/ProgramCoordinatorDashboard.jsx'
];

files.forEach(f => {
    const fullPath = path.join(dir, f);
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/activeTab === 'reports'/g, "activeTab === 'reports_management'");
    fs.writeFileSync(fullPath, content);
});
console.log('Done!');
