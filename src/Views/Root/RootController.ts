namespace JustinCredible.TheWeek.Controllers {

    export class RootController extends BaseController<ViewModels.RootViewModel> {

        //#region Injection

        public static ID = "RootController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$timeout",
                "$location",
                "$http",
                Services.Logger.ID,
                Services.Configuration.ID,
                Services.Plugins.ID,
                Services.UIHelper.ID,
                Services.Preferences.ID
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $timeout: ng.ITimeoutService,
            private $location: ng.ILocationService,
            private $http: ng.IHttpService,
            private Logger: Services.Logger,
            private Configuration: Services.Configuration,
            private Plugins: Services.Plugins,
            private UIHelper: Services.UIHelper,
            private Preferences: Services.Preferences) {
            super($scope, ViewModels.RootViewModel);
        }

        //#endregion

        private _hasLoaded = false;

        //#region BaseController Overrides

        protected view_loaded(event?: ng.IAngularEvent, eventArgs?: Interfaces.ViewEventArguments): void {
            super.view_loaded(event, eventArgs);

            // In most cases Ionic's load event only fires once, the first time the controller is
            // initialize and attached to the DOM. However, abstract controllers (eg this one) will
            // have their Ionic view events fired for child views as well. Here we ensure that we
            // don't run the code below if we've already loaded before and a child is loading.
            if (this._hasLoaded) {
                return;
            }

            this._hasLoaded = true;

            this.scope.$on(Constants.Events.APP_DEV_TOOLS_ENABLED, _.bind(this.app_devToolsEnabled, this));
            this.scope.$on(Constants.Events.APP_ISSUE_DOWNLOADED, _.bind(this.app_issueDownloaded, this));
            this.scope.$on(Constants.Events.APP_ISSUE_DELETED, _.bind(this.app_issueDeleted, this));

            this.scope.$on(Constants.Events.HTTP_UNAUTHORIZED, _.bind(this.http_unauthorized, this));
            this.scope.$on(Constants.Events.HTTP_FORBIDDEN, _.bind(this.http_forbidden, this));
            this.scope.$on(Constants.Events.HTTP_NOT_FOUND, _.bind(this.http_notFound, this));
            this.scope.$on(Constants.Events.HTTP_UNKNOWN_ERROR, _.bind(this.http_unknownError, this));
            this.scope.$on(Constants.Events.HTTP_ERROR, _.bind(this.http_error, this));

            this.viewModel.applicationName = this.Configuration.values.appName;
            this.viewModel.downloadOnlyOnWiFi = this.Preferences.downloadOnlyOnWiFi;
            this.viewModel.totalSpaceUsedDisplay = null;
            this.viewModel.isDebugMode = this.Configuration.debug;
            this.viewModel.isDeveloperMode = this.Configuration.enableDeveloperTools;

            // TODO: Why are Cordova plugins not available at this point? Use setTimeout for now.
            // Cordova's device ready event should have already fired before this code path is possible.
            // Need to investigate; possible starter project issue.
            this.$timeout(() => {
                this.calculateTotalSpaceUsedDisplay();
            }, 3000);
        }

        //#endregion

        //#region Event Handlers

        private app_devToolsEnabled(event: ng.IAngularEvent) {
            this.viewModel.isDeveloperMode = true;
        }

        private app_issueDownloaded(event: ng.IAngularEvent) {
            this.viewModel.totalSpaceUsedDisplay = null;
            this.calculateTotalSpaceUsedDisplay();
        }

        private app_issueDeleted(event: ng.IAngularEvent) {
            this.viewModel.totalSpaceUsedDisplay = null;
            this.calculateTotalSpaceUsedDisplay();
        }

        private http_unauthorized(event: ng.IAngularEvent) {

            // Unauthorized should mean that a token wasn't sent, but we'll null these out anyways.
            this.Preferences.userId = null;
            this.Preferences.token = null;

            this.Plugins.toast.showLongBottom("You do not have a token (401); please login.");
        }

        private http_forbidden(event: ng.IAngularEvent, response: ng.IHttpPromiseCallbackArg<any>) {

            // A token was sent, but was no longer valid. Null out the invalid token.
            this.Preferences.userId = null;
            this.Preferences.token = null;

            this.Plugins.toast.showLongBottom("Your token has expired (403); please login again.");
        }

        private http_notFound(event: ng.IAngularEvent, response: ng.IHttpPromiseCallbackArg<any>) {
            // The restful API services are down maybe?
            this.Plugins.toast.showLongBottom("Server not available (404); please contact your administrator.");
        }

        private http_unknownError(event: ng.IAngularEvent, response: ng.IHttpPromiseCallbackArg<any>) {
            // No network connection, invalid certificate, or other system level error.
            this.Plugins.toast.showLongBottom("Network error; please try again later.");
        }

        /**
         * A generic catch all for HTTP errors that are not handled above in the other
         * error handlers.
         */
        private http_error(event: ng.IAngularEvent, response: ng.IHttpPromiseCallbackArg<any>): void {
            this.Plugins.toast.showLongBottom("An error has occurred; please try again.");
        }

        //#endregion

        //#region Controller Events

        protected deleteAllIssues_click(): void {

            if (!this.viewModel.totalSpaceUsedDisplay) {
                return;
            }

            let message = "Are you sure you want to delete all of the downloaded issues?";

            this.UIHelper.confirm(message, "Delete All Issues").then((result: string) => {

                if (!result || result === Constants.Buttons.No) {
                    return;
                }

                this.Plugins.spinner.activityStart("Deleting");

                this.Plugins.contentManager.deleteAllDownloadedIssues(
                    () => {
                        this.Plugins.spinner.activityStop();

                        this.Logger.info(RootController.ID, "deleteAllIssues_click", "All issues deleted successfully.");
                        this.Plugins.toast.showShortBottom("Deletion Complete");

                        this.calculateTotalSpaceUsedDisplay();

                        this.scope.$broadcast(Constants.Events.APP_ALL_ISSUES_DELETED);
                    },
                    (error: any) => {
                        this.Plugins.spinner.activityStop();

                        this.Logger.error(MagazineListController.ID, "deleteAllIssues_click", "An error occurred while deleting all issues.", error);
                        this.Plugins.toast.showShortBottom("An error occurred while deleting all issues.");

                        this.calculateTotalSpaceUsedDisplay();
                    });
            });
        }

        protected downloadOnlyOnWiFi_change(): void {
            this.Preferences.downloadOnlyOnWiFi = this.viewModel.downloadOnlyOnWiFi;
        }

        //#endregion

        //#region Helpers

        private calculateTotalSpaceUsedDisplay(): void {

            this.Plugins.contentManager.getDownloadedIssuesSize(
                (result: number) => {

                this.viewModel.totalSpaceUsedDisplay = Math.ceil(result / 1024 / 1024) + " MB";
                this.scope.$apply();
            },
            (error: any) => {
                this.viewModel.totalSpaceUsedDisplay = "(Error)";
                this.scope.$apply();
            });
        }

        //#endregion
    }
}
