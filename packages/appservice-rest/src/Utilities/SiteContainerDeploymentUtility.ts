import { AzureAppService } from '../Arm/azure-app-service';
import { AzureAppServiceUtility } from '../Utilities/AzureAppServiceUtility';

import fs = require('fs');
import path = require('path');
import core = require('@actions/core');
import { getFormattedError } from '../Arm/ErrorHandlerUtility';
import { SiteContainer } from '../Arm/SiteContainer';

export class SiteContainerDeploymentUtility {
    private _appService: AzureAppService;
    private _appServiceUtility: AzureAppServiceUtility;

    constructor(appService: AzureAppService) {
        this._appService = appService;
        this._appServiceUtility = new AzureAppServiceUtility(appService);
    }

    public async updateSiteContainer(siteContainer: SiteContainer): Promise<any> {
        try {
            return await this._appServiceUtility.updateSiteContainer(siteContainer);
        }
        catch(error) {
            throw Error("Failed to update SiteContainer "  + getFormattedError(error));
        }
    }
}