namespace JustinCredible.TheWeek.Models {

    /**
     * Cache behavior flags for use with DataSource service.
     */
    export enum CacheBehavior {

        /**
         * The default caching behavior; allows the data provider to determine
         * if a cached entry should be used or if fresh data should be retrieved.
         */
        Default,

        /**
         * Indicates that the cached content should be ignored and a fresh data
         * retrieve should be forced.
         */
        InvalidateCache,

        /**
         * Indicates that the cached content should can be used even if it is stale.
         */
        AllowStale
    }
}
