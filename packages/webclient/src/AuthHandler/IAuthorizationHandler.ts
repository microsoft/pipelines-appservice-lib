export interface IAuthorizationHandler {
    getToken(args?: string[], force?: boolean): Promise<string>;
    subscriptionID: string;
    baseUrl: string;
}