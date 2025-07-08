export class SiteContainer {
    private name: string;
    private targetPort: string;
    private isMain: boolean;
    private image: string;
    private authType?: string;
    private userName?: string;
    private passwordSecret?: string;
    private userManagedIdentityClientId?: string;

    constructor(name: string, image: string, targetPort?: string, isMain?: boolean, authType?: string, userName?: string, passwordSecret?: string, userManagedIdentityClientId?: string) {
        this.name = name;
        this.image = image;
        this.targetPort = targetPort || '';
        this.isMain = isMain || false;
        this.authType = authType;
        this.userName = userName;
        this.passwordSecret = passwordSecret;
        this.userManagedIdentityClientId = userManagedIdentityClientId;
    }

    public getName(): string {
        return this.name;
    }
    public setName(name: string): void {
        this.name = name;
    }

    public getTargetPort(): string {
        return this.targetPort;
    }
    public setTargetPort(targetPort: string): void {
        this.targetPort = targetPort;
    }

    public getIsMain(): boolean {
        return this.isMain;
    }
    public setIsMain(isMain: boolean): void {
        this.isMain = isMain;
    }

    public getImage(): string {
        return this.image;
    }
    public setImage(image: string): void {
        this.image = image;
    }

    public getAuthType(): string | undefined {
        return this.authType;
    }
    public setAuthType(authType: string | undefined): void {
        this.authType = authType;
    }

    public getUserName(): string | undefined {
        return this.userName;
    }
    public setUserName(userName: string | undefined): void {
        this.userName = userName;
    }

    public getPasswordSecret(): string | undefined {
        return this.passwordSecret;
    }
    public setPasswordSecret(passwordSecret: string | undefined): void {
        this.passwordSecret = passwordSecret;
    }

    public getUserManagedIdentityClientId(): string | undefined {
        return this.userManagedIdentityClientId;
    }
    public setUserManagedIdentityClientId(userManagedIdentityClientId: string | undefined): void {
        this.userManagedIdentityClientId = userManagedIdentityClientId;
    }
}