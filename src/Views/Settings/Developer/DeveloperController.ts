namespace JustinCredible.TheWeek.Controllers {

    export class DeveloperController extends BaseController<ViewModels.DeveloperViewModel> {

        //#region Injection

        public static ID = "DeveloperController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$rootScope",
                "$injector",
                "$window",
                "$interval",
                Services.Plugins.ID,
                Services.Platform.ID,
                Services.UIHelper.ID,
                Services.FileUtilities.ID,
                Services.Logger.ID,
                Services.Preferences.ID,
                Services.Configuration.ID,
                Services.MockPlatformApis.ID
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService,
            private $injector: ng.auto.IInjectorService,
            private $window: ng.IWindowService,
            private $interval: ng.IIntervalService,
            private Plugins: Services.Plugins,
            private Platform: Services.Platform,
            private UIHelper: Services.UIHelper,
            private FileUtilities: Services.FileUtilities,
            private Logger: Services.Logger,
            private Preferences: Services.Preferences,
            private Configuration: Services.Configuration,
            private MockPlatformApis: Services.MockPlatformApis) {
            super($scope, ViewModels.DeveloperViewModel);
        }

        //#endregion

        //#region BaseController Overrides

        protected view_beforeEnter(event?: ng.IAngularEvent, eventArgs?: Interfaces.ViewEventArguments): void {
            super.view_beforeEnter(event, eventArgs);

            this.viewModel.mockApiRequests = this.Configuration.enableMockHttpCalls;

            this.viewModel.userId = this.Preferences.userId;
            this.viewModel.token = this.Preferences.token;

            this.viewModel.isWebPlatform = this.Platform.web;
            this.viewModel.isWebStandalone = this.Platform.webStandalone;
            this.viewModel.devicePlatform = this.Platform.device.platform;
            this.viewModel.deviceModel = this.Platform.device.model;
            this.viewModel.deviceOsVersion = this.Platform.device.version;
            this.viewModel.deviceUuid = this.Platform.device.uuid;
            this.viewModel.deviceCordovaVersion = this.Platform.device.cordova;

            this.viewModel.navigatorPlatform = this.$window.navigator.platform;
            this.viewModel.navigatorProduct = this.$window.navigator.product;
            this.viewModel.navigatorVendor = this.$window.navigator.vendor;
            this.viewModel.viewport = this.Platform.viewport;
            this.viewModel.userAgent = this.$window.navigator.userAgent;

            this.viewModel.defaultStoragePathId = this.FileUtilities.getDefaultRootPathId();
            this.viewModel.defaultStoragePath = this.FileUtilities.getDefaultRootPath();

            this.viewModel.contentURL = this.Configuration.contentUrl;
        }

        //#endregion

        //#region Private Helper Methods

        private alertFileIoError(error: any) {
            if (error) {
                if (error.code) {
                    this.UIHelper.alert(error.code);
                }
                else if (error.message) {
                    this.UIHelper.alert(error.message);
                }
                else {
                    this.UIHelper.alert(error);
                }
            }
        }

        //#endregion

        //#region Controller Methods

        protected help_click(helpMessage: string): void {
            this.UIHelper.alert(helpMessage, "Help");
        }

        protected copyValue_click(value: any, name: string): void {
            this.UIHelper.confirm("Copy " + name + " to clipboard?").then((result: string) => {
                if (result === Constants.Buttons.Yes) {
                    this.Plugins.clipboard.copy(value);
                    this.Plugins.toast.showShortBottom(name + " copied to clipboard.");
                }
            });
        }

        protected mockApiRequests_change(): void {

            this.Configuration.enableMockHttpCalls = this.viewModel.mockApiRequests;

            var message = "The application needs to be reloaded for changes to take effect.\n\nReload now?";

            this.UIHelper.confirm(message, "Confirm Reload").then((result: string) => {
                if (result === Constants.Buttons.Yes) {
                    document.location.href = "index.html";
                }
            });
        }

        protected contentURL_click(): void {
            var message = "Here you can edit the content URL for this session.";

            this.UIHelper.prompt(message, "Content URL", null, this.Configuration.contentUrl).then((result: Models.KeyValuePair<string, string>) => {

                if (result.key === Constants.Buttons.Cancel) {
                    return;
                }

                this.Configuration.contentUrl = result.value;
                this.viewModel.contentURL = result.value;
                this.Plugins.toast.showShortBottom("Content URL changed for this session only.");
            });
        }

        protected addServicesToGlobalScope_click(): void {

            /* tslint:disable:no-string-literal */

            this.$window["__services"] = {
                $rootScope: this.$rootScope
            };

            for (var key in Services) {

                if (!Services.hasOwnProperty(key)) {
                    continue;
                }

                let serviceId = Services[key].ID;

                try {
                    let service = this.$injector.get(serviceId);
                    this.$window["__services"][key] = service;
                }
                catch (err) {
                    /* tslint:disable:no-empty */
                    /* tslint:enable:no-empty */
                }
            }

            /* tslint:enable:no-string-literal */

            this.UIHelper.alert("Added services to the global variable __services.");
        }

        protected downloadIssue_click(): void {

            this.UIHelper.prompt("Enter an issue ID to download.", "Download Issue", null, "com.dennis.theweek.issue.issue819")
                .then((result: Models.KeyValuePair<string, string>) => {

                if (!result || !result.key || result.key === Constants.Buttons.Cancel) {
                    return;
                }

                let errorCallback = (error: any) => {
                    this.$interval.cancel(this._checkDownloadInterval);
                    this.Plugins.toast.showShortBottom("An error occurred while downloading an issue.");
                    this.Logger.error(DeveloperController.ID, "downloadIssue_click", "An error occurred while downloading an issue.", error);
                };

                this.Plugins.contentManager.setContentBaseURL(this.Configuration.values.contentUrl, () => {

                    this.Plugins.contentManager.downloadIssue(result.value, () => {

                        this._checkDownloadInterval = this.$interval(_.bind(this.checkDownloadStatus, this), 1000);

                    }, errorCallback);

                }, errorCallback);
            });
        }

        private _checkDownloadInterval: ng.IPromise<void>;

        private checkDownloadStatus(): void {

            this.Plugins.contentManager.getDownloadStatus((status: ContentManagerPlugin.DownloadStatus) => {

                this.viewModel.downloadStatus = status;
                this.viewModel.downloadStatusJSON = JSON.stringify(status, null, 4);
                this.scope.$apply();

                if (!status || !status.inProgress) {
                    this.$interval.cancel(this._checkDownloadInterval);

                    this.Plugins.contentManager.getLastDownloadResult((result: ContentManagerPlugin.DownloadResult) => {

                        this.viewModel.downloadResult = result;
                        this.viewModel.downloadResultJSON = JSON.stringify(result, null, 4);
                        this.scope.$apply();

                    }, (error: any) => {
                        this.Logger.error(DeveloperController.ID, "checkDownloadStatus", "Error callback hit for getLastDownloadResult", error);
                        this.$interval.cancel(this._checkDownloadInterval);
                    });

                    return;
                }

            }, (error: any) => {
                this.Logger.error(DeveloperController.ID, "checkDownloadStatus", "Error callback hit for getDownloadStatus", error);
                this.$interval.cancel(this._checkDownloadInterval);
            });
        }

        protected getDownloadStats_click(): void {

            this.Plugins.contentManager.getDownloadStatus((result: ContentManagerPlugin.DownloadStatus) => {
                this.viewModel.downloadStatus = result;
                this.viewModel.downloadStatusJSON = JSON.stringify(result, null, 4);
                this.scope.$apply();
            });

            this.Plugins.contentManager.getLastDownloadResult((result: ContentManagerPlugin.DownloadResult) => {
                this.viewModel.downloadResult = result;
                this.viewModel.downloadResultJSON = JSON.stringify(result, null, 4);
                this.scope.$apply();
            });
        }

        protected clearDownloadStats_click(): void {
            this.viewModel.downloadStatus = null;
            this.viewModel.downloadStatusJSON = null;
            this.viewModel.downloadResult = null;
            this.viewModel.downloadResultJSON = null;
        }

        protected testJsException_click(): void {
            /* tslint:disable:no-string-literal */

            // Cause an exception by referencing an undefined variable.
            // We use defer so we can execute outside of the context of Angular.
            _.defer(function () {
                var x = window["____asdf"].blah();
            });

            /* tslint:enable:no-string-literal */
        }

        protected testAngularException_click(): void {
            /* tslint:disable:no-string-literal */

            // Cause an exception by referencing an undefined variable.
            var x = window["____asdf"].blah();

            /* tslint:enable:no-string-literal */
        }

        protected showFullScreenBlock_click(): void {
            this.Plugins.spinner.activityStart("Blocking...");

            setTimeout(() => {
                this.Plugins.spinner.activityStop();
            }, 4000);
        }

        protected showToast_top(): void {
            this.Plugins.toast.showShortTop("This is a test toast notification.");
        }

        protected showToast_center(): void {
            this.Plugins.toast.showShortCenter("This is a test toast notification.");
        }

        protected showToast_bottom(): void {
            this.Plugins.toast.showShortBottom("This is a test toast notification.");
        }

        protected clipboard_copy(): void {

            this.UIHelper.prompt("Enter a value to copy to the clipboard.").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                this.Plugins.clipboard.copy(result.value, () => {
                    this.UIHelper.alert("Copy OK!");
                }, (err: Error) => {
                    this.UIHelper.alert("Copy Failed!\n\n" + (err ? err.message : "Unknown Error"));
                });
            });
        }

        protected clipboard_paste(): void {
            this.Plugins.clipboard.paste((result: string) => {
                this.UIHelper.alert("Paste OK! Value retrieved is:\n\n" + result);
            }, (err: Error) => {
                this.UIHelper.alert("Paste Failed!\n\n" + (err ? err.message : "Unknown Error"));
            });
        }

        protected startProgress_click(): void {
            NProgress.start();
        }

        protected incrementProgress_click(): void {
            NProgress.inc();
        }

        protected doneProgress_click(): void {
            NProgress.done();
        }

        protected readFile_click(): void {
            this.UIHelper.prompt("Enter file name to read from", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                this.FileUtilities.readTextFile(result.value)
                    .then((text: string) => { this.Logger.debug(DeveloperController.ID, "readFile_click", "Read OK.", text); this.UIHelper.alert(text); },
                    (err: Error) => { this.Logger.error(DeveloperController.ID, "readFile_click", "An error occurred.", err); this.alertFileIoError(err); });
            });
        }

        protected writeFile_click(): void {
            var path: string,
                contents: string;

            this.UIHelper.prompt("Enter file name to write to", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                path = result.value;

                this.UIHelper.prompt("Enter file contents").then((result: Models.KeyValuePair<string, string>) => {

                    if (result.key !== Constants.Buttons.OK) {
                        return;
                    }

                    contents = result.value;

                    this.FileUtilities.writeTextFile(path, contents, false)
                        .then(() => { this.Logger.debug(DeveloperController.ID, "writeFile_click", "Write OK.", { path: path, contents: contents }); this.UIHelper.alert("Write OK."); },
                        (err: Error) => { this.Logger.error(DeveloperController.ID, "writeFile_click", "An error occurred.", err); this.alertFileIoError(err); });
                });
            });
        }

        protected appendFile_click(): void {
            var path: string,
                contents: string;

            this.UIHelper.prompt("Enter file name to write to", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                this.UIHelper.prompt("Enter file contents", "File I/O Test", null, " / ").then((result: Models.KeyValuePair<string, string>) => {

                    if (result.key !== Constants.Buttons.OK) {
                        return;
                    }

                    contents = result.value;

                    this.FileUtilities.writeTextFile(path, contents, true)
                        .then(() => { this.Logger.debug(DeveloperController.ID, "appendFile_click", "Append OK.", { path: path, contents: contents }); this.UIHelper.alert("Append OK."); },
                        (err: Error) => { this.Logger.error(DeveloperController.ID, "appendFile_click", "An error occurred.", err); this.alertFileIoError(err); });
                });
            });
        }

        protected createDir_click(): void {
            var path: string;

            this.UIHelper.prompt("Enter dir name to create", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                path = result.value;

                this.FileUtilities.createDirectory(path)
                    .then(() => { this.Logger.debug(DeveloperController.ID, "createDir_click", "Create directory OK.", path); this.UIHelper.alert("Create directory OK."); },
                    (err: Error) => { this.Logger.error(DeveloperController.ID, "createDir_click", "An error occurred.", err); this.alertFileIoError(err); });
            });
        }

        protected listFiles_click(): void {
            var path: string,
                list = "";

            this.UIHelper.prompt("Enter path to list files", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                path = result.value;

                this.FileUtilities.getFilePaths(path)
                    .then((files: any) => {
                        this.Logger.debug(DeveloperController.ID, "listFiles_click", "Get file paths OK.", files);

                        files.forEach((value: string) => {
                            list += "\n" + value;
                        });

                        this.UIHelper.alert(list);
                    },
                    (err: Error) => {
                        this.Logger.error(DeveloperController.ID, "listFiles_click", "An error occurred.", err);
                        this.alertFileIoError(err);
                    });
            });
        }

        protected listDirs_click(): void {
            var path: string,
                list = "";

            this.UIHelper.prompt("Enter path to list dirs", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                path = result.value;

                this.FileUtilities.getDirectoryPaths(path)
                    .then((dirs: any) => {
                        this.Logger.debug(DeveloperController.ID, "listDirs_click", "Get directory paths OK.", dirs);

                        dirs.forEach((value: string) => {
                            list += "\n" + value;
                        });

                        this.UIHelper.alert(list);
                    },
                    (err: Error) => {
                        this.Logger.error(DeveloperController.ID, "listDirs_click", "An error occurred.", err);
                        this.alertFileIoError(err);
                    });
            });
        }

        protected deleteFile_click(): void {
            var path: string;

            this.UIHelper.prompt("Enter path to delete file", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                path = result.value;

                this.FileUtilities.deleteFile(path)
                    .then(() => { this.Logger.debug(DeveloperController.ID, "deleteFile_click", "Delete file OK.", path); this.UIHelper.alert("Delete file OK."); },
                    (err: Error) => { this.Logger.error(DeveloperController.ID, "deleteFile_click", "An error occurred.", err); this.alertFileIoError(err); });
            });
        }

        protected deleteDir_click(): void {
            var path: string;

            this.UIHelper.prompt("Enter path to delete dir", "File I/O Test", null, "/").then((result: Models.KeyValuePair<string, string>) => {

                if (result.key !== Constants.Buttons.OK) {
                    return;
                }

                path = result.value;

                this.FileUtilities.deleteDirectory(path)
                    .then(() => { this.Logger.debug(DeveloperController.ID, "deleteDir_click", "Delete directory OK.", path); this.UIHelper.alert("Delete directory OK"); },
                    (err: Error) => { this.Logger.error(DeveloperController.ID, "deleteDir_click", "An error occurred.", err); this.alertFileIoError(err); });
            });
        }

        //#endregion
    }
}
