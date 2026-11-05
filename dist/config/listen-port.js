"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenPort = listenPort;
function listenPort(raw) {
    if (raw == null || raw.trim() === '') {
        return 3001;
    }
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid PORT "${raw}". Expected an integer from 1 to 65535.`);
    }
    return port;
}
//# sourceMappingURL=listen-port.js.map