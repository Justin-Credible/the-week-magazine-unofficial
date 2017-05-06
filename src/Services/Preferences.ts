namespace JustinCredible.TheWeek.Services {

    /**
     * Provides a way to easily get/set user preferences.
     * 
     * The current backing store is local storage and/or session storage:
     * https://cordova.apache.org/docs/en/3.0.0/cordova_storage_storage.md.html#localStorage
     */
    export class Preferences {

        //#region Injection

        public static ID = "Preferences";

        //#endregion

        //#region Local Storage Keys

        private static USER_ID = "USER_ID";
        private static TOKEN = "TOKEN";
        private static DOWNLOAD_ONLY_ON_WIFI = "DOWNLOAD_ONLY_ON_WIFI";

        //#endregion

        get userId(): string {
            return localStorage.getItem(Preferences.USER_ID);
        }

        set userId(value: string) {
            if (value == null) {
                localStorage.removeItem(Preferences.USER_ID);
            }
            else {
                localStorage.setItem(Preferences.USER_ID, value);
            }
        }

        get token(): string {
            return localStorage.getItem(Preferences.TOKEN);
        }

        set token(value: string) {
            if (value == null) {
                localStorage.removeItem(Preferences.TOKEN);
            }
            else {
                localStorage.setItem(Preferences.TOKEN, value);
            }
        }

        get downloadOnlyOnWiFi(): boolean {
            return localStorage.getItem(Preferences.DOWNLOAD_ONLY_ON_WIFI) === "true";
        }

        set downloadOnlyOnWiFi(value: boolean) {
            if (value == null) {
                localStorage.removeItem(Preferences.DOWNLOAD_ONLY_ON_WIFI);
            }
            else {
                localStorage.setItem(Preferences.DOWNLOAD_ONLY_ON_WIFI, value.toString());
            }
        }
    }
}
