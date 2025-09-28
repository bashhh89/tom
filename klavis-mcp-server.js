const https = require('https');
const http = require('http');

// Create a simple HTTP server that forwards requests to Klavis
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/mcp') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            // Forward the request to Klavis
            const options = {
                hostname: 'strata.klavis.ai',
                port: 443,
                path: '/mcp/?strata_id=8f2d8f1b-37cc-479a-b598-e7505ed32203',
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
                res.end(JSON.stringify({ error: 'Proxy error' }));
            });
            
            proxyReq.write(body);
            proxyReq.end();
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(7567, () => {
    console.log('Klavis MCP proxy server running on port 7567');
});
