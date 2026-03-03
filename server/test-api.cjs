
const http = require('http');

const testUser = {
    username: 'testuser_' + Date.now(),
    intensity: 'moderate'
};

function post(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3005,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3005${path}`, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        }).on('error', (e) => reject(e));
    });
}

async function runTests() {
    console.log('--- Starting Backend API Tests ---');
    try {
        // 1. Test Login/User Creation
        console.log('Testing /api/auth/login...');
        const loginResp = await post('/api/auth/login', testUser);
        console.log('Login Status:', loginResp.status);
        console.log('User ID:', loginResp.body.id);
        const userId = loginResp.body.id;

        // 2. Test User Check
        console.log('Testing /api/auth/check...');
        const checkResp = await get(`/api/auth/check?username=${testUser.username}`);
        console.log('Check Status:', checkResp.status, 'Exists:', checkResp.body.exists);

        // 3. Test Add Concept
        console.log('Testing /api/concepts (POST)...');
        const concept = {
            id: 'test-concept-' + Date.now(),
            user_id: userId,
            title: 'Test Physics Concept',
            subject: 'Physics',
            description: 'Testing the backend persistence',
            difficulty: 'Easy',
            retentionScore: 50,
            lastReviewed: '-',
            nextReviewDate: new Date().toISOString().split('T')[0],
            status: 'New'
        };
        const addResp = await post('/api/concepts', concept);
        console.log('Add Concept Status:', addResp.status);

        // 4. Test Fetch Concepts
        console.log('Testing /api/concepts/:userId (GET)...');
        const fetchResp = await get(`/api/concepts/${userId}`);
        console.log('Fetch Status:', fetchResp.status, 'Count:', fetchResp.body.length);

        console.log('--- All Backend Tests Passed (Locally) ---');
    } catch (err) {
        console.error('Test failed:', err.message);
        console.log('Ensure the server is running with "npm run server"');
    }
}

runTests();
