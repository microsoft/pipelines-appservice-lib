import exec = require('@actions/exec');
import io = require('@actions/io');
import core = require('@actions/core');

import { IAuthorizationHandler } from "./IAuthorizationHandler";

var azCloudDetails, azPath;

export class AzCliAuthHandler implements IAuthorizationHandler{
    private static endpoint: AzCliAuthHandler;
    private _subscriptionID: string = '';
    private _baseUrl: string = 'https://management.azure.com/';
    private _token: string = '';

    private constructor(subscriptionId: string) {
        this._subscriptionID = subscriptionId;
        this._baseUrl = !!azCloudDetails && azCloudDetails['endpoints']['resourceManager'];
    }

    public static getEndpoint(param?: string) {
        if(!this.endpoint) {            
            this.endpoint = new AzCliAuthHandler(param);
        }
        return this.endpoint;
    }

    public get subscriptionID(): string {
        return this._subscriptionID;
    }

    public get baseUrl(): string {
        return this._baseUrl;
    }

    public async getToken(args?: string[], force?: boolean): Promise<string> {
        if(!this._token || force) {  
            try {
                let azAccessToken = JSON.parse(await executeAzCliCommand('account get-access-token', !!args ? args : []));
                this._token = azAccessToken['accessToken'];
            }
            catch(error) {
                console.log('Failed to fetch Azure access token');
                throw error;
            }          
        }
        return this._token;
    }
}

export async function initialize() {  
    azPath = await io.which("az", true);
    azCloudDetails = JSON.parse(await executeAzCliCommand('cloud show'));
}

async function executeAzCliCommand(command: string, args?: string[]): Promise<string> {
    let stdout = '';
    let stderr = '';
   
    let code = await exec.exec(`"${azPath}" ${command}`, args, {
        silent: true,
        listeners: {
            stdout: (data: Buffer) => {
                stdout += data.toString();
            },
            stderr: (data: Buffer) => {
              stderr += data.toString();
            }
        }
    }); 

    if(code != 0) {
        core.debug('Failed to fetch Azure access token');
        throw new Error(stderr);
    }

    return stdout;
}