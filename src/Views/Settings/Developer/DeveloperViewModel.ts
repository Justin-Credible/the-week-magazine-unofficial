namespace JustinCredible.TheWeek.ViewModels {

    export class DeveloperViewModel {
        mockApiRequests: boolean;

        downloadStatus: ContentManagerPlugin.DownloadStatus;
        downloadResult: ContentManagerPlugin.DownloadResult;

        downloadStatusJSON: string;
        downloadResultJSON: string;

        isWebPlatform: boolean;
        isWebStandalone: boolean;
        devicePlatform: string;
        deviceModel: string;
        deviceOsVersion: string;
        deviceUuid: string;
        deviceCordovaVersion: string;

        navigatorPlatform: string;
        navigatorProduct: string;
        navigatorVendor: string;
        viewport: { width: number; height: number; };
        userAgent: string;

        userId: string;
        token: string;

        defaultStoragePathId: string;
        defaultStoragePath: string;

        contentURL: string;
    }
}
