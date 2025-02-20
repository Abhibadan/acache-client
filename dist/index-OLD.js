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
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const events_1 = require("events");
var eventsType;
(function (eventsType) {
    eventsType["STR_SET"] = "sset";
    eventsType["NUM_SET"] = "nset";
    eventsType["BOOL_SET"] = "bset";
    eventsType["OBJ_SET"] = "oset";
    eventsType["STR_GET"] = "sget";
    eventsType["OBJ_GET"] = "oget";
    eventsType["NUM_GET"] = "nget";
    eventsType["BOOL_GET"] = "bget";
    eventsType["STR_DEL"] = "sdel";
    eventsType["OBJ_DEL"] = "odel";
    eventsType["NUM_DEL"] = "ndel";
    eventsType["BOOL_DEL"] = "bdel";
    eventsType["NUM_INCR"] = "incr";
    eventsType["SET_TTL"] = "sttl";
    eventsType["REM_TTL"] = "rmttl";
    eventsType["GET_TTL"] = "gttl";
})(eventsType || (eventsType = {}));
var dataType;
(function (dataType) {
    dataType["STRING"] = "str";
    dataType["NUMBER"] = "num";
    dataType["BOOLEAN"] = "bool";
    dataType["OBJECT"] = "obj";
})(dataType || (dataType = {}));
class Acache extends events_1.EventEmitter {
    host;
    port;
    #client;
    #queue = []; // Queue to hold pending requests
    #isProcessing = false; // Mutex flag to ensure mutual exclusion
    constructor(host = "127.0.0.1", port = 5000) {
        super();
        this.host = host;
        this.port = port;
        this.#client = new net.Socket();
    }
    connect() {
        this.#client.on('close', () => {
            this.#queue = []; // Clear the queue on connection close
            this.#isProcessing = false;
            this.emit('close');
        }).on('error', (err) => {
            this.#queue = []; // Clear the queue on error
            this.#isProcessing = false;
            this.emit('error', err.toString());
        }).connect(this.port, this.host, () => {
            this.emit("connect", `Server connected ${this.host}:${this.port}`);
        });
    }
    // Enqueue requests and process them one at a time
    async #enqueueRequest(req) {
        return new Promise((resolve, reject) => {
            // Add the request to the queue
            this.#queue.push(async () => {
                if (this.#client.destroyed) {
                    reject('Cannot send data: Connection is closed.');
                    return;
                }
                try {
                    // Send the request to the server
                    this.#client.write(JSON.stringify(req));
                    // Wait for the server's response
                    this.#client.once('data', (data) => {
                        try {
                            const parsedResponse = JSON.parse(data.toString());
                            resolve(parsedResponse);
                        }
                        catch (error) {
                            reject('Error parsing response: ' + error.message);
                        }
                        finally {
                            console.log(data.toString());
                            // Release the mutex and process the next request
                            this.#isProcessing = false;
                            this.#processQueue();
                        }
                    });
                }
                catch (error) {
                    reject('Error sending request: ' + error.message);
                }
            });
            // Start processing the queue if not already processing
            this.#processQueue();
        });
    }
    // Process the queue of requests
    async #processQueue() {
        if (this.#isProcessing || this.#queue.length === 0)
            return;
        this.#isProcessing = true; // Acquire the mutex
        const task = this.#queue.shift(); // Get the next task from the queue
        if (task) {
            await task(); // Execute the task
        }
        this.#isProcessing = false; // Release the mutex
        this.#processQueue(); // Process the next task in the queue
    }
    disconnect() {
        this.#client.destroy();
    }
    // Public methods for cache operations
    async sget(key) {
        return this.#enqueueRequest({ event: eventsType.STR_GET, key });
    }
    async nget(key) {
        return this.#enqueueRequest({ event: eventsType.NUM_GET, key });
    }
    async bget(key) {
        return this.#enqueueRequest({ event: eventsType.BOOL_GET, key });
    }
    async oget(key) {
        return this.#enqueueRequest({ event: eventsType.OBJ_GET, key });
    }
    async sset(key, value, expire = null) {
        if (typeof value !== 'string')
            return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.STR_SET, key, value, ttl: expire });
    }
    async nset(key, value, expire = null) {
        if (typeof value !== 'number')
            return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.NUM_SET, key, value, ttl: expire });
    }
    async bset(key, value, expire = null) {
        if (![0, 1].includes(value))
            return Promise.reject(new Error('Invalid value: Value must be 1 for true and 0 for false'));
        return this.#enqueueRequest({ event: eventsType.BOOL_SET, key, value, ttl: expire });
    }
    async oset(key, value, expire = null) {
        if (typeof value !== 'object')
            return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.OBJ_SET, key, value, ttl: expire });
    }
    async incr(key, value) {
        if (value && typeof value !== 'number')
            return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.NUM_INCR, key, value });
    }
    async sdel(key) {
        return this.#enqueueRequest({ event: eventsType.STR_DEL, key });
    }
    async ndel(key) {
        return this.#enqueueRequest({ event: eventsType.NUM_DEL, key });
    }
    async bdel(key) {
        return this.#enqueueRequest({ event: eventsType.BOOL_DEL, key });
    }
    async odel(key) {
        return this.#enqueueRequest({ event: eventsType.OBJ_DEL, key });
    }
    async sttl(type, key, expire = null) {
        if (!['str', 'num', 'bool', 'obj'].includes(type))
            return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#enqueueRequest({ event: eventsType.SET_TTL, key: type, value: [key, expire] });
    }
    async rttl(type, key) {
        if (!['str', 'num', 'bool', 'obj'].includes(type))
            return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#enqueueRequest({ event: eventsType.GET_TTL, key: type, value: [key] });
    }
    async gttl(type, key) {
        if (!['str', 'num', 'bool', 'obj'].includes(type))
            return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#enqueueRequest({ event: eventsType.REM_TTL, key: type, value: [key] });
    }
}
module.exports = Acache;
