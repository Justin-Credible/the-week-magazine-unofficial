namespace JustinCredible.TheWeek.ViewModels {

    export class MagazineListViewModel {
        public showSpinner: boolean;
        public isRefreshing: boolean;
        public loadError: boolean;

        public issues: Models.MagazineIssue[];
    }
}
