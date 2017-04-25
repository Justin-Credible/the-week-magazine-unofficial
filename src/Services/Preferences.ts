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

        //#endregion

        //#region User ID/Token

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

        //#endregion
    }
}
