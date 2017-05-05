namespace JustinCredible.TheWeek.ViewModels {

    export class IssueContentListViewModel {
        public showSpinner: boolean;
        public loadError: boolean;

        public coverImageURL: string;

        /**
         * Articles grouped by a string (e.g. "Main Stories", "Controversy of the Week")
         */
        public articles: Interfaces.Dictionary<Interfaces.API.FeedEntry[]>;
    }
}
