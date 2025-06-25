"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callBlockchainCore = callBlockchainCore;
var child_process_1 = require("child_process");
var path_1 = require("path");
var url_1 = require("url");
// Utility to call the C++ blockchain binary
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var BLOCKCHAIN_BIN = path_1.default.join(__dirname, '../blockchain_core/build/ahmiyat_blockchain');
function callBlockchainCore(args) {
    return new Promise(function (resolve, reject) {
        (0, child_process_1.execFile)(BLOCKCHAIN_BIN, args, function (error, stdout, stderr) {
            if (error) {
                reject(stderr || error.message);
            }
            else {
                resolve(stdout);
            }
        });
    });
}
// All other blockchain logic is now handled by the C++ core.
