#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const readline_1 = __importDefault(require("readline"));
let [host, port] = process.argv.slice(2);
host = host || '127.0.0.1';
port = port || '5000';
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${host}:${port}> `
});
const client = net.createConnection({ host, port: parseInt(port, 10) }, () => {
    console.log(`Server connected to ${host}:${port}`);
    rl.prompt();
    rl.on('line', (input) => {
        let inputs = input.trim().split(' ');
        if (inputs[0].toLowerCase() == 'exit') {
            // Close the connection on exit.
            client.end();
            return rl.close();
            ;
        }
        else if (inputs[0].toLowerCase() == 'clear') {
            console.clear();
            rl.prompt();
            return;
        }
        let req = {
            'event': inputs[0].toLowerCase(),
            'key': inputs[1],
            'value': inputs.slice(2),
            'ttl': null,
        };
        client.write(JSON.stringify(req));
        // console.log(`Received: ${input}`); 
        rl.prompt();
    });
});
rl.on('SIGINT', () => {
    rl.write("exit\n");
});
// Listen for data from the server
client.on('data', (data) => {
    console.log(data.toString());
    rl.prompt();
});
client.on('error', (err) => {
    console.log('Server interrupted!');
    rl.close();
});
// Handle client disconnect
client.on('end', () => {
    console.log('Disconnected from server');
});
