import { EventEmitter } from 'events';

type cacheRequest = {
    event: string;
    key: string;
    value?: any;
    ttl?: number | null;
};

enum eventsType {
    STR_GET = 'sget',
    NUM_GET = 'nget',
    BOOL_GET = 'bget',
    OBJ_GET = 'oget',
    STR_SET = 'sset',
    NUM_SET = 'nset',
    BOOL_SET = 'bset',
    OBJ_SET = 'oset',
    NUM_INCR = 'incr',
    STR_DEL = 'sdel',
    NUM_DEL = 'ndel',
    BOOL_DEL = 'bdel',
    OBJ_DEL = 'odel',
    SET_TTL = 'sttl',
    GET_TTL = 'gttl',
    REM_TTL = 'rmttl',
}

type dataType = 'str' | 'num' | 'bool' | 'obj';

class Acache extends EventEmitter {
    #client: WebSocket;
    #queue: Array<{ req: cacheRequest, resolve: (value: any) => void, reject: (reason?: any) => void }> = [];
    #isProcessing: boolean = false;

    constructor(private host: string = "127.0.0.1", private port: number = 6379) {
        super();
        this.#client = new WebSocket(`ws://${host}:${port}`);

        this.#client.onopen = () => {
            // console.log('Connected to server');
            this.emit('open');
            this.#processQueue();
        };

        this.#client.onerror = (e) => {
            // console.error('WebSocket error:', e);
            this.emit('error', e);
        };

        this.#client.onclose = () => {
            // console.log('Connection closed');
            this.emit('close');
        };

        this.#client.onmessage = (e) => {
            try {
                const parsedResponse = JSON.parse(e.data.toString());
                const { resolve } = this.#queue.shift() || {};
                if (resolve) {
                    this.#isProcessing=false;
                    console.log('Res: ',parsedResponse);
                    resolve(parsedResponse);
                }
            } catch (error) {
                // console.error('Error parsing response:', error);
                this.emit('error', error);
                const { reject } = this.#queue.shift() || {};
                if (reject) {
                    reject('Error parsing response: ' + error);
                }
            } finally {
                this.#processQueue();
            }
        };
    }

    // Enqueue requests and process them one at a time
    async #reqServer(req: cacheRequest): Promise<any> {
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
        } catch (error) {
            this.#isProcessing = false;
            this.emit('error', error);
            // reject('Error sending request: ' + error);
            this.#queue.shift();
            this.#processQueue();
        }
    }

    disconnect(): void {
        this.#client.close();
    }

    // Public methods for cache operations
    public async sget(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.STR_GET, key });
    }

    public async nget(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.NUM_GET, key });
    }

    public async bget(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.BOOL_GET, key });
    }

    public async oget(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.OBJ_GET, key });
    }

    public async sset(key: string, value: string, expire: number | null = null): Promise<any> {
        if (typeof value !== 'string') return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.STR_SET, key, value, ttl: expire });
    }

    public async nset(key: string, value: number, expire: number | null = null): Promise<any> {
        if (typeof value !== 'number') return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.NUM_SET, key, value, ttl: expire });
    }

    public async bset(key: string, value: 0 | 1, expire: number | null = null): Promise<any> {
        if (![0, 1].includes(value)) return Promise.reject(new Error('Invalid value: Value must be 1 for true and 0 for false'));
        return this.#reqServer({ event: eventsType.BOOL_SET, key, value, ttl: expire });
    }

    public async oset(key: string, value: Record<string, any> | any[], expire: number | null = null): Promise<any> {
        if (typeof value !== 'object') return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.OBJ_SET, key, value, ttl: expire });
    }

    public async incr(key: string, value: number | null): Promise<any> {
        if (value && typeof value !== 'number') return Promise.reject(new Error('Invalid value'));
        return this.#reqServer({ event: eventsType.NUM_INCR, key, value });
    }

    public async sdel(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.STR_DEL, key });
    }

    public async ndel(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.NUM_DEL, key });
    }

    public async bdel(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.BOOL_DEL, key });
    }

    public async odel(key: string): Promise<any> {
        return this.#reqServer({ event: eventsType.OBJ_DEL, key });
    }

    public async sttl(type: dataType, key: string, expire: number | null = null): Promise<any> {
        if (!['str', 'num', 'bool', 'obj'].includes(type)) return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#reqServer({ event: eventsType.SET_TTL, key: type, value: [key, expire] });
    }

    public async rttl(type: dataType, key: string): Promise<any> {
        if (!['str', 'num', 'bool', 'obj'].includes(type)) return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#reqServer({ event: eventsType.GET_TTL, key: type, value: [key] });
    }

    public async gttl(type: dataType, key: string): Promise<any> {
        if (!['str', 'num', 'bool', 'obj'].includes(type)) return Promise.reject(new Error('Invalid type, Type must be in str, num, bool or obj'));
        return this.#reqServer({ event: eventsType.REM_TTL, key: type, value: [key] });
    }
}

module.exports=Acache;