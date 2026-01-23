const fs = require('fs');
const path = require('path');

// Keys to export to frontend
const ENV_KEYS = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

// MANUAL .ENV LOADING (For local dev without dotenv)
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// Generate config content

// Generate config content
const config = ENV_KEYS.reduce((acc, key) => {
    acc[key] = process.env[key] || '';
    return acc;
}, {});

const fileContent = `window.ENV = ${JSON.stringify(config, null, 2)};`;

// Ensure directory exists
const targetDir = path.join(__dirname, '../client/js');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Write file
const targetPath = path.join(targetDir, 'env-config.js');
fs.writeFileSync(targetPath, fileContent);

console.log('✅ Generated client/js/env-config.js with environment variables');
