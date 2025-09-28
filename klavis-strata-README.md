# Klavis Strata MCP Server

This is a Model Control Protocol (MCP) server for Klavis Strata that acts as a proxy to forward requests to the Klavis API.

## Configuration

The server is configured using the `klavis-strata-config.json` file:

```json
{
  "name": "klavis-strata",
  "type": "http",
  "url": "https://strata.klavis.ai/mcp/?strata_id=8f2d8f1b-37cc-479a-b598-e7505ed32203",
  "port": 7567,
  "endpoint": "/mcp",
  "description": "Klavis Strata MCP Server for AI model control",
  "version": "1.0.0"
}
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

For development with auto-restart:
```bash
npm run dev
```

## Usage

The server listens on port 7567 (by default) and forwards POST requests to `/mcp` endpoint to the Klavis API.

Example request:
```bash
curl -X POST http://localhost:7567/mcp \
  -H "Content-Type: application/json" \
  -d '{"your": "data"}'
```

## Features

- CORS enabled for cross-origin requests
- Configurable through JSON file
- Graceful shutdown handling
- Error handling with detailed error messages
- Logging of server status and configuration

## License

MIT
