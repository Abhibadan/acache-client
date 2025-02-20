"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
var eventsType;
(function (eventsType) {
    eventsType["STR_GET"] = "sget";
    eventsType["NUM_GET"] = "nget";
    eventsType["BOOL_GET"] = "bget";
    eventsType["OBJ_GET"] = "oget";
    eventsType["STR_SET"] = "sset";
    eventsType["NUM_SET"] = "nset";
    eventsType["BOOL_SET"] = "bset";
    eventsType["OBJ_SET"] = "oset";
    eventsType["NUM_INCR"] = "incr";
    eventsType["STR_DEL"] = "sdel";
    eventsType["NUM_DEL"] = "ndel";
    eventsType["BOOL_DEL"] = "bdel";
    eventsType["OBJ_DEL"] = "odel";
    eventsType["SET_TTL"] = "sttl";
    eventsType["GET_TTL"] = "gttl";
    eventsType["REM_TTL"] = "rmttl";
})(eventsType || (eventsType = {}));
class Acache extends events_1.EventEmitter {
    host;
    port;
    #client;
    #queue = [];
    #isProcessing = false;
    constructor(host = "127.0.0.1", port = 5000) {
        super();
        this.host = host;
        this.port = port;
        this.#client = new WebSocket(`ws://${host}:${port}`);
        this.#client.onopen = () => {
            console.log('Connected to server');
            this.emit('open');
            this.#processQueue();
        };
        this.#client.onerror = (e) => {
            console.error('WebSocket error:', e);
            this.emit('error', e);
        };
        this.#client.onclose = () => {
            console.log('Connection closed');
            this.emit('close');
        };
        this.#client.onmessage = (e) => {
            try {
                const parsedResponse = JSON.parse(e.data.toString());
                const { resolve } = this.#queue.shift() || {};
                if (resolve) {
                    this.#isProcessing = false;
                    console.log('Res: ', parsedResponse);
                    resolve(parsedResponse);
                }
            }
            catch (error) {
                console.error('Error parsing response:', error);
                const { reject } = this.#queue.shift() || {};
                if (reject) {
                    reject('Error parsing response: ' + error);
                }
            }
            finally {
                this.#processQueue();
            }
        };
    }
    // Enqueue requests and process them one at a time
    async #reqServer(req) {
        return new Promise((resolve, reject) => {
            this.#queue.push({ req, resolve, reject });
            this.#processQueue();
        });
    }
    #processQueue() {
        if (this.#isProcessing || this.#queue.length === 0 || this.#client.readyState !== WebSocket.OPEN) {
            return;
        }
        this.#isProcessing = true;
        const { req, resolve, reject } = this.#queue[0];
        try {
            this.#client.send(JSON.stringify(req));
        }
        catch (error) {
            this.#isProcessing = false;
            reject('Error sending request: ' + error);
            this.#queue.shift();
            this.#processQueue();
        }
    }
    disconnect() {
        this.#client.close();
    }
    // Public methods for cache operations
    async sget(key) {
        console.log('trigger sget', key);
        return this.#reqServer({ event: eventsType.STR_GET, key });
    }
    async nget(key) {
        return this.#reqServer({ event: eventsType.NUM_GET, key });
    }
    async bget(key) {
        return this.#reqServer({ event: eventsType.BOOL_GET, key });
    }
    async oget(key) {
        return this.#reqServer({ event: eventsType.OBJ_GET, key });
    }
    async sset(key, value, expire = null) {
        if (typeof value !== 'string')
            return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.STR_SET, key, value, ttl: expire });
    }
    async nset(key, value, expire = null) {
        if (typeof value !== 'number')
            return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.NUM_SET, key, value, ttl: expire });
    }
    async bset(key, value, expire = null) {
        if (![0, 1].includes(value))
            return Promise.reject(new Error('Invalid value: Value must be 1 for true and 0 for false'));
        return this.#reqServer({ event: eventsType.BOOL_SET, key, value, ttl: expire });
    }
    async oset(key, value, expire = null) {
        if (typeof value !== 'object')
            return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.OBJ_SET, key, value, ttl: expire });
    }
    async incr(key, value) {
        if (value && typeof value !== 'number')
            return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.NUM_INCR, key, value });
    }
    async sdel(key) {
        return this.#reqServer({ event: eventsType.STR_DEL, key });
    }
    async ndel(key) {
        return this.#reqServer({ event: eventsType.NUM_DEL, key });
    }
    async bdel(key) {
        return this.#reqServer({ event: eventsType.BOOL_DEL, key });
    }
    async odel(key) {
        return this.#reqServer({ event: eventsType.OBJ_DEL, key });
    }
    async sttl(type, key, expire = null) {
        if (!['str', 'num', 'bool', 'obj'].includes(type))
            return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#reqServer({ event: eventsType.SET_TTL, key: type, value: [key, expire] });
    }
    async rttl(type, key) {
        if (!['str', 'num', 'bool', 'obj'].includes(type))
            return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#reqServer({ event: eventsType.GET_TTL, key: type, value: [key] });
    }
    async gttl(type, key) {
        if (!['str', 'num', 'bool', 'obj'].includes(type))
            return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#reqServer({ event: eventsType.REM_TTL, key: type, value: [key] });
    }
}
module.exports = Acache;
