const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const parseOrbit = require('./parseOrbit');

wss.on('connection', (ws) => {
    console.log('Client connected');
    parseOrbit.parseOrbit('./orbit2.txt').then(orbits => {
        let index = 0;
        const interval = setInterval(() => {
            ws.send(JSON.stringify(orbits[index]));
            index += 1;
        }, 100);

        ws.on('close', () => {
            clearInterval(interval);
            console.log('Client disconnected');
        });
    });
});

app.use(express.static('frontend'));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
