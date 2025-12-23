// using native fetch


async function verify() {
    const API_URL = 'http://localhost:3000/api';

    try {
        // 1. Get Projects
        console.log('Fetching projects...');
        const projectsRes = await fetch(`${API_URL}/projects`);
        if (!projectsRes.ok) throw new Error(`Failed to fetch projects: ${projectsRes.statusText}`);
        const projectsData = await projectsRes.json();

        if (!projectsData.success || !projectsData.data || projectsData.data.length === 0) {
            console.error('No projects found to test with.');
            return;
        }

        const project = projectsData.data[0];
        console.log(`Using Project ID: ${project.id} (Contract: ${project.contract_number})`);

        // 2. Generate Document
        console.log('Triggering document generation...');
        const generateRes = await fetch(`${API_URL}/documents/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: project.id,
                documentType: 'kivitelezesi_szerzodes'
            })
        });

        if (!generateRes.ok) {
            const errorText = await generateRes.text();
            throw new Error(`Generation failed: ${generateRes.status} ${generateRes.statusText} - ${errorText}`);
        }

        const genData = await generateRes.json();
        console.log('✅ Generation Successful!');
        console.log('Result:', JSON.stringify(genData, null, 2));

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verify();
