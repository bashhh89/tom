// Deployment script for Easypanel production environment
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to load environment variables from .env file
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Environment file ${filePath} not found`);
    return;
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Don't overwrite existing environment variables
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  });
}

// Load environment variables
console.log('Loading environment variables...');
loadEnvFile('.env');
loadEnvFile('.env.local');

// Set production environment
process.env.NODE_ENV = 'production';
// Default to port 80 if not specified (Easypanel default)
process.env.PORT = process.env.PORT || '80';
// Enable production logs for debugging
process.env.ENABLE_PRODUCTION_LOGS = 'true';

console.log('Environment variables loaded:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- ENABLE_AUTO_COMPLETE: ${process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETE || 'false'}`);

// Start the Next.js server
console.log('Starting production server...');
// The Dockerfile puts deploy-production.js in /app
// The standalone build is copied to /app (so server.js is at /app/server.js)
// We are running from /app, so server.js is in the current directory or just inside standalone logic depending on how we copied it
// Based on Dockerfile: COPY --from=builder /app/.next/standalone ./
// This puts server.js directly in /app

// Check if server.js exists in current directory
let serverPath = 'server.js';
let cwd = process.cwd();

if (!fs.existsSync(path.join(cwd, serverPath))) {
  // Try looking in .next/standalone (local development fallback)
  if (fs.existsSync(path.join(cwd, '.next/standalone/server.js'))) {
    cwd = path.join(cwd, '.next/standalone');
  } else {
    console.warn('Warning: server.js not found in expected locations. Trying default...');
  }
}

console.log(`Starting server from ${cwd} with ${serverPath}`);

const server = spawn('node', [serverPath], {
  cwd: cwd,
  env: process.env,
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});
