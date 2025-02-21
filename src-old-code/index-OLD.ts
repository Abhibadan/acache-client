import * as net from 'net';
import { EventEmitter } from 'events';

enum eventsType {
    STR_SET = 'sset',
    NUM_SET = 'nset',
    BOOL_SET = 'bset',
    OBJ_SET = 'oset',
    STR_GET = 'sget',
    OBJ_GET = 'oget',
    NUM_GET = 'nget',
    BOOL_GET = 'bget',
    STR_DEL = 'sdel',
    OBJ_DEL = 'odel',
    NUM_DEL = 'ndel',
    BOOL_DEL = 'bdel',
    NUM_INCR = 'incr',
    SET_TTL = 'sttl',
    REM_TTL = 'rmttl',
    GET_TTL = 'gttl'
}

enum dataType {
    STRING = 'str',
    NUMBER = 'num',
    BOOLEAN = 'bool',
    OBJECT = 'obj'
}

interface cacheRequest {
    event: eventsType;
    key: string;
    value?: any;
    ttl?: number | null;
}

class Acache extends EventEmitter {
    #client: net.Socket;
    #queue: (() => Promise<void>)[] = []; // Queue to hold pending requests
    #isProcessing: boolean = false; // Mutex flag to ensure mutual exclusion

    constructor(private host: string = "127.0.0.1", private port: number = 5000) {
        super();
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
    async #enqueueRequest(req: cacheRequest): Promise<any> {
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
                        } catch (error: any) {
                            
                            reject('Error parsing response: ' + error.message);
                        } finally {
                            console.log(data.toString());
                            // Release the mutex and process the next request
                            this.#isProcessing = false;
                            this.#processQueue();
                        }
                    });
                } catch (error: any) {
                    reject('Error sending request: ' + error.message);
                }
            });

            // Start processing the queue if not already processing
            this.#processQueue();
        });
    }

    // Process the queue of requests
    async #processQueue() {
        if (this.#isProcessing || this.#queue.length === 0) return;

        this.#isProcessing = true; // Acquire the mutex
        const task = this.#queue.shift(); // Get the next task from the queue

        if (task) {
            await task(); // Execute the task
        }

        this.#isProcessing = false; // Release the mutex
        this.#processQueue(); // Process the next task in the queue
    }

    disconnect(): void {
        this.#client.destroy();
    }

    // Public methods for cache operations
    public async sget(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.STR_GET, key });
    }

    public async nget(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.NUM_GET, key });
    }

    public async bget(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.BOOL_GET, key });
    }

    public async oget(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.OBJ_GET, key });
    }

    public async sset(key: string, value: string, expire: number | null = null): Promise<any> {
        if (typeof value !== 'string') return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.STR_SET, key, value, ttl: expire });
    }

    public async nset(key: string, value: number, expire: number | null = null): Promise<any> {
        if (typeof value !== 'number') return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.NUM_SET, key, value, ttl: expire });
    }

    public async bset(key: string, value: 0 | 1, expire: number | null = null): Promise<any> {
        if (![0, 1].includes(value)) return Promise.reject(new Error('Invalid value: Value must be 1 for true and 0 for false'));
        return this.#enqueueRequest({ event: eventsType.BOOL_SET, key, value, ttl: expire });
    }

    public async oset(key: string, value: Record<string, any> | any[], expire: number | null = null): Promise<any> {
        if (typeof value !== 'object') return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.OBJ_SET, key, value, ttl: expire });
    }

    public async incr(key: string, value: number | null): Promise<any> {
        if (value && typeof value !== 'number') return Promise.reject(new Error('Invalid value'));
        return this.#enqueueRequest({ event: eventsType.NUM_INCR, key, value });
    }

    public async sdel(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.STR_DEL, key });
    }

    public async ndel(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.NUM_DEL, key });
    }

    public async bdel(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.BOOL_DEL, key });
    }

    public async odel(key: string): Promise<any> {
        return this.#enqueueRequest({ event: eventsType.OBJ_DEL, key });
    }

    public async sttl(type: dataType, key: string, expire: number | null = null): Promise<any> {
        if (!['str', 'num', 'bool', 'obj'].includes(type)) return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#enqueueRequest({ event: eventsType.SET_TTL, key: type, value: [key, expire] });
    }

    public async rttl(type: dataType, key: string): Promise<any> {
        if (!['str', 'num', 'bool', 'obj'].includes(type)) return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#enqueueRequest({ event: eventsType.GET_TTL, key: type, value: [key] });
    }

    public async gttl(type: dataType, key: string): Promise<any> {
        if (!['str', 'num', 'bool', 'obj'].includes(type)) return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#enqueueRequest({ event: eventsType.REM_TTL, key: type, value: [key] });
    }
}

module.exports = Acache;