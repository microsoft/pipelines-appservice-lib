import util = require("util");
import fs = require('fs');
import httpClient = require("typed-rest-client/HttpClient");
import core = require('@actions/core');

import { RequestClient } from './RequestClient';

export interface WebRequest {
    method: string;
    uri: string;
    // body can be string or ReadableStream
    body?: string | NodeJS.ReadableStream;
    headers?: any;
}

export interface WebResponse {
    statusCode: number;
    statusMessage: string;
    headers: any;
    body: any;
}

export interface WebRequestOptions {
    retriableErrorCodes?: string[];
    retryCount?: number;
    retryIntervalInSeconds?: number;
    retriableStatusCodes?: number[];
    retryRequestTimedout?: boolean;
}

export async function sendRequest(request: WebRequest, options?: WebRequestOptions): Promise<WebResponse> {
    let i = 0;
    let retryCount = options && options.retryCount ? options.retryCount : 5;
    let retryIntervalInSeconds = options && options.retryIntervalInSeconds ? options.retryIntervalInSeconds : 2;
    let retriableErrorCodes = options && options.retriableErrorCodes ? options.retriableErrorCodes : ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "ESOCKETTIMEDOUT", "ECONNREFUSED", "EHOSTUNREACH", "EPIPE", "EA_AGAIN"];
    let retriableStatusCodes = options && options.retriableStatusCodes ? options.retriableStatusCodes : [408, 409, 500, 502, 503, 504];
    let timeToWait: number = retryIntervalInSeconds;
    while (true) {
        try {
            if (request.body && typeof(request.body) !== 'string' && !request.body["readable"]) {
                request.body = fs.createReadStream((request as any).body["path"]);
            }

            let response: WebResponse | undefined = await sendRequestInternal(request);
            if (response && retriableStatusCodes.indexOf(response.statusCode) != -1 && ++i < retryCount) {
                core.debug(util.format("Encountered a retriable status code: %s. Message: '%s'.", response.statusCode, response.statusMessage));
                await sleepFor(timeToWait);
                timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                continue;
            }

            return response as WebResponse;
        }
        catch (error) {
            if (retriableErrorCodes.indexOf(error.code) != -1 && ++i < retryCount) {
                core.debug(util.format("Encountered a retriable error:%s. Message: %s.", error.code, error.message));
                await sleepFor(timeToWait);
                timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
            }
            else {
                if (error.code) {
                    console.log("##[error]" + error.code);
                }

                throw error;
            }
        }
    }
}

export function sleepFor(sleepDurationInSeconds: number): Promise<any> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, sleepDurationInSeconds * 1000);
    });
}

async function sendRequestInternal(request: WebRequest): Promise<WebResponse | undefined> {
    core.debug(util.format("[%s]%s", request.method, request.uri));
    const httpCallbackClient: httpClient.HttpClient = RequestClient.GetInstance();
    var response: httpClient.HttpClientResponse = await httpCallbackClient.request(request.method, request.uri, request.body || "", request.headers);
    return await toWebResponse(response);
}

async function toWebResponse(response: httpClient.HttpClientResponse): Promise<WebResponse | undefined>{
    var res : WebResponse | undefined;
    if (response) {
        let resBody;
        var body = await response.readBody();
        if (body) {
            try {
                resBody = JSON.parse(body);
            }
            catch (error) {
                core.debug("Could not parse response: " + JSON.stringify(error));
                core.debug("Response: " + JSON.stringify(resBody));
                resBody = body;
            }
        }
        res = {
            statusCode: response.message.statusCode as number,
            statusMessage: response.message.statusMessage as string,
            headers: response.message.headers,
            body: resBody
        };
    }

    return res;
}
