namespace JustinCredible.TheWeek.Services {

    /**
     * Utilities for working with magazine data structures.
     */
    export class MagazineUtils {

        //#region Injection

        public static ID = "MagazineUtils";

        public static get $inject(): string[] {
            return [
                Logger.ID,
            ];
        }

        constructor(private Logger: Logger) {
        }

        //#endregion

        public getLinkByType(links: Interfaces.API.FeedLink[], type: string): Interfaces.API.FeedLink {

            if (!type || !links || links.length === 0) {
                return null;
            }

            return _.findWhere(links, { _type: type });
        }

        public getLinkByRel(links: Interfaces.API.FeedLink[], rel: string): Interfaces.API.FeedLink {

            if (!rel || !links || links.length === 0) {
                return null;
            }

            return _.findWhere(links, { _rel: rel });
        }

        public getTermByScheme(categories: Interfaces.API.FeedEntryCategory[], scheme: string): string {

            if (!scheme || !categories || categories.length === 0) {
                return null;
            }

            let category = _.findWhere(categories, { _scheme: scheme });

            return category == null ? null : category._term;
        }

        public buildImageURL(relativeURL: string): string {
            return "https://magazine.theweek.com" + relativeURL;
        }

        public buildIssue(entry: Interfaces.API.FeedEntry): Models.MagazineIssue {

            if (!entry) {
                return null;
            }

            try {

                let issue = new Models.MagazineIssue();

                issue.id = entry.id;
                issue.title = entry.title;
                issue.summary = entry.summary.toString();

                issue.size = this.getTermByScheme(entry.category, "http://schema.pugpig.com/download_size");

                let imageLink = this.getLinkByRel(entry.link, "http://opds-spec.org/image/thumbnail");

                if (imageLink) {
                    issue.imageURL = this.buildImageURL(imageLink._href);
                }

                issue.updated = moment(entry.updated);
                issue.published = moment(entry.published);

                issue.isFutureIssue = issue.published.isAfter(moment());

                return issue;
            }
            catch (error) {
                this.Logger.warn(MagazineUtils.ID, "buildIssue", "Error building MagazineIssue from FeedEntry.", error);
                return null;
            }
        }
    }
}
