export class SiteContainer {
  constructor(
    private name: string,
    private image: string,
    private targetPort?: string,
    private isMain?: boolean,
    private authType?: string,
    private userName?: string,
    private passwordSecret?: string,
    private userManagedIdentityClientId?: string
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
    getAuthType(): string | undefined {
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
    setAuthType(authType: string): void {
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

    static fromJson(item: any): SiteContainer {
        return new SiteContainer(
            item.name,
            item.image,
            item.targetPort?.toString(),
            item.isMain ?? false,
            item.authType,
            item.userName,
            item.passwordSecret,
            item.userManagedIdentityClientId
    );
  }
}