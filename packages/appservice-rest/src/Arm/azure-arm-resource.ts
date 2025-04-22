import { ServiceClient, ToError } from 'azure-actions-webclient/AzureRestClient';

import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { WebRequest } from 'azure-actions-webclient/WebClient';
import { getFormattedError } from './ErrorHandlerUtility';

export class Resources {
    private _client: ServiceClient;

    constructor(endpoint: IAuthorizer) {
        this._client = new ServiceClient(endpoint, 30);
    }

    public async getResources(resourceType: string, resourceName: string, resourceGroupName?:string) {
        var queryParameters = `$filter=resourceType EQ \'${encodeURIComponent(resourceType)}\' AND name EQ \'${encodeURIComponent(resourceName)}\'`;
        if(!!resourceGroupName){
            queryParameters = queryParameters + `AND resourceGroup EQ \'${encodeURIComponent(resourceGroupName)}\'`;
        }
        
        var httpRequest: WebRequest = {
            method: 'GET',
            uri: this._client.getRequestUri('//subscriptions/{subscriptionId}/resources', {},
            [queryParameters], '2024-11-01')
        };

        var result: any[] = [];
        try {
            var response = await this._client.beginRequest(httpRequest);
            if (response.statusCode != 200) {
                throw ToError(response);
            }

            result = result.concat(response.body.value);
            if (response.body.nextLink) {
                var nextResult = await this._client.accumulateResultFromPagedResult(response.body.nextLink);
                if (nextResult.error) {
                    throw Error(nextResult.error);
                }
                result = result.concat(nextResult.result);
            }

            return result;
        }
        catch (error) {
            throw Error("Failed to get resource ID for resource type " + resourceType + " and resource name " + resourceName + ".\n" + getFormattedError(error));
        }
    }
}
