import ex = require('@actions/exec');
import io = require('@actions/io');
import AzAuthInitializer = require('./AuthHandler/AzCliAuthHandler');

import { AzCliAuthHandler } from "./AuthHandler/AzCliAuthHandler";
import { AzureEndpoint } from "./AuthHandler/AzureEndpoint";
import { IAuthorizationHandler } from "./AuthHandler/IAuthorizationHandler";
import { exists } from "@actions/io/lib/io-util";

export const authFilePath: string = "/home/auth.json"

export async function getHandler(): Promise<IAuthorizationHandler> {
    let azPath = await io.which("az", true);
    let stdout = '';
    let code = await ex.exec(`"${azPath}" account show`, [], { silent: true,
        listeners: {
            stdout: (data: Buffer) => {
                stdout += data.toString();
            }
        } 
    });
    let resp = JSON.parse(stdout);
    let fileExist = await exists(authFilePath);

    if(code == 0 && !!resp && !!resp.id) {
        await AzAuthInitializer.initialize();
        return AzCliAuthHandler.getEndpoint(resp.id);
    }
    else if(fileExist) {
        return AzureEndpoint.getEndpoint(authFilePath);
    }
    else {
        throw new Error("No crdentails found. Please provide Publish Profile path or add a azure login script before this action or put credentiasl file in /home/auth.json.");
    }
}