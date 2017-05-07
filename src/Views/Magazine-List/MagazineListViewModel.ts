namespace JustinCredible.TheWeek.ViewModels {

    export class MagazineListViewModel {
        public showSpinner: boolean;
        public isRefreshing: boolean;
        public loadError: boolean;

        public showDownloadedOnly: boolean;
        public showFutureIssues: boolean;

        public issues: Models.MagazineIssue[];

        public downloadedIssueMap: Interfaces.Dictionary<boolean>;

        public downloadStatus: ContentManagerPlugin.DownloadStatus;
    }
}
