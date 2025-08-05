SiteContainer 
{
    name: string, // mandatory
    image: string, // mandatory
    isMain: boolean, // mandatory
    targetPort?: string,
    startupCommand?: string,
    authType?: AUTH_TYPE,
    userName?: string,
    passwordSecret?: string,
    userManagedIdentityClientId?: string,
    environmentVariables?: EnvironmentVariable[],
    volumeMounts?: VolumeMount[],
    inheritAppSettingsAndConnectionStrings?: boolean,
  }

AUTH_TYPE is any of the following:
  Anonymous,
  UserCredentials,
  SystemIdentity,
  UserAssigned

type EnvironmentVariable {
  name: string; // mandatory
  value: string; // mandatory
}

type VolumeMount {
  name: string; // mandatory
  mountPath: string; // mandatory
  readOnly?: boolean;
}
