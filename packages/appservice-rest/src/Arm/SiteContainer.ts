export enum AUTH_TYPE {
    ANONYMOUS = "Anonymous",
    USERCREDENTIALS = "UserCredentials",
    SYSTEM_IDENTITY = "SystemIdentity",
    USER_ASSIGNED = "UserAssigned"
}

export class EnvironmentVariable {
    constructor(
        private name: string,
        private value: string,
    ) {}

    getName(): string {
        return this.name;
    }

    getValue(): string {
        return this.value;
    }

    setName(name: string): void {
        this.name = name;
    }

    setValue(value: string): void {
        this.value = value;
    }

    static fromJson(item: any): EnvironmentVariable {
        return new EnvironmentVariable(
            item.name,
            item.value
        );
    }

    static toJson(envVar: EnvironmentVariable): any {
        return {
            name: envVar.getName(),
            value: envVar.getValue()
        };
    }
}

export class VolumeMount {
    constructor(
        private containerMountPath: string,
        private volumeSubPath: string,
        private readOnly?: boolean,
    ) {}
    getContainerMountPath(): string {
        return this.containerMountPath;
    }
    getReadOnly(): boolean | undefined {
        return this.readOnly;
    }
    getVolumeSubPath(): string {
        return this.volumeSubPath;
    }
    setContainerMountPath(containerMountPath: string): void {
        this.containerMountPath = containerMountPath;
    }
    setReadOnly(readOnly: boolean): void {
        this.readOnly = readOnly;
    }
    setVolumeSubPath(volumeSubPath: string): void {
        this.volumeSubPath = volumeSubPath;
    }
    static fromJson(item: any): VolumeMount {
        return new VolumeMount(
            item.containerMountPath,
            item.readOnly,
            item.volumeSubPath
        );
    }
    static toJson(volumeMount: VolumeMount): any {
        return {
            containerMountPath: volumeMount.getContainerMountPath(),
            readOnly: volumeMount.getReadOnly(),
            volumeSubPath: volumeMount.getVolumeSubPath()
        };
    }
}

export class SiteContainer {
  constructor(
    private name: string,
    private image: string,
    private isMain: boolean,
    private targetPort?: string,
    private startupCommand?: string,
    private authType?: AUTH_TYPE,
    private userName?: string,
    private passwordSecret?: string,
    private userManagedIdentityClientId?: string,
    private environmentVariables?: EnvironmentVariable[],
    private volumeMounts?: VolumeMount[],
  ) {}
    getName(): string {
        return this.name;
    }   
    getImage(): string {
        return this.image;
    }

    getTargetPort(): string | undefined {
        return this.targetPort;
    }

    getIsMain(): boolean {
        return this.isMain ?? false;
    }   
    getStartupCommand(): string | undefined {
        return this.startupCommand;
    }
    getAuthType(): AUTH_TYPE | undefined {
        return this.authType;
    }
    getUserName(): string | undefined {
        return this.userName;
    }
    getPasswordSecret(): string | undefined {
        return this.passwordSecret;
    }

    getUserManagedIdentityClientId(): string | undefined {
        return this.userManagedIdentityClientId;
    }

    getEnvironmentVariables(): EnvironmentVariable[] | undefined {
        return this.environmentVariables;
    }
    getVolumeMounts(): VolumeMount[] | undefined {
        return this.volumeMounts;
    }
    setName(name: string): void {
        this.name = name;
    }
    setImage(image: string): void {
        this.image = image;
    }           
    setTargetPort(targetPort: string): void {
        this.targetPort = targetPort;
    }
    setIsMain(isMain: boolean): void {
        this.isMain = isMain;
    }
    setStartupCommand(startupCommand: string): void {
        this.startupCommand = startupCommand;
    }
    setAuthType(authType: AUTH_TYPE): void {
        this.authType = authType;
    }

    setUserName(userName: string): void {
        this.userName = userName;
    }
    setPasswordSecret(passwordSecret: string): void {
        this.passwordSecret = passwordSecret;
    }
    setUserManagedIdentityClientId(userManagedIdentityClientId: string): void {
        this.userManagedIdentityClientId = userManagedIdentityClientId;
    }
    setEnvironmentVariables(environmentVariables: EnvironmentVariable[]): void {
        this.environmentVariables = environmentVariables;
    }
    setVolumeMounts(volumeMounts: VolumeMount[]): void {
        this.volumeMounts = volumeMounts;
    }

    static fromJson(item: any): SiteContainer {
        return new SiteContainer(
            item.name,
            item.image,
            item.targetPort?.toString(),
            item.isMain ?? false,
            item.startupCommand,
            item.authType,
            item.userName,
            item.passwordSecret,
            item.userManagedIdentityClientId,
            item.environmentVariables?.map((env: any) => new EnvironmentVariable(env.name, env.value)),
            item.volumeMounts?.map((mount: any) => new VolumeMount(
                mount.containerMountPath,
                mount.readOnly,
                mount.volumeSubPath
            ))
        );
    }
}
