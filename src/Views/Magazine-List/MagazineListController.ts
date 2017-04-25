namespace JustinCredible.TheWeek.Controllers {

    export class MagazineListController extends BaseController<ViewModels.MagazineListViewModel> {

        //#region Injection

        public static ID = "MagazineListController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$ionicScrollDelegate",
                Services.Logger.ID,
                Services.MagazineUtils.ID,
                Services.MagazineDataSource.ID,
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $ionicScrollDelegate: ionic.scroll.IonicScrollDelegate,
            private Logger: Services.Logger,
            private MagazineUtils: Services.MagazineUtils,
            private MagazineDataSource: Services.MagazineDataSource) {
            super($scope, ViewModels.MagazineListViewModel);
        }

        //#endregion

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

        protected refresher_refresh(): void {
            this.refresh(true);
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

            this.Logger.debug(MagazineListController.ID, "populateViewModel", "vm", this.viewModel);
        }

        //#endregion
    }
}
