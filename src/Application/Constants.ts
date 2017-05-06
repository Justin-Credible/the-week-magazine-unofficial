
/**
 * A common location for application-wide constant values.
 */
namespace JustinCredible.TheWeek.Constants {

    /**
     * Value for rejection of a promise when opening a dialog using the showDialog
     * helper method. This value will be used when showDialog was called with a dialog
     * ID of a dialog that is already open.
     */
    export const DIALOG_ALREADY_OPEN = "DIALOG_ALREADY_OPEN";

    /**
     * Value for rejection of a promise when opening a dialog using the showDialog
     * helper method. This value will be used when showDialog was called with a dialog
     * ID who is not registered in the dialogTemplateMap map.
     */
    export const DIALOG_ID_NOT_REGISTERED = "DIALOG_ID_NOT_REGISTERED";
}

/**
 * A collection of titles for buttons commonly used with dialogs.
 */
namespace JustinCredible.TheWeek.Constants.Buttons {
    export const Yes = "Yes";
    export const No = "No";
    export const OK = "OK";
    export const Cancel = "Cancel";
}

/**
 * A collection of names of events used within the application.
 */
namespace JustinCredible.TheWeek.Constants.Events {
    export const HTTP_UNAUTHORIZED = "http.unauthorized";
    export const HTTP_FORBIDDEN = "http.forbidden";
    export const HTTP_NOT_FOUND = "http.notFound";
    export const HTTP_UNKNOWN_ERROR = "http.unknownError";
    export const HTTP_ERROR = "http.error";

    export const APP_MENU_BUTTON = "app.menuButton";
    export const APP_CLOSE_DIALOG = "app.appCloseDialog";
    export const APP_DEV_TOOLS_ENABLED = "app.devToolsEnabled";
    export const APP_ISSUE_DOWNLOADED = "app.issueDownloaded";
    export const APP_ISSUE_DELETED = "app.issueDeleted";
    export const APP_ALL_ISSUES_DELETED = "app.allIssuesDeleted";

    export const SCROLL_REFRESH_COMPLETE = "scroll.refreshComplete";
}
