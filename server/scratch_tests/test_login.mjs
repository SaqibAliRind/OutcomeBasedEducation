async function testLogin() {
    try {
        console.log('Testing admin@alkawthar.com / admin123');
        let res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@alkawthar.com', password: 'admin123' })
        });
        let data = await res.json();
        console.log('Admin login res:', res.status, data.email, data.role, data.message);
    } catch (e) {
        console.error('Admin login failed:', e.message);
    }

    try {
        console.log('\nTesting uniadmin@test.com / 325531167');
        let res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'uniadmin@test.com', password: '325531167' })
        });
        let data = await res.json();
        console.log('UniAdmin login res:', res.status, data.email, data.role, data.message);
    } catch (e) {
        console.error('UniAdmin login failed:', e.message);
    }

    try {
        console.log('\nTesting student1@test.com / 325531167');
        let res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'student1@test.com', password: '325531167' })
        });
        let data = await res.json();
        console.log('Student login res:', res.status, data.email, data.role, data.message);
    } catch (e) {
        console.error('Student login failed:', e.message);
    }
}
testLogin();
