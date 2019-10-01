import core = require('@actions/core');
import webClient = require('azure-actions-webclient/lib/webClient');
import { ServiceClient, ToError } from 'azure-actions-webclient/lib/AzureRestClient';
import { IAuthorizationHandler } from 'azure-actions-webclient/lib/AuthHandler/IAuthorizationHandler';
import { getFormattedError } from './ErrorHandlerUtility';

export interface ApplicationInsights {
    id?: string;
    name: string;
    type: string;
    location: string;
    tags: {[key: string]: string},
    kind?: string,
    etag?: string;
    properties?: {[key: string]: any};
}

export class AzureApplicationInsights {
    private _name: string;
    private _resourceGroupName: string;
    private _client: ServiceClient;

    constructor(endpoint: IAuthorizationHandler, resourceGroupName: string, name: string) {
        this._client = new ServiceClient(endpoint, 30);
        this._resourceGroupName = resourceGroupName;
        this._name = name;
    }

    public async addReleaseAnnotation(annotation: any): Promise<void> {
        var httpRequest: webClient.WebRequest = {
            method: 'PUT',
            body: JSON.stringify(annotation),
            uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/microsoft.insights/components/{resourceName}/Annotations`,
            {
                '{resourceGroupName}': this._resourceGroupName,
                '{resourceName}': this._name,
            }, null, '2015-05-01')
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`addReleaseAnnotation. Data : ${JSON.stringify(response)}`);
            if(response.statusCode == 200 || response.statusCode == 201) {
                return ;
            }

            throw ToError(response);
        }
        catch(error) {
            throw Error( "Failed to update Application Insights for resource " + this._name + ".\n" + getFormattedError(error));
        }
    }

    public getResourceGroupName(): string {
        return this._resourceGroupName;
    }
}


export class ApplicationInsightsResources {
    private _client: ServiceClient;

    constructor(endpoint: IAuthorizationHandler) {
        this._client = new ServiceClient(endpoint, 30);
    }

    public async list(resourceGroupName?: string, filter?: string[]): Promise<ApplicationInsights[]> {
        resourceGroupName = resourceGroupName ? `resourceGroups/${resourceGroupName}` : '';
        var httpRequest: webClient.WebRequest = {
            method: 'GET',
            uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/${resourceGroupName}/providers/microsoft.insights/components`,
            {}, filter, '2015-05-01')
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode == 200) {
                var responseBody = response.body;
                var applicationInsightsResources: ApplicationInsights[] = [];
                if(responseBody.value && responseBody.value.length > 0) {
                    for(var value of responseBody.value) {
                        applicationInsightsResources.push(value as ApplicationInsights);
                    }
                }

                return applicationInsightsResources;

            }

            throw ToError(response);
        }
        catch(error) {
            throw Error("Failed to get Application Insights Resource.\n" + getFormattedError(error));
        }

    }
}