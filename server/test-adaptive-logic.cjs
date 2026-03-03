async function runTests() {
    console.log('--- Starting Adaptive Study Plan Logic Verification ---');
    const BASE_URL = 'http://localhost:3005';

    try {
        // 1. Register/Login as Student
        console.log('Registering test student...');
        const uniqueUser = 'stud_adaptive_' + Date.now();
        const regResp = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: uniqueUser,
                email: uniqueUser + '@test.com',
                password: 'password123',
                role: 'student'
            })
        });
        const regData = await regResp.json();

        console.log('Logging in...');
        const loginResp = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: uniqueUser,
                password: 'password123'
            })
        });
        const loginData = await loginResp.json();
        const token = loginData.token;
        const userId = loginData.user.id;

        // 2. Create Test Concepts
        console.log('Creating test concepts with various retention states...');
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        const testConcepts = [
            { id: 'c1', title: 'Urgent: Low Score', retentionScore: 40, nextReviewDate: nextWeek },
            { id: 'c2', title: 'Urgent: Overdue', retentionScore: 90, nextReviewDate: yesterday },
            { id: 'c3', title: 'Practice: Mid Range', retentionScore: 70, nextReviewDate: nextWeek },
            { id: 'c4', title: 'Safe: High Score', retentionScore: 95, nextReviewDate: nextWeek }
        ];

        for (const c of testConcepts) {
            await fetch(`${BASE_URL}/api/concepts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: c.id,
                    user_id: userId,
                    title: c.title,
                    subject: 'Testing',
                    description: 'Testing adaptive logic',
                    difficulty: 'Medium',
                    retentionScore: c.retentionScore,
                    lastReviewed: yesterday,
                    nextReviewDate: c.nextReviewDate,
                    status: 'Reviewing'
                })
            });
        }

        // 3. Verify Recommendations
        console.log('Fetching adaptive study plan...');
        const planResp = await fetch(`${BASE_URL}/api/adaptive/study-plan`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const plan = await planResp.json();

        console.log('Study Plan Summary:', plan.summary);

        const urgentTitles = plan.urgentRevision.map(c => c.title);
        console.log('Urgent Revision Topics:', urgentTitles);

        const recTitles = plan.recommendedPractice.map(c => c.title);
        console.log('Recommended Practice Topics:', recTitles);

        // Assertions
        const hasLowScore = urgentTitles.includes('Urgent: Low Score');
        const hasOverdue = urgentTitles.includes('Urgent: Overdue');
        const hasMidRange = recTitles.includes('Practice: Mid Range');
        const hasSafe = urgentTitles.includes('Safe: High Score') || recTitles.includes('Safe: High Score');

        if (hasLowScore && hasOverdue) {
            console.log('✅ Urgent topics correctly identified.');
        } else {
            console.error('❌ Failed identifying urgent topics.');
        }

        if (hasMidRange) {
            console.log('✅ Practice topics correctly identified.');
        } else {
            console.error('❌ Failed identifying practice topics.');
        }

        if (!hasSafe) {
            console.log('✅ Safe topics correctly excluded from priorities.');
        } else {
            console.error('❌ Safe topics incorrectly included.');
        }

        console.log('--- Verification Complete ---');
    } catch (err) {
        console.error('Verification Failed:', err.message);
        process.exit(1);
    }
}

runTests();
