const net = require('net');
const fs = require('fs');
const http = require('http');

const PORT = 5001; // CHANGED: Each machine needs its own unique port!
const HOST = '10.0.0.102'; // Your PC IP

const ENQ = '\x05';
const ACK = '\x06';
const EOT = '\x04';
const STX = '\x02';
const ETX = '\x03';

const server = net.createServer((socket) => {
    console.log(`✅ EC90 Connected: ${socket.remoteAddress}`);
    let sessionBuffer = "";

    socket.on('data', (chunk) => {
        const raw = chunk.toString();
        sessionBuffer += raw;

        // 1. Handshake
        if (raw.includes(ENQ)) {
            socket.write(ACK);
            return;
        }

        // 2. Acknowledge every data frame
        if (raw.includes(STX)) {
            socket.write(ACK);
        }

        // 3. Process ONLY when transmission is totally finished (EOT)
        if (raw.includes(EOT)) {
            console.log("📄 Full Transmission Received. Parsing...");

            const resultJson = parseASTM(sessionBuffer);

            // Save to JSON
            fs.appendFileSync('ec90_results.json', JSON.stringify(resultJson, null, 2) + ',\n');

            console.log(`📊 Results Saved locally for ID: ${resultJson.sampleId}`);
            console.table(resultJson.electrolytes);

            // Send to DB Backend
            sendToBackend(resultJson.sampleId, "EC90", resultJson.electrolytes);

            // RESET everything for the next sample
            sessionBuffer = "";
            console.log("✅ Ready for next test.\n----------------------");
        }
    });

    socket.on('error', (err) => {
        console.error('❌ EC90 Connection Error:', err.message);
        sessionBuffer = "";
    });
});

function parseASTM(rawContent) {
    const lines = rawContent
        .split(/\r?\n/)
        .map(l => l.replace(/[\x02\x03\x05\x04]/g, '').trim())
        .filter(Boolean);

    let report = {
        timestamp: new Date().toISOString(),
        sampleId: "Unknown",
        patient: {
            id: "",
            name: ""
        },
        electrolytes: {}
    };

    lines.forEach(line => {
        // Remove frame numbers (1H, 2P, 3OBR, etc.)
        line = line.replace(/^\d+/, '');

        const f = line.split('|');
        const segment = f[0];

        // ✅ PATIENT INFO
        if (segment === 'P') {
            const clean = (v) => (v || "").replace(/\^/g, ' ').trim();

            const rawId = (f[3] || f[2] || "").trim();
            report.patient.id = rawId ? rawId.split('^')[0] : "Unknown";

            // Detect NAME (usually contains letters and ^)
            let possibleName = f.find(val => val && /[A-Za-z]/.test(val) && val.includes('^'));

            if (possibleName) {
                report.patient.name = clean(possibleName);
            }
        }

        // ✅ SAMPLE ID
        if (segment === 'O' || segment === 'OBR') {
            console.log("=> Raw Order Line Array:", f);
            
            // In ASTM, field 2 (f[2]) is often the machine's auto-generated internal ID (e.g. 00000041)
            // Field 3 (f[3]) is the Rack/Cup or Manual Sample ID (e.g. 004) that you typed!
            // We prioritize f[3], and use f[2] as a fallback.
            const rawSample = (f[3] || f[2] || "Unknown").trim();
            let parsedSample = rawSample ? rawSample.split('^')[0] : "Unknown";
            
            report.sampleId = parsedSample;
        }

        // ✅ RESULTS
        if (segment === 'OBX') {
            console.log("=> Raw Result Line Array:", f);
            let testName = (f[4] || "").trim();
            let value = (f[5] || "").trim();
            let unit = (f[6] || "").trim();

            if (testName && value && !isNaN(value)) {
                report.electrolytes[testName] = {
                    value: parseFloat(value),
                    unit: unit || "mmol/L"
                };
            }
        }
    });

    return report;
}

function sendToBackend(sampleId, machine, results) {
    const postData = JSON.stringify({ sampleId, machine, results });
    const options = {
        hostname: 'localhost',
        port: 3001, // NestJS Backend port
        path: '/lab/report/lis-result',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log(`🌍 Backend DB Response: ${data}`));
    });

    req.on('error', (e) => console.error(`❌ DB Sync Error: ${e.message}`));
    req.write(postData);
    req.end();
}

server.listen(PORT, HOST, () => {
    console.log(`🎯 EC90 Listener active on ${HOST}:${PORT}`);
});
