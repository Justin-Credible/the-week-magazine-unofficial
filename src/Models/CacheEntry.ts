namespace JustinCredible.TheWeek.Models {

    /**
     * A wrapper object for cached objects for use with the DataSource service.
     */
    export class CacheEntry<T> {

        /**
         * @param item The item that will be cached.
         * @param lifespan Determines how long this cache entry is good for; null specifies no expiration.
         */
        constructor(item?: T, lifespan?: moment.Duration) {
            this._item = item;
            this._createdAt = moment();
            this._lifespan = lifespan;
        }

        private _createdAt: moment.Moment;

        /**
         * The time at which this cache entry was created.
         */
        public get createdAt(): moment.Moment {
            return this._createdAt;
        }

        public set createdAt(value: moment.Moment) {
            throw new Error("Setting createdAt on CacheEntry is not supported.");
        }

        private _lifespan: moment.Duration;

        /**
         * The duration that determines how long this cache entry is good for.
         * Null indicates that it will never expire.
         */
        public get lifespan(): moment.Duration {
            return this._lifespan;
        }

        public set lifespan(value: moment.Duration) {
            throw new Error("Setting lifespan on CacheEntry is not supported.");
        }

        /**
         * Used to check if the this cache entry has expired.
         */
        public get hasExpired(): boolean {

            // If there is no lifespan set, then this entry can never expire.
            if (this._lifespan == null) {
                return false;
            }

            // The add method is mutable, so we must clone first so we don't modify the create time.
            var expiresAt = this._createdAt.clone().add(this._lifespan);
            var now = moment();
            return now.isAfter(expiresAt);
        }

        /**
         * Used to immediately mark this cache entry as expired.
         */
        public expire(): void {

            this._lifespan = moment.duration({ "seconds": 0 });
        }

        /**
         * Used to immediately update the expiration time of this cache entry.
         */
        public touch(): void {
            this._createdAt = moment();
        }

        private _item: T;

        /**
         * This is the item that this cache entry is caching.
         */
        public get item(): T {
            return this._item;
        }

        public set item(value: T) {
            throw new Error("Setting item on CacheEntry is not supported.");
        }
    }
}
