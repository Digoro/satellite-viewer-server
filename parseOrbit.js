const fs = require('fs');
const readline = require('readline');

function parseOrbit(filePath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
        const orbits = [];
        rl.on('line', (line) => {
            const [time, lat, lon, alt, roll, pitch, yaw] = line.split(',');
            const orbit = {
                time: time.trim(),
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                alt: parseFloat(alt),
                roll: parseFloat(roll),
                pitch: parseFloat(pitch),
                yaw: parseFloat(yaw)
            };
            orbits.push(orbit);
        });

        rl.on('close', () => {
            console.log('Parse orbit complete!');
            resolve(orbits);
        });
        rl.on('error', (error) => {
            reject(error);
        })
    });
}

exports.parseOrbit = parseOrbit;