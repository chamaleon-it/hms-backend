const net = require('net');
const fs = require('fs');
const http = require('http');

// --- SETTINGS ---
const PORT = 5002; // CHANGED: Each machine needs its own unique port!
const HOST = '10.0.0.102'; // Your Static Ethernet IP

// HL7/MLLP Constants
const VT = '\x0B'; // Start of Message
const FS = '\x1C'; // End of Message
const CR = '\r';   // Segment Terminator

let mainBuffer = ""; 

const server = net.createServer((socket) => {
    console.log(`✅ Connection from Erba: ${socket.remoteAddress}`);

    socket.on('data', (chunk) => {
        mainBuffer += chunk.toString();

        // 1. Wait for the full message frame
        if (mainBuffer.includes(VT) && mainBuffer.includes(FS)) {
            const start = mainBuffer.indexOf(VT);
            const end = mainBuffer.indexOf(FS);
            const hl7Raw = mainBuffer.substring(start + 1, end).trim();

            console.log('📄 Full HL7 Received. Processing...');

            // 2. Extract Message ID (MSH-10) for a valid ACK
            const lines = hl7Raw.split(/[\r\n]/).filter(l => l.length > 0);
            const mshFields = lines[0].split('|');
            const msgId = mshFields[9] || "1"; 

            // 3. Save Raw HL7 to Text Log
            fs.appendFileSync('erba-results.txt', `${new Date().toISOString()}:\n${hl7Raw}\n\n`);

            // 4. Convert to JSON automatically
            let resultJson = null;
            try {
                resultJson = parseHl7ToJson(hl7Raw);
                fs.appendFileSync('erba_results.json', JSON.stringify(resultJson, null, 2) + ',\n');
                console.log(`📊 JSON Saved locally for Patient: ${resultJson.patient.name} (Sample ID: ${resultJson.sampleId}, Patient ID: ${resultJson.patient.id})`);
                
                // Send to DB Backend
                sendToBackend(resultJson.sampleId, resultJson.patient?.id || "Unknown", "Erba H360", resultJson.results);

            } catch (err) {
                console.error('❌ JSON Conversion Error:', err.message);
            }

            // 5. Send the exact ACK the machine expects
            const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
            const ackBody = `MSH|^~\\&|LIS|LAB|||${ts}||ACK^R01|${msgId}|P|2.3.1${CR}MSA|AA|${msgId}${CR}`;
            socket.write(VT + ackBody + FS + CR);
            
            console.log(`✅ ACK sent for ID: ${msgId}\n----------------------`);

            // Clear buffer for next sample
            mainBuffer = mainBuffer.substring(end + 1);
        }
    });

    socket.on('error', (err) => { 
        console.error('❌ Connection Error:', err.message); 
        mainBuffer = ""; 
    });
});

// Helper Function: HL7 to JSON
function parseHl7ToJson(hl7) {
    const lines = hl7.split(/[\r\n]/).filter(l => l.length > 0);
    let obj = { timestamp: new Date().toISOString(), sampleId: "Unknown", patient: {}, results: {} };

    lines.forEach(line => {
        const f = line.split('|');
        if (f[0] === 'PID') {
            obj.patient.id = f[3] ? f[3].split('^')[0] : 'Unknown';
            obj.patient.name = f[5] ? f[5].replace(/\^/g, ' ').trim() : 'Unknown';
            obj.patient.gender = f[8];
        }
        if (f[0] === 'OBR') {
            obj.sampleId = f[2] || f[3] || "Unknown"; // Sample ID is generally in OBR-2 or OBR-3
        }
        if (f[0] === 'OBX') {
            const testName = f[3].split('^')[1] || f[3].split('^')[0];
            if (f[5]) {
                obj.results[testName] = {
                    value: f[5],
                    unit: f[6],
                    range: f[7]
                };
            }
        }
    });
    return obj;
}

function sendToBackend(sampleId, patientId, machine, results) {
    const postData = JSON.stringify({ sampleId, patientId, machine, results });
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
    console.log(`🎯 Erba H360 Listener active on ${HOST}:${PORT}`);
    console.log(`🚀 Ready to receive Erba H360 results...`);
});
