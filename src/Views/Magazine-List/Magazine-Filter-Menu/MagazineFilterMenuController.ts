namespace JustinCredible.TheWeek.Controllers {

    export class MagazineFilterMenuController extends BasePopoverController<ViewModels.MagazineFilterMenuViewModel> {

        //#region Injection

        public static ID = "MagazineFilterMenuController";
        public static TemplatePath = "Views/Magazine-List/Magazine-Filter-Menu/Magazine-Filter-Menu.html";

        public static get $inject(): string[] {
            return [
                "$scope",
            ];
        }

        constructor(
            $scope: ng.IScope) {
            super($scope, ViewModels.MagazineFilterMenuViewModel);

            this.scope.$on("setFilters", _.bind(this.parent_setFilters, this));
        }

        //#endregion

        //#region Events

        private parent_setFilters($event: ng.IAngularEvent, filters: ViewModels.MagazineFilterMenuViewModel): void {
            this.viewModel.showDownloadedOnly = filters.showDownloadedOnly;
            this.viewModel.showFutureIssues = filters.showFutureIssues;
        }

        //#endregion

        //#region Controller Methods

        protected showDownloadedOnly_click(): void {
            this.viewModel.showDownloadedOnly = !this.viewModel.showDownloadedOnly;
            this.scope.$emit("filtersChanged", this.viewModel);
        }

        protected showFutureIssues_click(): void {
            this.viewModel.showFutureIssues = !this.viewModel.showFutureIssues;
            this.scope.$emit("filtersChanged", this.viewModel);
        }

        //#endregion
    }
}
