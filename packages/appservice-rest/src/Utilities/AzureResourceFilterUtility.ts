import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { Resources } from '../Arm/azure-arm-resource';

export class AzureResourceFilterUtility {
    public static async getAppDetails(endpoint: IAuthorizer, resourceName: string, resourceGroupName?: string): Promise<any> {
        var azureResources: Resources = new Resources(endpoint);
        var filteredResources: Array<any> = await azureResources.getResources('Microsoft.Web/Sites', resourceName, resourceGroupName);
        let rgName: string;
        let kind: string;
        if(!filteredResources || filteredResources.length == 0) {
            throw new Error(`Resource ${resourceName} doesn't exist.`);
        }
        else if(filteredResources.length == 1) {
            rgName = filteredResources[0].id.split("/")[4];
            kind = filteredResources[0].kind;
        }
        else {
            throw new Error('Multiple resource group found for resource name' + resourceName);
        }

        return {
            resourceGroupName: rgName,
            kind: kind
        };
    }
}