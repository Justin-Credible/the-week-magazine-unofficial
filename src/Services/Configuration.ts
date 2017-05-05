namespace JustinCredible.TheWeek.Services {

    /**
     * Provides a way to easily get/set application configuration.
     * 
     * The current backing store is local storage and/or session storage:
     * https://cordova.apache.org/docs/en/3.0.0/cordova_storage_storage.md.html#localStorage
     */
    export class Configuration {

        //#region Injection

        public static ID = "Configuration";

        public static get $inject(): string[] {
            return [
                "buildVars"
            ];
        }

        constructor(
            private buildVars: Interfaces.BuildVars) {
        }

        //#endregion

        //#region Local Storage Keys

        private static ENABLE_DEVELOPER_TOOLS = "ENABLE_DEVELOPER_TOOLS";
        private static ENABLE_MOCK_HTTP_CALLS = "ENABLE_MOCK_HTTP_CALLS";

        //#endregion

        //#region Base Configuration

        /**
         * True if the application was build in debug configuration, false if it was
         * build a release or distribution configuration.
         */
        get debug(): boolean {
            return this.buildVars.debug;
        }

        /**
         * The time at which the application was built.
         */
        get buildTimestamp(): string {
            return this.buildVars.buildTimestamp;
        }

        /**
         * The short SHA for the git commit that this build was created from.
         * 
         * Will be 'unknown' if the commit couldn't be determined or the machine
         * that made the build did not have git installed.
         */
        get commitShortSha(): string {
            return this.buildVars.commitShortSha;
        }

        /**
         * Holds all of the name/value pairs from config.yml.
         */
        get values(): Interfaces.BuildConfig {
            return this.buildVars.config;
        }

        //#endregion

        //#region Extended Properties

        private _contentUrl: string = null;

        /**
         * The base URL for the magazine content.
         */
        get contentUrl(): string {

            // If the URL has been set via the developer tools for this session,
            // then use it, otherwise use the URL defined by the build configuration.
            if (this._contentUrl) {
                return this._contentUrl;
            }
            else {
                return this.buildVars.config.contentUrl;
            }
        }

        /**
         * Allows for setting the content URL temporarily for the current session only.
         */
        set contentUrl(value: string) {
            this._contentUrl = value;
        }

        //#endregion

        //#region Framework Settings

        get enableDeveloperTools(): boolean {
            return localStorage.getItem(Configuration.ENABLE_DEVELOPER_TOOLS) === "true";
        }

        set enableDeveloperTools(value: boolean) {
            if (value == null) {
                localStorage.removeItem(Configuration.ENABLE_DEVELOPER_TOOLS);
            }
            else {
                localStorage.setItem(Configuration.ENABLE_DEVELOPER_TOOLS, value.toString());
            }
        }

        get enableMockHttpCalls(): boolean {
            return localStorage.getItem(Configuration.ENABLE_MOCK_HTTP_CALLS) === "true";
        }

        set enableMockHttpCalls(value: boolean) {
            if (value == null) {
                localStorage.removeItem(Configuration.ENABLE_MOCK_HTTP_CALLS);
            }
            else {
                localStorage.setItem(Configuration.ENABLE_MOCK_HTTP_CALLS, value.toString());
            }
        }

        //#endregion
    }
}
