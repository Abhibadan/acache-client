# acache-client

[**acache-client**](https://www.npmjs.com/package/acache-client) is an npm package designed to interact with [**acache-server**](https://www.npmjs.com/package/acache-server), a lightweight caching server. It provides two ways to use the client: as an npm package within code or as a CLI tool.

## Installation

To use **acache-client**, install it locally in your project:

```bash
npm install acache-client
```

Or install it globally:

```bash
npm install -g acache-client
```

## Usage

### 1. Using as an npm package in code

First, ensure that **acache-server** is running.

Example usage in a Node.js application:

```javascript
const Acache = require('acache-client');

let host = '127.0.0.1', port = 6379;
// Create an instance of cache store
const cache = new Acache(host, port);

cache.on('open', () => console.log(`Caching is running on ${host}:${port}`))
    .on('error', (e) => console.log(e.message))
    .on('close', () => console.log('Connection closed'));

async function main() {
    await cache.sset('key1', 'string value1', 50);
    console.log(await cache.sget('key1')); // Output: string value1

    await cache.nset('key1', 5);
    console.log(await cache.nget('key1')); // Output: number 5

    await cache.sttl('num', 'key1'); // Set TTL for number
    console.log(await cache.gttl('str', 'key1')); // Output: remaining TTL of key1

    await cache.rttl('str', 'key1'); // Remove TTL for key1 of string
    console.log(await cache.gttl('str', 'key1')); // Output: null
}

main();
```

### 2. Using as a CLI tool

To use the CLI tool, ensure that [**acache-server**](https://www.npmjs.com/package/acache-server) is running. Then, start the CLI with:

```bash
acache-client
```

By default, it connects to `127.0.0.1:6379`. To specify a custom host and port:

```bash
acache-client host port
```
Example,
```bash
acache-client 127.0.0.1 6379
```

If the package is not installed globally, use:

```bash
npx acache-client
```

Or with a custom host and port:

```bash
npx acache-client host port
```

#### CLI Command Examples

```bash
npx acache-cli 127.0.0.1 6379
Server connected to 127.0.0.1:6379
127.0.0.1:6379> sset key1 value1
127.0.0.1:6379> 1
127.0.0.1:6379> sget key1 
127.0.0.1:6379> "value1"
127.0.0.1:6379> nset key1 5
127.0.0.1:6379> 1
127.0.0.1:6379> nget key1 
127.0.0.1:6379> 5
127.0.0.1:6379> bset key1 1
127.0.0.1:6379> 1
127.0.0.1:6379> bget key1
127.0.0.1:6379> true
127.0.0.1:6379> oset key1 {"name":"Jhon","age":20,"hobby":["Football","Cricket","Party"],"address":{"city":"Los Angeles","state":"California","country":"United States"}}
127.0.0.1:6379> 1
127.0.0.1:6379> gttl str key1
127.0.0.1:6379> null
127.0.0.1:6379> sttl str key1 50
127.0.0.1:6379> 1
127.0.0.1:6379> gttl str key1
127.0.0.1:6379> 45.91
127.0.0.1:6379> rmttl str key1
127.0.0.1:6379> true
127.0.0.1:6379> gttl str key1
127.0.0.1:6379> null
127.0.0.1:6379> exit
```

## Supported Operations

| Operation | Description |
|-----------|-------------|
| `sget(key)` | Get a string value |
| `nget(key)` | Get a number value |
| `bget(key)` | Get a boolean value |
| `oget(key)` | Get an object value |
| `sset(key, value, ttl optional)` | Set a string value with optional TTL |
| `nset(key, value, ttl optional)` | Set a number value with optional TTL |
| `bset(key, value, ttl optional)` | Set a boolean value with optional TTL |
| `oset(key, value, ttl optional)` | Set an object value with optional TTL |
| `incr(key, value optional)` | Increment or decrement a numerical value with provided value. If no value is provided then will be incremented by 1|
| `sdel(key)` | Delete a string key |
| `ndel(key)` | Delete a number key |
| `bdel(key)` | Delete a boolean key |
| `odel(key)` | Delete an object key |
| `sttl(type, key, ttl)` | Set TTL for a key (type: `str`, `num`, `bool`, `obj`) |
| `rttl(type, key)` | Remove TTL for a key |
| `gttl(type, key)` | Get remaining TTL for a key |

## License

This project is licensed under the [Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0) License.
