
const http = require('http');

function get(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3001${path}`, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', (e) => resolve({ status: 500, body: e.message }));
    });
}

async function runTests() {
    console.log('--- Testing Unified Portal ---');

    const root = await get('/');
    console.log('GET /:', root.status);
    if (root.body.includes('<div id="root">')) console.log('✓ Root works');
    else console.log('✗ Root FAILED');

    const apiCheck = await get('/api/auth/check?username=test');
    console.log('GET /api/auth/check:', apiCheck.status);
    if (apiCheck.status === 200) console.log('✓ API works');
    else console.log('✗ API FAILED');

    console.log('--- Results Done ---');
}

runTests();
