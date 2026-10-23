import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { AddressInfo, Socket } from 'net';
import { Readable } from 'stream';
import { WebClient } from '../WebClient';

function response(statusCode: number) {
    return {
        message: { statusCode, statusMessage: String(statusCode), headers: {} },
        readBody: async () => '{}'
    };
}

function readBody(body: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        body.on('data', chunk => chunks.push(Buffer.from(chunk)));
        body.on('end', () => resolve(Buffer.concat(chunks)));
        body.on('error', reject);
        body.resume();
    });
}

function consumePrefix(body: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        body.once('error', reject);
        body.once('data', chunk => {
            body.pause();
            resolve(Buffer.from(chunk));
        });
        body.resume();
    });
}

describe('file request retries', () => {
    let directory: string;
    let file: string;
    let contents: Buffer;
    const opened: fs.ReadStream[] = [];

    beforeAll(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'webclient-retry-'));
        file = path.join(directory, 'package.bin');
        contents = Buffer.alloc(16 * 1024 * 1024);
        for (let index = 0; index < contents.length; index++) {
            contents[index] = index % 251;
        }
        fs.writeFileSync(file, contents);
    });

    afterEach(async () => {
        await Promise.all(opened.splice(0).map(stream => new Promise<void>(resolve => {
            if ((stream as any).closed) return resolve();
            stream.once('close', resolve);
            stream.on('error', () => {});
            stream.destroy();
        })));
    });

    function openFile(options?: any): fs.ReadStream {
        const stream = fs.createReadStream(file, options);
        stream.on('error', () => {});
        opened.push(stream);
        return stream;
    }

    afterAll(() => {
        fs.unlinkSync(file);
        fs.rmdirSync(directory);
    });

    function clientWithTransport(request: (...args: any[]) => Promise<any>): WebClient {
        const client = new WebClient();
        (client as any)._httpClient = { request: async (...args: any[]) => {
            if (args[2] instanceof fs.ReadStream) opened.push(args[2]);
            return request(...args);
        } };
        (client as any)._sleep = async () => {};
        return client;
    }

    test('resends the complete file after an early HTTP rejection', async () => {
        let attempts = 0;
        let received: Buffer;
        const original = openFile();
        let firstAttemptBytesRead: number;
        let firstAttemptReadable: boolean;
        let serverError: Error;
        const sockets: Socket[] = [];
        const server = http.createServer((request, result) => {
            attempts++;
            request.on('error', () => {});
            if (attempts === 1) {
                let bytes = 0;
                request.on('data', chunk => {
                    bytes += chunk.length;
                    if (bytes >= 1024 * 1024 && !result.headersSent) {
                        original.pause();
                        firstAttemptBytesRead = original.bytesRead;
                        firstAttemptReadable = original.readable;
                        result.writeHead(503, { Connection: 'close' });
                        result.end('{}');
                    }
                });
            } else {
                readBody(request).then(body => {
                    received = body;
                    result.end('{}');
                }).catch(error => {
                    serverError = error;
                    result.destroy(error);
                });
            }
        });
        server.on('connection', socket => sockets.push(socket));
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        const client = new WebClient();
        (client as any)._sleep = async () => {};
        try {
            const result = await client.sendRequest({
                method: 'POST',
                uri: `http://127.0.0.1:${(server.address() as AddressInfo).port}/publish`,
                body: original
            }, { retryCount: 2 });
            expect(serverError).toBeUndefined();
            expect(firstAttemptBytesRead).toBeGreaterThan(0);
            expect(firstAttemptBytesRead).toBeLessThan(contents.length);
            expect(firstAttemptReadable).toBe(true);
            expect(result.statusCode).toBe(200);
            expect(attempts).toBe(2);
            expect(received.length).toBe(contents.length);
            expect(received.equals(contents)).toBe(true);
        } finally {
            sockets.forEach(socket => socket.destroy());
            await new Promise<void>(resolve => server.close(() => resolve()));
        }
    });

    test.each([['status', 'string'], ['error', 'string'], ['status', 'Buffer']])('reopens a partially consumed file after a retryable %s with a %s path', async (failure, pathType) => {
        const original = fs.createReadStream(pathType === 'Buffer' ? Buffer.from(file) : file, { highWaterMark: 1024 });
        opened.push(original);
        let received: Buffer;
        const request = jest.fn(async (_method, _uri, body) => {
            if (request.mock.calls.length === 1) {
                await consumePrefix(body);
                expect(body.readable).toBe(true);
                if (failure === 'error') {
                    throw Object.assign(new Error('connection reset'), { code: 'ECONNRESET' });
                }
                return response(503);
            }
            expect(original.destroyed).toBe(true);
            received = await readBody(body);
            return response(200);
        });
        const result = await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: original }, { retryCount: 2 });
        expect(result.statusCode).toBe(200);
        expect(request).toHaveBeenCalledTimes(2);
        expect(received.equals(contents)).toBe(true);
    });

    test.each([undefined, 'hex'])('preserves a file byte range and %s encoding on retry', async encoding => {
        const original = openFile({ start: 17, end: 8192, highWaterMark: 64, encoding });
        const request = jest.fn(async (_method, _uri, body) => {
            if (request.mock.calls.length === 1) {
                await consumePrefix(body);
                return response(503);
            }
            const expected = encoding ? Buffer.from(contents.slice(17, 8193).toString(encoding)) : contents.slice(17, 8193);
            expect((await readBody(body)).equals(expected)).toBe(true);
            return response(200);
        });
        await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: original }, { retryCount: 2 });
        expect(request).toHaveBeenCalledTimes(2);
    });

    test('stops at the configured attempt budget', async () => {
        const streams: fs.ReadStream[] = [];
        const prefixes: Buffer[] = [];
        const request = jest.fn(async (_method, _uri, body) => {
            expect(streams.every(stream => stream.destroyed)).toBe(true);
            streams.push(body);
            prefixes.push(await consumePrefix(body));
            return response(503);
        });
        const result = await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: openFile({ highWaterMark: 64 }) }, { retryCount: 3 });
        expect(result.statusCode).toBe(503);
        expect(request).toHaveBeenCalledTimes(3);
        expect(prefixes).toHaveLength(3);
        prefixes.forEach(prefix => expect(prefix.equals(contents.slice(0, 64))).toBe(true));
    });

    test('retains an intact descriptor-backed stream when retrying before consumption', async () => {
        const original = openFile({ fd: fs.openSync(file, 'r'), autoClose: false });
        expect(original.path).toBeUndefined();
        const request = jest.fn(async (_method, _uri, body) => {
            expect(body).toBe(original);
            if (request.mock.calls.length === 1) return response(503);
            expect((await readBody(body)).equals(contents)).toBe(true);
            return response(200);
        });
        const result = await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: original }, { retryCount: 2 });
        expect(result.statusCode).toBe(200);
        expect(request).toHaveBeenCalledTimes(2);
    });

    test('reopens an exhausted file body on the first attempt', async () => {
        const original = openFile({ start: 17, end: 8192, encoding: 'hex' });
        await readBody(original);
        expect(original.readable).toBe(false);
        const request = jest.fn(async (_method, _uri, body) => {
            const received = await readBody(body);
            expect(received.equals(Buffer.from(contents.slice(17, 8193).toString('hex')))).toBe(true);
            return response(200);
        });
        const result = await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: original });
        expect(result.statusCode).toBe(200);
        expect(request).toHaveBeenCalledTimes(1);
    });

    test('passes an ordinary readable body through the first attempt', async () => {
        const payload = contents.slice(0, 257);
        const original = Readable.from([payload]);
        const request = jest.fn(async (_method, _uri, body) => {
            expect(body).toBe(original);
            expect((await readBody(body)).equals(payload)).toBe(true);
            return response(200);
        });
        const result = await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: original });
        expect(result.statusCode).toBe(200);
        expect(request).toHaveBeenCalledTimes(1);
    });

    test('passes a bodyless request through the first attempt', async () => {
        const request = jest.fn(async (_method, _uri, body) => {
            expect(body).toBe('');
            return response(200);
        });
        const result = await clientWithTransport(request).sendRequest({ method: 'GET', uri: 'https://example.invalid' });
        expect(result.statusCode).toBe(200);
        expect(request).toHaveBeenCalledTimes(1);
    });

    test('rejects a permanent transport error after one attempt', async () => {
        const failure = Object.assign(new Error('permission denied'), { code: 'EACCES' });
        const request = jest.fn(async (_method, _uri, body) => {
            await consumePrefix(body);
            throw failure;
        });
        await expect(clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: openFile({ highWaterMark: 64 }) })).rejects.toBe(failure);
        expect(request).toHaveBeenCalledTimes(1);
    });

    test('returns permanent failures after one attempt', async () => {
        const original = openFile();
        const request = jest.fn(async () => response(403));
        try {
            const result = await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: original });
            expect(result.statusCode).toBe(403);
            expect(request).toHaveBeenCalledTimes(1);
        } finally {
            original.destroy();
        }
    });

    test('preserves string bodies across retries', async () => {
        const request = jest.fn(async (_method, _uri, body) => {
            expect(body).toBe('payload');
            return response(request.mock.calls.length === 1 ? 503 : 200);
        });
        const result = await clientWithTransport(request).sendRequest({ method: 'POST', uri: 'https://example.invalid', body: 'payload' }, { retryCount: 2 });
        expect(result.statusCode).toBe(200);
        expect(request).toHaveBeenCalledTimes(2);
    });
});
