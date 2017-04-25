
/**
 * Describes the request and response data formta for The Week's public API.
 */
namespace JustinCredible.TheWeek.Interfaces.API {

    export interface ToStringable {
        toString(): string;
    }

    export interface EndpointResponse {
        feed: Feed;
    }

    export interface Feed {

        generator: FeedGenerator;
        id: string;
        link: FeedLink[];
        author: string;
        title: string;
        subtitle: string;
        updated: string;
        "deleted-entry": FeedDeletedEntry[];
        entry: FeedEntry[];
    }

    export interface FeedGenerator extends ToStringable {
        _version: string;
        _uri: string;
        __text: string;
    };

    export interface FeedLink extends ToStringable {
        _type: string;
        _href: string;
        _rel: string;
    }

    export interface FeedDeletedEntry extends ToStringable {
        comment: ToStringable;
        _ref: string;
        _when: string;
        __prefix: string;
    }

    export interface FeedEntry {
        title: string;
        id: string;
        updated: string;
        published: string;
        author: {
            name: string;
        };
        issued: ToStringable;
        category: FeedEntryCategory[];
        summary: ToStringable;
        link: FeedLink[];
    }

    export interface FeedEntryCategory extends ToStringable {
        _scheme: string;
        _term: string;
    }
}
