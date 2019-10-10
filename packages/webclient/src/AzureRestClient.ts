import * as core from '@actions/core';
import { WebClient, WebResponse, WebRequest } from './WebClient';
import { IAuthorizer } from './Authorizer/IAuthorizer';

export class ApiResult {
    public error: any;
    public result: any;
    public request: any;
    public response: any;

    constructor(error: any, result?: any, request?: any, response?: any) {
        this.error = error;
        this.result = result;
        this.request = request;
        this.response = response;
    }
}

export class AzureError {
    public code: any;
    public message?: string;
    public statusCode?: number;
    public details: any;
}

export interface ApiCallback {
    (error: any, result?: any, request?: any, response?: any): void
}

export function ToError(response: WebResponse): AzureError {
    let error = new AzureError();
    error.statusCode = response.statusCode;
    error.message = response.body

    if (response.body && response.body.error) {
        error.code = response.body.error.code;
        error.message = response.body.error.message;
        error.details = response.body.error.details;

        core.error(error.message);
    }

    return error;
}

export class ServiceClient {
    constructor(handler: IAuthorizer, timeout?: number) {
        this._webClient = new WebClient();
        this._authorizer = handler;
        this.subscriptionId = this._authorizer.subscriptionID;
        this.baseUrl = this._authorizer.baseUrl;
        this.longRunningOperationRetryTimeout = !!timeout ? timeout : 0; // In minutes
    }

    public getRequestUri(uriFormat: string, parameters: {}, queryParameters?: string[], apiVersion?: string): string {
        return this.getRequestUriForbaseUrl(this.baseUrl, uriFormat, parameters, queryParameters, apiVersion);
    }

    public getRequestUriForbaseUrl(baseUrl: string, uriFormat: string, parameters: {}, queryParameters?: string[], apiVersion?: string): string {
        let requestUri = baseUrl + uriFormat;
        requestUri = requestUri.replace('{subscriptionId}', encodeURIComponent(this.subscriptionId));
        for (let key in parameters) {
            requestUri = requestUri.replace(key, encodeURIComponent((<any>parameters)[key]));
        }

        // trim all duplicate forward slashes in the url
        let regex = /([^:]\/)\/+/gi;
        requestUri = requestUri.replace(regex, '$1');

        // process query paramerters
        queryParameters = queryParameters || [];
        if(!!apiVersion) {
            queryParameters.push('api-version=' + encodeURIComponent(apiVersion));
        }

        if (queryParameters.length > 0) {
            requestUri += '?' + queryParameters.join('&');
        }

        return requestUri
    }

    public async beginRequest(request: WebRequest, tokenArgs?: string[]): Promise<WebResponse> {
        let token = await this._authorizer.getToken(false, tokenArgs);

        request.headers = request.headers || {};
        request.headers['Authorization'] = `Bearer ${token}`;
        request.headers['Content-Type'] = 'application/json; charset=utf-8';

        let httpResponse = null;

        try
        {
            httpResponse = await this._webClient.sendRequest(request);
            if (httpResponse.statusCode === 401 && httpResponse.body && httpResponse.body.error && httpResponse.body.error.code === "ExpiredAuthenticationToken") {
                // The access token might have expire. Re-issue the request after refreshing the token.
                token = await this._authorizer.getToken(true, tokenArgs);
                request.headers['Authorization'] = `Bearer ${token}`;
                httpResponse = await this._webClient.sendRequest(request);
            }
        } 
        catch(exception) {
            let exceptionString: string = exception.toString();
            if(exceptionString.indexOf("Hostname/IP doesn't match certificates's altnames") != -1
                || exceptionString.indexOf("unable to verify the first certificate") != -1
                || exceptionString.indexOf("unable to get local issuer certificate") != -1) {
                
                core.warning("You're probably using a self-signed certificate in the SSL certificate validation chain. To resolve them you need to export a variable named ACTIONS_AZURE_REST_IGNORE_SSL_ERRORS to the value true.");
                throw exception;
            }
        }

        return httpResponse;
    }

    public async accumulateResultFromPagedResult(nextLinkUrl: string): Promise<ApiResult> {
        let result: any[] = [];
        while (!!nextLinkUrl) {
            let nextRequest: WebRequest = {
                method: 'GET',
                uri: nextLinkUrl
            };

            let response = await this.beginRequest(nextRequest);
            if (response.statusCode == 200 && response.body) {
                if (response.body.value) {
                    result = result.concat(response.body.value);
                }

                nextLinkUrl = response.body.nextLink;
            }
            else {
                return new ApiResult(ToError(response));
            }
        }

        return new ApiResult(null, result);
    }

    public subscriptionId: string;
    protected baseUrl: string;
    protected longRunningOperationRetryTimeout: number;
    private _authorizer: IAuthorizer;
    private _webClient: WebClient;
}
