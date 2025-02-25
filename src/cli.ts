#!/usr/bin/env node

import readline from 'readline';
import {cliStartupLog,showHelp} from './helpers/clieStartLog.helper';

let [host, port] = process.argv.slice(2);
host = host || '127.0.0.1';
port = port || '6379';
const ws = new WebSocket(`ws://${host}:${port}`);


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${host}:${port}> `
});



ws.onopen = () => {
    cliStartupLog(host, port);
    rl.prompt();

    rl.on('line', (input: string) => {
        let inputs = input.trim().split(' ');
        if (inputs[0].toLowerCase() == 'exit') {
            // Close the connection on exit.
            ws.close();
            rl.close();
            process.exit(0);
        }else if(inputs[0].toLowerCase() == 'help'){
            showHelp();
            rl.prompt();
            return;
        } else if (inputs[0].toLowerCase() == 'clear') {
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
        // console.log(`Received: ${req}`); 
        ws.send(JSON.stringify(req));
        
        rl.prompt();
    })
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