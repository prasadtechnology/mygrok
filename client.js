const WebSocket = require('ws');
const http = require('http');
const { program } = require('commander');

// const SERVER_URL = 'ws://localhost:3000'; // Change to your server's public URL later
const SERVER_URL = 'wss://my-ngrok-hniyy0w2m-vikranths-projects-a59806dd.vercel.app'; // Change to your server's public URL later

// Define the CLI command
program
    .command('http <port>')
    .description('Expose a local HTTP server on the specified port')
    .action((port) => {
        // Convert port to a number and start the client
        const LOCAL_PORT = parseInt(port, 10);
        if (isNaN(LOCAL_PORT) || LOCAL_PORT < 1 || LOCAL_PORT > 65535) {
            console.error('Error: Port must be a valid number between 1 and 65535');
            process.exit(1);
        }
        startClient(LOCAL_PORT);
    });

program.parse(process.argv); // Parse command-line arguments

// Function to start the WebSocket client
function startClient(LOCAL_PORT) {
    const ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
        console.log(`Connected to server, exposing http://localhost:${LOCAL_PORT}`);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
    });

    ws.on('message', (data) => {
        const request = JSON.parse(data);
        console.log('Received request:', request);

        // Strip the tunnelId from the path (if needed) or use root
        const pathParts = request.path.split('/').filter(Boolean);
        const cleanPath = '/' + (pathParts.length > 1 ? pathParts.slice(1).join('/') : '');

        const options = {
            hostname: 'localhost',
            port: LOCAL_PORT,
            path: cleanPath || '/', // Use cleaned path or root
            method: request.method,
            headers: request.headers,
        };

        const localReq = http.request(options, (localRes) => {
            let body = '';
            localRes.on('data', (chunk) => (body += chunk));
            localRes.on('end', () => {
                ws.send(JSON.stringify({
                    status: localRes.statusCode,
                    body: body,
                }));
            });
        });

        localReq.on('error', (err) => {
            console.error(`Local server error: ${err.message}`);
            ws.send(JSON.stringify({
                status: 500,
                body: `Local server error: ${err.message}`,
            }));
        });

        localReq.end();
    });

    ws.on('close', () => {
        console.log('Disconnected from server');
    });
}