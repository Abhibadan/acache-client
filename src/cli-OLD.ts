#!/usr/bin/env node

import * as  net from 'net';
import readline from 'readline';

let [host,port] = process.argv.slice(2);
host = host || '127.0.0.1';
port = port|| '5000';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${host}:${port}> `
});



const client = net.createConnection({host,port:parseInt(port,10)}, () => {
    console.log(`Server connected to ${host}:${port}`);

    rl.prompt();

    rl.on('line', (input:string) =>{
        let inputs = input.trim().split(' ');
        if (inputs[0].toLowerCase()=='exit') {
            // Close the connection on exit.
            client.end();
            return rl.close();        ;
        }else if (inputs[0].toLowerCase()=='clear') {
            console.clear();
            rl.prompt();
            return;
        }
        let req={
            'event': inputs[0].toLowerCase(),
            'key': inputs[1],
            'value': inputs.slice(2),
            'ttl': null,
        };
        client.write(JSON.stringify(req));
        // console.log(`Received: ${input}`); 
        rl.prompt();
    })
    
});
rl.on('SIGINT', () => {
    rl.write("exit\n");
}); 


// Listen for data from the server
client.on('data', (data:any) => {
    console.log(data.toString());
    rl.prompt();
});
client.on('error', (err:any) => {
    console.log('Server interrupted!');
    rl.close();
});
// Handle client disconnect
client.on('end', () => {
    console.log('Disconnected from server');
});
