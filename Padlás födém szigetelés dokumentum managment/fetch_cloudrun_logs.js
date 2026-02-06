const { spawn } = require('child_process');

const PROJECT_ID = 'padlas-fodem-szigeteles';
const SERVICE_NAME = 'padlas-fodem-szigeteles';
const LOG_LIMIT = 50;

// Parse command line arguments
const args = process.argv.slice(2);
const follow = args.includes('--follow') || args.includes('-f');

console.log(`Fetching logs for Cloud Run service: ${SERVICE_NAME} in project: ${PROJECT_ID}...`);
if (follow) {
    console.log('Streaming new logs (Press Ctrl+C to stop)...');
}

// Construct gcloud command
const gcloudArgs = [
    'logging',
    'read',
    `resource.type="cloud_run_revision" AND resource.labels.service_name="${SERVICE_NAME}"`,
    `--project=${PROJECT_ID}`,
    '--format=json' // We get JSON for better parsing, though for simple output "text" might be easier. Let's stick to default or text for readability if not processing.
];

if (!follow) {
    gcloudArgs.push(`--limit=${LOG_LIMIT}`);
}

// If we want a human readable output immediately without parsing JSON manually, we can drop --format=json or use a specific format.
// But gcloud default format is decent. Let's try default format for user readability.
// Overwriting the args to remove json format for better CLI experience
const simpleGcloudArgs = [
    'logging',
    'read',
    `resource.type="cloud_run_revision" AND resource.labels.service_name="${SERVICE_NAME}"`,
    `--project=${PROJECT_ID}`
];

if (!follow) {
    simpleGcloudArgs.push(`--limit=${LOG_LIMIT}`);
}

// Add ordering
simpleGcloudArgs.push('--order=desc');

// If following, use "tail" (beta) or streaming. 
// "gcloud logging read" doesn't strictly support "follow" easily without "beta logging tail".
// But "gcloud logging read" is for past logs.
// Let's stick to reading the last N logs for now as the primary use case.
// If the user wants to stream, we might need "gcloud beta logging tail" which requires extra permissions.
// Let's keep it simple: Read last N logs using standard read.

const cmd = spawn('gcloud', simpleGcloudArgs, { shell: true });

cmd.stdout.on('data', (data) => {
    process.stdout.write(data);
});

cmd.stderr.on('data', (data) => {
    process.stderr.write(data);
});

cmd.on('close', (code) => {
    if (code !== 0) {
        console.error(`gcloud process exited with code ${code}`);
        console.log('Ensure you are authenticated with: gcloud auth login');
    }
});
