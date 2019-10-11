import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import { IAuthorizer } from "./IAuthorizer";

export class AzureCLIAuthorizer implements IAuthorizer{
    private constructor() { }

    public static async getAuthorizer() {
        if(!this._authorizer) {            
            this._authorizer = new AzureCLIAuthorizer();
            await this._authorizer._initialize();
        }

        return this._authorizer;
    }

    public get subscriptionID(): string {
        return this._subscriptionId;
    }

    public get baseUrl(): string {
        return this._cloudEndpoints['resourceManager'] || 'https://management.azure.com/';
    }

    public getCloudSuffixUrl(suffixName: string): string {
        return this._cloudSuffixes[suffixName];
    }

    public getCloudEndpointUrl(endpointName: string): string {
        return this._cloudEndpoints[endpointName];
    }

    public async getToken(force?: boolean, args?: string[]): Promise<string> {
        if(!this._token || force) {  
            try {
                let azAccessToken = JSON.parse(await AzureCLIAuthorizer.executeAzCliCommand('account get-access-token', !!args ? args : []));
                core.setSecret(azAccessToken);
                this._token = azAccessToken['accessToken'];
            }
            catch(error) {
                console.log('Failed to fetch Azure access token');
                throw error;
            }          
        }

        return this._token;
    }
    
    public static async executeAzCliCommand(command: string, args?: string[]): Promise<string> {
        let azCliPath = await AzureCLIAuthorizer._getAzCliPath();
        let stdout = '';
        let stderr = '';

        try {
            core.debug(`"${azCliPath}" ${command}`);
            await exec.exec(`"${azCliPath}" ${command}`, args, {
                silent: true, // this will prevent priniting access token to console output
                listeners: {
                    stdout: (data: Buffer) => {
                        stdout += data.toString();
                    },
                    stderr: (data: Buffer) => {
                      stderr += data.toString();
                    }
                }
            });
        }
        catch(error) {
            throw new Error(stderr);
        }
        
        return stdout;
    }

    private static async _getAzCliPath(): Promise<string> {
        if (!this._azCliPath) {
            this._azCliPath = await io.which('az', true);
        }

        return this._azCliPath;
    }

    private async _initialize() {
        let azAccountDetails = JSON.parse(await AzureCLIAuthorizer.executeAzCliCommand('account show'));
        let azCloudDetails = JSON.parse(await AzureCLIAuthorizer.executeAzCliCommand('cloud show'));

        this._subscriptionId = azAccountDetails['id'];
        this._cloudSuffixes = azCloudDetails['suffixes'];
        this._cloudEndpoints = azCloudDetails['endpoints'];
    }

    private _token: string = '';
    private _subscriptionId: string = '';
    private _cloudSuffixes: {[key: string]: string} = {};
    private _cloudEndpoints: {[key: string]: string} = {};
    private static _azCliPath: string;
    private static _authorizer: AzureCLIAuthorizer;
}