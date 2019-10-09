import * as core from '@actions/core';
import { AzureCLIAuthorizer } from "./Authorizer/AzureCLIAuthorizer";
import { IAuthorizer } from "./Authorizer/IAuthorizer";

export class AuthorizerFactory {
    public static async getAuthorizer(): Promise<IAuthorizer> {
        core.debug('try-get AzureCLIAuthorizer');
        try {
            return await AzureCLIAuthorizer.getAuthorizer();
        }
        catch(error) {
            core.debug(error);
            throw new Error("No credentails found. Add an Azure login script before this action.");
        }   
    }
}