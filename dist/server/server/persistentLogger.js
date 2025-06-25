"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistentLog = persistentLog;
// Persistent logger for server (writes to file and console)
var fs_1 = require("fs");
var path_1 = require("path");
var LOG_FILE = path_1.default.join(process.cwd(), 'server.log');
function persistentLog(message, level) {
    if (level === void 0) { level = 'info'; }
    var timestamp = new Date().toISOString();
    var logLine = "".concat(timestamp, " [").concat(level.toUpperCase(), "] ").concat(message);
    fs_1.default.appendFileSync(LOG_FILE, logLine + '\n');
    if (level === 'error') {
        console.error(logLine);
    }
    else {
        console.log(logLine);
    }
}
