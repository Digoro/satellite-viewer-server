const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const satellite = require('satellite.js');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const parseOrbit = require('./parseOrbit');

async function fetchTLEByName(satelliteName) {
    try {
        const response = await axios.get("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle");
        const tleData = response.data.split("\n");

        for (let i = 0; i < tleData.length; i += 3) {
            if (tleData[i].trim() === satelliteName) {
                return {
                    line1: tleData[i + 1].trim(),
                    line2: tleData[i + 2].trim()
                }
            }
        }
        throw new Error(`위성 ${satelliteName}의 TLE를 찾을 수 없습니다.`);
    } catch (error) {
        console.error("TLE 데이터를 가져오는 중 오류 발생:", error);
        throw error;
    }
}

let interval = null;
wss.on('connection', async (ws) => {
    try {
        const tle = await fetchTLEByName("DOORY-SAT");
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

        interval = setInterval(() => {
            const now = new Date();
            const positionAndVelocity = satellite.propagate(satrec, now);

            if(positionAndVelocity.position) {
                const positionGd = satellite.eciToGeodetic(
                    positionAndVelocity.position,
                    satellite.gstime(now)
                );

                const lat = satellite.degreesLat(positionGd.latitude);
                const lon = satellite.degreesLong(positionGd.longitude);
                const alt = positionGd.height;

                ws.send(JSON.stringify({time: now.toISOString(), lat, lon, alt}));
            } else {
                ws.send(JSON.stringify({ error: "위치 계산 실패"}));
            }
        }, 1000);
    } catch (error) {
        ws.send(JSON.stringify({ error: error.message}))
    }

    // parseOrbit.parseOrbit('./orbit2.txt').then(orbits => {
    //     let index = 0;
    //     const interval = setInterval(() => {
    //         ws.send(JSON.stringify(orbits[index]));
    //         index += 1;
    //     }, 100);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

app.use(express.static('frontend'));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
