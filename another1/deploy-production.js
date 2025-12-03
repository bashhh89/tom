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

// FORCE ENABLE AUTO-COMPLETE FOR TESTING ON EASYPANEL
process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETE = 'true';

console.log('Environment variables loaded:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- ENABLE_AUTO_COMPLETE: ${process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETE || 'false'}`);

// Start the Next.js server
console.log('Starting production server...');
const server = spawn('node', ['server.js'], {
  cwd: path.join(process.cwd(), '.next/standalone'),
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
