const cliStartupLog=(host: String, port: String): void =>{
    console.clear();
    console.log(`
  █████╗  ██████╗ █████╗  ██████╗██╗  ██╗███████╗     ██████╗ ██╗     ██╗
 ██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝    ██╔════╝ ██║     ██║
 ███████║██║     ███████║██║     ███████║█████╗      ██║      ██║     ██║
 ██╔══██║██║     ██╔══██║██║     ██╔══██║██╔══╝      ██║      ██║     ██║
 ██║  ██║╚██████╗██║  ██║╚██████╗██║  ██║███████╗    ╚██████╗ ███████╗██║
 ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝     ╚═════╝ ╚══════╝╚═╝

 CLI tool for interacting with Acache Server.

 Connected to: ${host}:${port}

 Type 'help' to see available commands. 📜✨

 Type 'exit ' to terminate.👋
    `);
}

const showHelp=():void=>{
    console.log(`
  ┌───────────────────────────────────────────────────────────────────────────────┐
  │                                ACACHE CLI HELP                                │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │ GET COMMANDS:                                                                 │
  │-------------------------------------------------------------------------------│
  │ sget key                 | Get string stored in 'key'                         │
  │ nget key                 | Get number stored in 'key'                         │
  │ bget key                 | Get boolean stored in 'key'                        │
  │ oget key                 | Get object stored in 'key'                         │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │ SET COMMANDS:                                                                 │
  │-------------------------------------------------------------------------------│
  │ sset key string-value     | Store string in 'key'                             │
  │ nset key numeric-value    | Store number in 'key'                             │
  │ bset key boolean-value    | Store boolean (1 for true, 0 for false) in 'key'  │
  │ oset key json-object      | Store object in 'key'                             │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │ INCREMENT/DECREMENT:                                                          │
  │-------------------------------------------------------------------------------│
  │ incr key value(optional)  | Increment/decrement number stored in 'key'        │
  │                           | by value (default: 1)                             │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │ DELETE COMMANDS:                                                              │
  │-------------------------------------------------------------------------------│
  │ sdel key                 | Delete string stored in 'key'                      │
  │ ndel key                 | Delete number stored in 'key'                      │
  │ bdel key                 | Delete boolean stored in 'key'                     │
  │ odel key                 | Delete object stored in 'key'                      │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │ TTL COMMANDS:                                                                 │
  │-------------------------------------------------------------------------------│
  │ sttl type key ttl        | Set TTL (expiry) for 'key'                         │
  │ rttl type key            | Remove TTL from 'key'                              │
  │ gttl type key            | Get TTL of 'key' (Remaining time before expiry)    │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │ NOTE: 'type' can be:                                                          │
  │  - str  → String                                                              │
  │  - num  → Number                                                              │
  │  - bool → Boolean                                                             │
  │  - obj  → Object                                                              │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │ Type 'exit' to close the CLI.                                                 │
  └───────────────────────────────────────────────────────────────────────────────┘
    `);
}



export {
    cliStartupLog,
    showHelp
}