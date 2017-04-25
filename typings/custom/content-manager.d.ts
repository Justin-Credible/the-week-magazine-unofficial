
/**
 * Type definitions for the content-manager native code plugin.
 */
declare module ContentManagerPlugin {

    interface ContentManagerPluginStatic {

        /**
         * Used to get a list of issues that have been downloaded to the device.
         * 
         * @param successCallback The callback to be executed when the call completes successfully.
         * @param failureCallback The callback to be executed when the call fails.
         */
        getDownloadedIssues(successCallback: (result: DownloadedIssue[]) => void, failureCallback: (error: string) => void): void;

        /**
         * Used to start a background download of the given issue.
         * 
         * @param id The ID of the issue to download.
         * @param successCallback The callback to be executed when the call completes successfully.
         * @param failureCallback The callback to be executed when the call fails.
         */
        downloadIssue(id: string, successCallback: () => void, failureCallback: (error: string) => void): void;

        /**
         * Used to check the background download status.
         * 
         * @param successCallback The callback to be executed when the call completes successfully.
         * @param failureCallback The callback to be executed when the call fails.
         */
        getDownloadStatus(id: string, successCallback: (status: DownloadStatus) => void, failureCallback: (error: string) => void): void;

        /**
         * Used to remove the given issue from the device.
         * 
         * @param id The ID of the issue to delete.
         * @param successCallback The callback to be executed when the call completes successfully.
         * @param failureCallback The callback to be executed when the call fails.
         */
        deleteIssue(id: string, successCallback: () => void, failureCallback: (error: string) => void): void;

        /**
         * Used to remove the given issue from the device.
         * 
         * @param id The ID of the issue to retrieve the content manifest for.
         * @param successCallback The callback to be executed when the call completes successfully.
         * @param failureCallback The callback to be executed when the call fails.
         */
        getIssueContentXML(id: string, successCallback: (contentXML: string) => void, failureCallback: (error: string) => void): void;
    }

    interface DownloadedIssue {

        id: string;

        /**
         * True if the issue downloaded property and is ready for use.
         */
        ok: boolean;
    }

    interface DownloadStatus {
        inProgress: boolean,
        id: string;
        statusText: string;
        percentage: number;
    }
}

declare var ContentManagerPlugin: ContentManagerPlugin.ContentManagerPluginStatic;
