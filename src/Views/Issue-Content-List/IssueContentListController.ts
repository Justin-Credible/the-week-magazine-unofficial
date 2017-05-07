namespace JustinCredible.TheWeek.Controllers {

    export class IssueContentListController extends BaseController<ViewModels.IssueContentListViewModel> {

        //#region Injection

        public static ID = "IssueContentListController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$stateParams",
                "$timeout",
                "$ionicScrollDelegate",
                Services.Logger.ID,
                Services.Utilities.ID,
                Services.Plugins.ID,
                Services.UIHelper.ID,
                Services.MagazineUtils.ID,
                Services.MagazineDataSource.ID,
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $stateParams: Models.IssueContentListParams,
            private $timeout: ng.ITimeoutService,
            private $ionicScrollDelegate: ionic.scroll.IonicScrollDelegate,
            private Logger: Services.Logger,
            private Utilities: Services.Utilities,
            private Plugins: Services.Plugins,
            private UIHelper: Services.UIHelper,
            private MagazineUtils: Services.MagazineUtils,
            private MagazineDataSource: Services.MagazineDataSource) {
            super($scope, ViewModels.IssueContentListViewModel);
        }

        //#endregion

        //#region BaseController Overrides

        protected view_loaded(event?: ng.IAngularEvent, eventArgs?: Interfaces.ViewEventArguments): void {

            this.viewModel.loadError = false;
            this.viewModel.showSpinner = false;

            // We throw up the native spinner control, because the UI JavaScript thread will
            // block for a couple of seconds while it converts the massive string of XML into
            // a JSON object.
            this.Plugins.spinner.activityStart("Loading");

            this.$timeout(() => {
                this.refresh(this.$stateParams.issueID);
            }, 1000);
        }

        //#endregion

        //#region Controller Events

        protected coverImage_click(): void {

            if (this.viewModel.coverImageFilePath) {
                this.Plugins.photoViewer.show(this.viewModel.coverImageFilePath);
            }
        }

        protected article_click(article: Interfaces.API.FeedEntry): void {

            let baseStoragePath = "file:///data/user/0/net.justin_credible.theweek/files";

            let issueID = this.$stateParams.issueID;
            let link = this.MagazineUtils.getLinkByRel(article.link, "alternate");

            let URI = `${baseStoragePath}/issues/${issueID}/editions/${issueID}/${link._href}`;

            // "file:///data/user/0/net.justin_credible.theweek/files/issues/com.dennis.theweek.issue.issue819/editions/com.dennis.theweek.issue.issue819/data/51352/index.html"

            let options = [
                "location=no",
            ].join(",");

            let browser = this.Plugins.inAppBrowser.open(URI, "_blank", options);

            browser.addEventListener("loadstart", (event: InAppBrowserEvent) => {

                // If an article had a link out to an external page, close the in-app browser
                // and launch the URL in the external system browser.
                if (!this.Utilities.startsWith(event.url, "file:///")) {
                    browser.close();

                    this.Plugins.inAppBrowser.open(event.url, "_system");
                }
            });
        }

        //#endregion

        //#region Helpers

        private refresh(issueID: string): void {

            this.viewModel.showSpinner = true;

            this.MagazineDataSource.retrieveIssueContent(issueID)
                .then((issueContent: Interfaces.API.IssueContent) => {

                this.populateViewModel(issueContent);
                this.viewModel.loadError = false;

            }).catch((error: any) => {

                this.Logger.error(IssueContentListController.ID, "refresh", "An error occurred while retrieving the issue content.", error);
                this.viewModel.loadError = true;
                this.$ionicScrollDelegate.scrollTop(true);

            }).finally(() => {
                this.viewModel.showSpinner = false;
                this.Plugins.spinner.activityStop();
            });

            this.Plugins.contentManager.getCoverImageFilePath(issueID,
                (coverImageFilePath: string) => {

                    this.viewModel.coverImageFilePath = coverImageFilePath;
                    this.scope.$apply();

                }, (error: any) => {
                    this.Logger.error(IssueContentListController.ID, "refresh", "An error occurred while retrieving the issue cover image file path.", error);
                });
        }

        private populateViewModel(issueContent: Interfaces.API.IssueContent): void {

            this.viewModel.articles = {};

            for (let entry of issueContent.feed.entry) {

                let pageType = this.MagazineUtils.getTermByScheme(entry.category, "http://schema.pugpig.com/pagetype");

                if (pageType === "cover") {
                    let sharingImageLink = this.MagazineUtils.getLinkByRel(entry.link, "sharing_image");

                    if (sharingImageLink) {
                        this.viewModel.coverImageURL = sharingImageLink._href;
                    }
                }
                else if (pageType === "article") {

                    let section = this.MagazineUtils.getTermByScheme(entry.category, "http://schema.pugpig.com/section");

                    if (!this.viewModel.articles[section]) {
                        this.viewModel.articles[section] = [];
                    }

                    this.viewModel.articles[section].push(entry);
                }
            }

            this.Logger.info(IssueContentListController.ID, "populateViewModel", "Article entries grouped by section.", this.viewModel.articles);
        }

        //#endregion
    }
}
