async function runTests() {
    console.log('--- Starting Concept Monitoring API Tests ---');
    const BASE_URL = 'http://localhost:3005';

    try {
        // 1. Register as Faculty
        console.log('Testing Faculty Registration...');
        const uniqueUser = 'fac_verify_' + Date.now();
        const regResp = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: uniqueUser,
                email: uniqueUser + '@test.com',
                password: 'password123',
                role: 'faculty'
            })
        });
        const regData = await regResp.json();
        if (!regResp.ok) throw new Error('Registration failed: ' + JSON.stringify(regData));
        console.log('Faculty Registered.');

        // 2. Login
        console.log('Testing Faculty Login...');
        const loginResp = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: uniqueUser,
                password: 'password123'
            })
        });

        const loginData = await loginResp.json();
        if (!loginData.token) throw new Error('No token received: ' + JSON.stringify(loginData));
        const token = loginData.token;
        console.log('Faculty Login Successful.');

        // 3. Create Official Concept
        console.log('Testing Official Concept Creation...');
        const conceptId = 'oc_' + Date.now();
        const conceptData = {
            id: conceptId,
            title: 'Verify Physics Node ' + conceptId,
            subject: 'Physics',
            description: 'Verification concept',
            difficulty: 'Medium',
            questions: [
                {
                    question: 'Verification Question?',
                    options: ['No', 'Yes', 'Maybe', 'Always'],
                    correctAnswerIndex: 1,
                    explanation: 'Verified'
                }
            ]
        };

        const createResp = await fetch(`${BASE_URL}/api/official-concepts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(conceptData)
        });
        const createData = await createResp.json();
        if (!createResp.ok) throw new Error('Creation failed: ' + JSON.stringify(createData));
        console.log('Official Concept Created:', conceptId);

        // 4. List Official Concepts
        console.log('Testing List Official Concepts...');
        const listResp = await fetch(`${BASE_URL}/api/official-concepts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await listResp.json();
        console.log('Official Concepts Count:', listData.length);

        // 5. Get Performance Analytics
        console.log('Testing Performance Analytics...');
        const perfResp = await fetch(`${BASE_URL}/api/analytics/concepts/performance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const perfData = await perfResp.json();
        console.log('Performance Analytics Received:', JSON.stringify(perfData));

        console.log('--- All Tests Passed! ---');
    } catch (err) {
        console.error('Test Failed:', err.message);
        process.exit(1);
    }
}

runTests();
