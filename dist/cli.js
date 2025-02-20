#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
let [host, port] = process.argv.slice(2);
host = host || '127.0.0.1';
port = port || '5000';
const ws = new WebSocket(`ws://${host}:${port}`);
console.log(`Server connected to ${host}:${port}`);
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${host}:${port}> `
});
ws.onopen = () => {
    rl.prompt();
    rl.on('line', (input) => {
        let inputs = input.trim().split(' ');
        if (inputs[0].toLowerCase() == 'exit') {
            // Close the connection on exit.
            ws.close();
            rl.close();
            process.exit(0);
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
        ws.send(JSON.stringify(req));
        rl.prompt();
    });
    rl.on('SIGINT', () => {
        rl.write("exit\n");
    });
};
ws.onmessage = (e) => {
    console.log(e.data);
    rl.prompt();
};
ws.onerror = (e) => {
    console.log('Server interrupted!');
    rl.close();
    process.exit(0);
};
ws.onclose = () => {
    console.log('Disconnected from server');
    rl.close();
    process.exit(0);
};
