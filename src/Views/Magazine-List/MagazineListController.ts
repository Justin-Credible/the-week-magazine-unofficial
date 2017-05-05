namespace JustinCredible.TheWeek.Controllers {

    export class MagazineListController extends BaseController<ViewModels.MagazineListViewModel> {

        //#region Injection

        public static ID = "MagazineListController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$timeout",
                "$interval",
                "$state",
                "$ionicScrollDelegate",
                Services.Logger.ID,
                Services.Plugins.ID,
                Services.UIHelper.ID,
                Services.MagazineUtils.ID,
                Services.MagazineDataSource.ID,
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $timeout: ng.ITimeoutService,
            private $interval: ng.IIntervalService,
            private $state: angular.ui.IStateService,
            private $ionicScrollDelegate: ionic.scroll.IonicScrollDelegate,
            private Logger: Services.Logger,
            private Plugins: Services.Plugins,
            private UIHelper: Services.UIHelper,
            private MagazineUtils: Services.MagazineUtils,
            private MagazineDataSource: Services.MagazineDataSource) {
            super($scope, ViewModels.MagazineListViewModel);
        }

        //#endregion

        private _checkDownloadInterval: ng.IPromise<void>;

        //#region BaseController Overrides

        protected view_loaded(event?: ng.IAngularEvent, eventArgs?: Interfaces.ViewEventArguments): void {
            super.view_loaded(event, eventArgs);

            // this.scope.$on(Constants.Events.APP_USER_LOGGED_IN, _.bind(this.app_userLoggedIn, this));
            // this.scope.$on(Constants.Events.APP_USER_LOGGED_OUT, _.bind(this.app_userLoggedOut, this));
        }

        protected view_beforeEnter(event?: ng.IAngularEvent, eventArgs?: Interfaces.ViewEventArguments): void {
            super.view_beforeEnter(event, eventArgs);

            this.viewModel.loadError = false;
            this.viewModel.showSpinner = false;
            this.viewModel.isRefreshing = false;

            this.viewModel.showSpinner = true;
            this.refresh();
        }

        protected view_beforeLeave(event?: ng.IAngularEvent, eventArgs?: Interfaces.ViewEventArguments): void {
            super.view_beforeLeave(event, eventArgs);

            this.$interval.cancel(this._checkDownloadInterval);
            this._checkDownloadInterval = null;
        }

        //#endregion

        //#region Events

        // /**
        //  * Fired when the user has logged in.
        //  */
        // private app_userLoggedIn(event: ng.IAngularEvent, user: Interfaces.API.User): void {
        //     this.viewModel.showSpinner = true;
        //     this.refresh(true);
        // }

        // /**
        //  * Fired when the user has logged out.
        //  */
        // private app_userLoggedOut(event: ng.IAngularEvent): void {
        //     this.viewModel.showSpinner = true;
        //     this.refresh(true);
        // }

        private downloadStatus_intervalTick(): void {

            this.Plugins.contentManager.getDownloadStatus((status: ContentManagerPlugin.DownloadStatus) => {

                if (status && status.inProgress) {
                    // Download is in progress; update status on view model.
                    this.viewModel.downloadStatus = status;
                }
                else {
                    // If the download is no longer in progress...

                    this.viewModel.downloadStatus = null;

                    // Ensure this doesn't run again.
                    this.$interval.cancel(this._checkDownloadInterval);
                    this._checkDownloadInterval = null;

                    // Update the list of downloaded issues (a new one may have completed).
                    this.Plugins.contentManager.getDownloadedIssues((issues: ContentManagerPlugin.DownloadedIssue[]) => {

                        this.populateDownloadedIssuesMap(issues);
                        this.scope.$apply();

                        this.$ionicScrollDelegate.scrollTop(true);
                    });

                    // Log and show a toast message depending on the result of the download.
                    this.Plugins.contentManager.getLastDownloadResult((result: ContentManagerPlugin.DownloadResult) => {

                        if (result.success) {
                            this.Plugins.toast.showShortBottom("Download Complete");
                            this.Logger.info(MagazineListController.ID, "downloadStatus_intervalTick", "An issue was downloaded successfully.", result);
                        }
                        else {
                            this.Plugins.toast.showShortBottom("Download Failed");
                            this.Logger.error(MagazineListController.ID, "downloadStatus_intervalTick", "An issue downloaded failed.", result);
                        }
                    });
                }

                this.scope.$apply();
            });
        }

        //#endregion

        //#region Controller Events

        protected refresher_refresh(): void {
            this.refresh(true);
        }

        protected readIssue_click(issue: Models.MagazineIssue): void {

            let param = new Models.IssueContentListParams();
            param.issueID = issue.id;

            this.$state.go("app.issue-content-list", param);
        }

        protected deleteIssue_click(issue: Models.MagazineIssue): void {

            let message = `Are you sure you want to delete the issue "${issue.title}" ?`;

            this.UIHelper.confirm(message, "Delete Issue").then((result: string) => {

                if (!result || result === Constants.Buttons.No) {
                    return;
                }

                this.Plugins.spinner.activityStart("Deleting");

                this.Plugins.contentManager.deleteIssue(issue.id,
                    () => {
                        this.$timeout(() => { this.Plugins.spinner.activityStop(); }, 1000);

                        this.viewModel.showSpinner = true;
                        this.refresh(true);
                        this.scope.$apply();
                    },
                    (error: any) => {
                        this.Plugins.spinner.activityStop();

                        this.Logger.error(MagazineListController.ID, "deleteIssue_click", "An error occurred while deleting an issue.", error);
                        this.Plugins.toast.showShortBottom("An error occurred while deleting an issue.");

                        this.viewModel.showSpinner = true;
                        this.refresh(true);
                        this.scope.$apply();
                    });
            });
        }

        protected downloadIssue_click(issue: Models.MagazineIssue): void {

            let message = `Are you sure you want to download the issue "${issue.title}" ?`;

            this.UIHelper.confirm(message, "Download Issue").then((result: string) => {

                if (!result || result === Constants.Buttons.No) {
                    return;
                }

                this.Plugins.spinner.activityStart("Downloading");

                this.Plugins.contentManager.downloadIssue(issue.id,
                    () => {
                        this.$timeout(() => { this.Plugins.spinner.activityStop(); }, 1000);

                        this.ensureDownloadStatusPolling();
                    },
                    (error: any) => {
                        this.Plugins.spinner.activityStop();

                        this.Logger.error(MagazineListController.ID, "downloadIssue_click", "An error occurred while starting a download for an issue.", error);
                        this.Plugins.toast.showShortBottom("An error occurred while starting a download for an issue.");

                        this.viewModel.showSpinner = true;
                        this.refresh(true);
                        this.scope.$apply();
                    });
            });
        }

        protected cancelDownload_click(): void {

            let message = "Are you sure you want to cancel the current download?";

            this.UIHelper.confirm(message, "Cancel Download").then((result: string) => {

                if (!result || result === Constants.Buttons.No) {
                    return;
                }

                this.$interval.cancel(this._checkDownloadInterval);
                this._checkDownloadInterval = null;

                this.Plugins.spinner.activityStart("Cancelling");

                this.Plugins.contentManager.cancelDownload(
                    () => {
                        this.$timeout(() => { this.Plugins.spinner.activityStop(); }, 1000);

                        this.Plugins.toast.showShortBottom("Download Cancelled");
                        this.Logger.info(MagazineListController.ID, "cancelDownload_click", "An download was cancelled by the user.");

                        this.$timeout(() => {
                            this.viewModel.showSpinner = true;
                            this.refresh(true);
                        }, 1000);
                    },
                    (error: any) => {
                        this.Plugins.spinner.activityStop();

                        this.Logger.warn(MagazineListController.ID, "cancelDownload_click", "An error occurred while cancelling a download.", error);

                        this.viewModel.showSpinner = true;
                        this.refresh(true);
                        this.scope.$apply();
                    });
            });
        }

        //#endregion

        //#region Helpers

        private refresh(forceRefresh?: boolean): void {

            this.viewModel.isRefreshing = true;

            let cacheBehavior = forceRefresh ? Models.CacheBehavior.InvalidateCache : Models.CacheBehavior.Default;

            this.MagazineDataSource.retrieveIssueFeed(cacheBehavior)
                .then((feed: Interfaces.API.Feed) => {

                this.populateViewModel(feed);
                this.viewModel.loadError = false;

            }).catch((error: any) => {

                this.Logger.error(MagazineListController.ID, "refresh", "An error occurred while retrieving the list of magazine issues.", error);
                this.viewModel.loadError = true;
                this.$ionicScrollDelegate.scrollTop(true);

            }).finally(() => {
                // Notify the Ionic pull-to-refresh control that the operation has completed.
                this.scope.$broadcast(Constants.Events.SCROLL_REFRESH_COMPLETE);

                this.viewModel.isRefreshing = false;
                this.viewModel.showSpinner = false;
            });

            this.Plugins.contentManager.getDownloadStatus((status: ContentManagerPlugin.DownloadStatus) => {

                this.viewModel.downloadStatus = status;
                this.scope.$apply();

                if (status && status.inProgress) {
                    this.ensureDownloadStatusPolling();
                }
            });

            this.Plugins.contentManager.getDownloadedIssues((issues: ContentManagerPlugin.DownloadedIssue[]) => {

                this.populateDownloadedIssuesMap(issues);
                this.scope.$apply();
            });
        }

        private populateViewModel(feed: Interfaces.API.Feed): void {

            this.viewModel.issues = [];

            // Limit to the last two months (one issue per week).
            let entries = _.take(feed.entry, 8);

            for (let entry of entries) {

                let issue = this.MagazineUtils.buildIssue(entry);

                if (issue) {
                    this.viewModel.issues.push(issue);
                }
            }
        }

        private populateDownloadedIssuesMap(issues: ContentManagerPlugin.DownloadedIssue[]): void {

            this.viewModel.downloadedIssueMap = null;

            if (issues && issues.length > 0) {

                for (let issue of issues) {

                    if (!issue.ok) {
                        continue;
                    }

                    if (!this.viewModel.downloadedIssueMap) {
                        this.viewModel.downloadedIssueMap = {};
                    }

                    this.viewModel.downloadedIssueMap[issue.id] = true;
                }
            }
        }

        private ensureDownloadStatusPolling(): void {

            if (this._checkDownloadInterval) {
                return;
            }

            this._checkDownloadInterval = this.$interval(_.bind(this.downloadStatus_intervalTick, this), 1000);
        }

        //#endregion
    }
}
