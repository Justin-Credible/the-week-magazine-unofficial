namespace JustinCredible.TheWeek.Services {

    /**
     * An in-memory persistance layer for data.
     */
    export class MagazineDataSource {

        //#region Injection

        public static ID = "MagazineDataSource";

        public static get $inject(): string[] {
            return [
                "$q",
                "$rootScope",
                TheWeekAPI.ID,
            ];
        }

        constructor(
            private $q: ng.IQService,
            private $rootScope: ng.IRootScopeService,
            private TheWeekAPI: TheWeekAPI) {
        }

        //#endregion

        private _defaultCacheDuration = moment.duration({ "minutes": 10 });

        private _issueFeedCache: Models.CacheEntry<Interfaces.API.Feed>;

        /**
         * Retrieves issue list from the feed endpoint.
         */
        public retrieveIssueFeed(cacheBehavior?: Models.CacheBehavior): ng.IPromise<Interfaces.API.Feed> {
            var q = this.$q.defer<Interfaces.API.Feed>();

            if (cacheBehavior == null) {
                cacheBehavior = Models.CacheBehavior.Default;
            }

            if (cacheBehavior === Models.CacheBehavior.Default) {
                let entry = this._issueFeedCache;

                if (entry && !entry.hasExpired) {
                    q.resolve(entry.item);
                    return q.promise;
                }
            }
            else if (cacheBehavior === Models.CacheBehavior.AllowStale) {
                let entry = this._issueFeedCache;

                if (entry) {
                    q.resolve(entry.item);
                    return q.promise;
                }
            }

            this.TheWeekAPI.retrieveIssueFeed()
                .then((feed: Interfaces.API.Feed) => {

                this._issueFeedCache = new Models.CacheEntry<Interfaces.API.Feed>(feed, this._defaultCacheDuration);

                q.resolve(feed);

            }).catch((error: any) => {
                q.reject(new Error(error));
            });

            return q.promise;
        }
    }
}
