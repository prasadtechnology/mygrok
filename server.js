const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const tunnels = new Map();

wss.on('connection', (ws) => {
    const tunnelId = Math.random().toString(36).substring(2, 8);
    tunnels.set(tunnelId, ws);
    console.log(`New tunnel connected: ${tunnelId}`);

    ws.on('message', (message) => {
        console.log(`Received from tunnel ${tunnelId}: ${message}`);
    });

    ws.on('close', () => {
        tunnels.delete(tunnelId);
        console.log(`Tunnel ${tunnelId} closed`);
    });
});

app.get('/:tunnelId', (req, res) => {
    const tunnelId = req.params.tunnelId;
    const ws = tunnels.get(tunnelId);

    if (!ws) {
        return res.status(404).send('Tunnel not found');
    }

    ws.send(JSON.stringify({
        method: req.method,
        path: req.path,
        headers: req.headers,
    }));

    ws.once('message', (data) => {
        const response = JSON.parse(data);
        res.status(response.status).send(response.body);
    });
});

// module.exports = app; // Export for Vercel

server.listen(3000, ()=>{
    console.log(" server listening on 3000");
})