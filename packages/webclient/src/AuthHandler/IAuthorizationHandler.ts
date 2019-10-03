export interface IAuthorizationHandler {
    getToken(force?: boolean, args?: string[]): Promise<string>;
    subscriptionID: string;
    baseUrl: string;
    getCloudSuffixUrl?: (suffixName: string) => string;
    getCloudEndpointUrl?: (ame: string) => string;
}