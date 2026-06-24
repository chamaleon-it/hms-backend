const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const path = require('path');

// ⚠️ Replace 'COM3' with the actual COM port the Erba Chem 6 is connected to.
const COM_PORT = 'COM11';

// ⚠️ Common baud rates for these machines: 9600, 19200, 38400, 115200.
// You need to match the baud rate configured on the Erba Chem 6 machine itself.
const BAUD_RATE = 19200;

console.log(`🎯 Erba Chem 6 Listener service active.`);
console.log(`🚀 Ready to receive Erba Chem 6 results (Running silently in the background)...`);

let retryTimeout = null;
let wasConnected = false; // Tracks if we were previously connected

function connectToMachine() {
    const port = new SerialPort({
        path: COM_PORT,
        baudRate: BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
        wasConnected = true; // Mark as successfully connected
        console.log(`✅ Successfully connected to ${COM_PORT}`);
        console.log(`👉 Waiting for data from the machine...`);
    });

    // Handle sudden disconnects (e.g., USB unplugged)
    port.on('close', () => {
        if (wasConnected) {
            console.log(`\n⚠️ Connection to ${COM_PORT} was lost. (Machine disconnected or turned off)`);
            wasConnected = false;
        }
        scheduleReconnect();
    });

    // Handle initialization or ongoing errors silently in the background
    port.on('error', function (err) {
        if (wasConnected) {
            console.log(`\n⚠️ Connection to ${COM_PORT} was lost. (Machine disconnected or turned off)`);
            wasConnected = false;
        }
        // Only schedule reconnect if the port isn't open
        if (!port.isOpen) {
            scheduleReconnect();
        }
    });

    // Handle incoming parsed line data
    parser.on('data', (data) => {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] 📄 Data received:`);
        console.log(data);

        // Save to a local text file for later analysis/debugging
        const logLine = `[${timestamp}] DATA: ${data}\n`;
        fs.appendFileSync(path.join(__dirname, 'erba-chem6-log.txt'), logLine);
    });

    // Handle raw unparsed data
    // port.on('data', (rawData) => {
    //     // We log raw bytes separately in case the line breaks don't match the parser
    //     fs.appendFileSync(path.join(__dirname, 'erba-chem6-raw.txt'), rawData.toString());
    // });
}

function scheduleReconnect() {
    if (retryTimeout) clearTimeout(retryTimeout);

    retryTimeout = setTimeout(() => {
        retryTimeout = null;
        connectToMachine();
    }, 5000);
}

connectToMachine();
