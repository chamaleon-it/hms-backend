"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDigestiveSystem = normalizeDigestiveSystem;
function normalizeDigestiveSystem(value) {
    if (value == null)
        return null;
    const raw = Array.isArray(value) ? value : [value];
    const items = raw
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    return items.length > 0 ? items : null;
}
//# sourceMappingURL=digestive-system.js.map