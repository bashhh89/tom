const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'klavis-strata-config.json');
let config;

try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error('Error loading configuration:', error);
    process.exit(1);
}

// Extract configuration values
const { port, endpoint, url } = config;

// Parse the URL to get hostname and path
const urlObj = new URL(url);
const hostname = urlObj.hostname;
const pathWithQuery = urlObj.pathname + urlObj.search;

// Create a robust HTTP server that forwards requests to Klavis
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === endpoint) {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // Forward the request to Klavis
                const options = {
                    hostname: hostname,
                    port: 443,
                    path: pathWithQuery,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body)
                    }
                };

                const proxyReq = https.request(options, (proxyRes) => {
                    let responseData = '';

                    proxyRes.on('data', chunk => {
                        responseData += chunk;
                    });

                    proxyRes.on('end', () => {
                        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(responseData);
                    });
                });

                proxyReq.on('error', (error) => {
                    console.error('Proxy request error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Proxy error', details: error.message }));
                });

                proxyReq.write(body);
                proxyReq.end();
            } catch (error) {
                console.error('Request processing error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Server error', details: error.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
});

server.listen(port, () => {
    console.log(`Klavis MCP proxy server running on port ${port}`);
    console.log(`Forwarding requests to: ${url}`);
    console.log(`Endpoint: ${endpoint}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
