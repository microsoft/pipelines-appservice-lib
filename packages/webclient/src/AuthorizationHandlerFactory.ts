import * as core from '@actions/core';
import { AzCliAuthHandler } from "./AuthHandler/AzCliAuthHandler";
import { AzureEndpoint } from "./AuthHandler/AzureEndpoint";
import { IAuthorizationHandler } from "./AuthHandler/IAuthorizationHandler";
import { exists } from "@actions/io/lib/io-util";

export const authFilePath: string = "/home/auth.json"

export class AuthorizationHandlerFactory {
    public static async getHandler(): Promise<IAuthorizationHandler> {
        try {
            core.debug('try-get AzCliAuthHandler');
            return await AzCliAuthHandler.getHandler();
        }
        catch(error) {
            core.debug(error);
        }
    
        core.debug('try-get AzureEndpointHandler');
        if (exists(authFilePath)) {
            return AzureEndpoint.getEndpoint(authFilePath);
        }
    
        throw new Error("No crdentails found. Please provide Publish Profile path or add a azure login script before this action or put credentiasl file in /home/auth.json.");
    }
}