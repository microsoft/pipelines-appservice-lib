import { AzureAppService } from '../Arm/azure-app-service';

import fs = require('fs');
import path = require('path');
import core = require('@actions/core');
import { getFormattedError } from '../Arm/ErrorHandlerUtility';
import { SiteContainer, VolumeMount, EnvironmentVariable } from '../Arm/SiteContainer';

export class SiteContainerDeploymentUtility {
    private _appService: AzureAppService;

    constructor(appService: AzureAppService) {
        this._appService = appService;
    }

    public async updateSiteContainer(siteContainer: SiteContainer): Promise<any> {
        try {
            const properties = await this.filterProperties(siteContainer);
            return await this._appService.updateSiteContainer(properties, siteContainer.getName());
        }
        catch(error) {
            throw Error("Failed to update SiteContainer, Error: "  + getFormattedError(error));
        }
    }

        private async filterProperties(siteContainer: SiteContainer): Promise<any> {
        const filteredProperties = {};

        const environmentVariablesProperties = [];
        if (siteContainer.getEnvironmentVariables()) {
            siteContainer.getEnvironmentVariables().forEach(env => {
                environmentVariablesProperties.push(EnvironmentVariable.toJson(env));
            });
        }

        const volumeMountsProperties = [];
        if (siteContainer.getVolumeMounts()) {
            siteContainer.getVolumeMounts().forEach((mount: VolumeMount) => {
                volumeMountsProperties.push(VolumeMount.toJson(mount));
            });
        }

        const allProperties = {
            image: siteContainer.getImage(),
            targetPort: siteContainer.getTargetPort(),
            isMain: siteContainer.getIsMain(),
            startupCommand: siteContainer.getStartupCommand(),
            authType: siteContainer.getAuthType(),
            userName: siteContainer.getUserName(),
            passwordSecret: siteContainer.getPasswordSecret(),
            userManagedIdentityClientId: siteContainer.getUserManagedIdentityClientId(),
            inheritAppSettingsAndConnectionStrings: siteContainer.getInheritAppSettingsAndConnectionStrings()
        };

        for (const key in allProperties) {
            const value = allProperties[key];
            if (value !== null && value !== undefined && value !== '') {
                filteredProperties[key] = value;
            }
        }

        if (volumeMountsProperties.length > 0) {
            filteredProperties["volumeMounts"] = volumeMountsProperties;
        }

        if (environmentVariablesProperties.length > 0) {
            filteredProperties["environmentVariables"] = environmentVariablesProperties;
        }

        return filteredProperties;
    }
}