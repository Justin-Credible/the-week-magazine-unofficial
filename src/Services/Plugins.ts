namespace JustinCredible.TheWeek.Services {

    /**
     * Provides access to Cordova plugins.
     * 
     * If the application is not running in Cordova it will return mock implementations.
     */
    export class Plugins {

        //#region Injection

        public static ID = "Plugins";

        public static get $inject(): string[] {
            return [
                Platform.ID,
                MockPlatformApis.ID
            ];
        }

        constructor(
            private Platform: Platform,
            private MockPlatformApis: MockPlatformApis) {
        }

        //#endregion

        //#region Plug-in Accessors

        /**
         * Exposes an API for showing user notifications (eg dialogs).
         */
        get notification(): any {
            if (typeof(navigator) !== "undefined" && navigator.notification) {
                return navigator.notification;
            }
            else {
                return this.MockPlatformApis.getNotificationPlugin();
            }
        }

        /**
         * Exposes an API for showing toast messages.
         */
        get toast(): ToastPlugin.ToastPluginStatic {
            if (!this.Platform.windowsCordova && !this.Platform.windows8Cordova && window.plugins && window.plugins.toast) {
                return window.plugins.toast;
            }
            else {
                return this.MockPlatformApis.getToastPlugin();
            }
        }

        /**
         * Exposes an API for working with progress indicators.
         */
        get spinner(): SpinnerPlugin.SpinnerPluginStatic {
            if (typeof(SpinnerPlugin) !== "undefined") {
                return SpinnerPlugin;
            }
            else {
                return this.MockPlatformApis.getSpinnerPlugin();
            }
        }

        /**
         * Exposes an API for working with the operating system's clipboard.
         */
        get clipboard(): ClipboardPlugin.ClipboardPluginStatic {
            if (this.Platform.windowsCordova) {
                return this.MockPlatformApis.getClipboardPluginForWindows();
            }
            else if (typeof(cordova) !== "undefined" && cordova.plugins && cordova.plugins.clipboard) {
                return cordova.plugins.clipboard;
            }
            else if (this.Platform.chromeExtension) {
                return this.MockPlatformApis.getClipboardPluginForChromeExtension();
            }
            else {
                return this.MockPlatformApis.getClipboardPlugin();
            }
        }

        /**
         * Exposes an API for manipulating the device's native status bar.
         */
        get statusBar(): StatusBar {
            if (window.StatusBar) {
                return window.StatusBar;
            }
            else {
                return this.MockPlatformApis.getStatusBarPlugin();
            }
        }

        /**
         * Exposes an API for adjusting keyboard behavior.
         */
        get keyboard(): Ionic.Keyboard {
            if (typeof(cordova) !== "undefined" && cordova.plugins && cordova.plugins.Keyboard) {
                return cordova.plugins.Keyboard;
            }
            else {
                return this.MockPlatformApis.getKeyboardPlugin();
            }
        }

        /**
         * Exposes the Content Manager for working with issue data.
         */
        get contentManager(): ContentManagerPlugin.ContentManagerPluginStatic {
            if (typeof(ContentManagerPlugin) !== "undefined" && cordova.plugins && cordova.plugins.Keyboard) {
                return ContentManagerPlugin;
            }
            else {
                return this.MockPlatformApis.getContentManagerPlugin();
            }
        }

        //#endregion
    }
}
