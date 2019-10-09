import { HttpClient } from "typed-rest-client/HttpClient";
import { IRequestOptions } from "typed-rest-client/Interfaces";

export class RequestClient {
    private static _instance: HttpClient;
    private static _options: IRequestOptions;

    private constructor() {
        // Singleton pattern: block from public construction
        RequestClient._options = {};
        let ignoreSslErrors: string = `${process.env.ACTIONS_AZURE_REST_IGNORE_SSL_ERRORS}`;
        RequestClient._options.ignoreSslError = !!ignoreSslErrors && ignoreSslErrors.toLowerCase() === "true";
        RequestClient._instance = new HttpClient(`${process.env.AZURE_HTTP_USER_AGENT}`, undefined, RequestClient._options);
    }

    public static GetInstance(): HttpClient {
        if (RequestClient._instance === undefined) {
            new RequestClient(); 
        }

        return RequestClient._instance;
    }

    public static SetOptions(newOptions: IRequestOptions) {
        RequestClient._options = newOptions;
    }
}