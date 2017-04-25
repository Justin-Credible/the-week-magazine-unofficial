
namespace JustinCredible.TheWeek {

    export class Application {

        //#region Injection

        public static ID = "Application";

        public static get $inject(): string[] {
            return [
                "$rootScope",
                "$window",
                "$location",
                "$state",
                "$ionicHistory",
                Services.Plugins.ID,
                Services.Platform.ID,
                Services.Compatibility.ID,
                Services.UIHelper.ID,
                Services.Configuration.ID,
                Services.Logger.ID,
            ];
        }

        constructor(
            private $rootScope: ng.IRootScopeService,
            private $window: ng.IWindowService,
            private $location: ng.ILocationService,
            private $state: angular.ui.IStateService,
            private $ionicHistory: ionic.navigation.IonicHistoryService,
            private Plugins: Services.Plugins,
            private Platform: Services.Platform,
            private Compatibility: Services.Compatibility,
            private UIHelper: Services.UIHelper,
            private Configuration: Services.Configuration,
            private Logger: Services.Logger) {
        }

        //#endregion

        //#region Private Instance Variables

        /**
         * The root Angular application module.
         */
        private _ngModule: ng.IModule;

        /**
         * Keeps track of the application being in the background or not.
         * This flag is updated via the pause and resume handlers.
         */
        private _appIsInBackground: boolean = false;

        //#endregion

        //#region Public Methods

        /**
         * Used to set the Angular module for the application.
         */
        public setAngularModule(ngModule: ng.IModule): void {
            this._ngModule = ngModule;
        }

        public start(): void {

            // Set the default error handler for all uncaught exceptions.
            this.$window.onerror = _.bind(this.window_onerror, this);

            // Subscribe to device events.
            if (this.Platform.web) {
                document.addEventListener(this.Compatibility.visibilityChangeEventName, _.bind(this.document_visibilitychange, this));
            }
            else {
                document.addEventListener("pause", _.bind(this.device_pause, this));
                document.addEventListener("resume", _.bind(this.device_resume, this));
                document.addEventListener("menubutton", _.bind(this.device_menuButton, this));
            }

            // Subscribe to Angular events.
            this.$rootScope.$on("$locationChangeStart", _.bind(this.angular_locationChangeStart, this));

            // We use this combination of settings so prevent the visual jank that
            // would otherwise occur when tapping an input that shows the keyboard.
            this.Plugins.keyboard.disableScroll(true);
            this.Plugins.keyboard.hideKeyboardAccessoryBar(false);

            // Now that the platform is ready, we'll delegate to the resume handler.
            // We do this so the same code that fires on resume also fires when the
            // application is started for the first time.
            this.resume(true);
        }

        //#endregion

        //#region Application Pause and Resume Handlers

        /**
         * To be used when the app is being pushed into the background.
         */
        private pause(): void {
            this._appIsInBackground = true;
        }

        /**
         * To be used when the application is resuming from the background or starting up
         * from a cold boot.
         * 
         * @param coldBoot True if the application is starting up, false if resuming from background.
         */
        private resume(coldBoot: boolean): void {

            this._appIsInBackground = false;

            var isOnDefaultView = this.$location.url() === "/app/blank";

            if (isOnDefaultView) {
                this.$ionicHistory.nextViewOptions({ disableAnimate: true, disableBack: true });
                this.$state.go("app.magazine-list", null, { location: "replace" });
            }
        }

        //#endregion

        //#region Event Handlers

        /**
         * Fired when the document or window's visibility changes (for example, when the user
         * switches tabs in the browser or minimizes the window).
         * 
         * This is only applicable when the app is running in a standard web browser.
         */
        private document_visibilitychange(): void {

            if (this.Compatibility.isDocumentHidden) {
                this.pause();
            }
            else {
                this.resume(false);
            }
        }

        /**
         * Fired when the menu hard (or soft) key is pressed on the device (eg Android menu key).
         * This isn't used for iOS devices because they do not have a menu button key.
         */
        private device_menuButton(): void {
            // Broadcast this event to all child scopes. This allows controllers for individual
            // views to handle this event and show a contextual menu etc.
            this.$rootScope.$broadcast(Constants.Events.APP_MENU_BUTTON);
        }

        /**
         * Fired when the OS decides to minimize or pause the application. This usually
         * occurs when the user presses the device's home button or switches applications.
         * 
         * This is only applicable when the app is running in a Cordova container.
         */
        private device_pause(): void {
            this.pause();
        }

        /**
         * Fired when the OS restores an application to the foreground. This usually occurs
         * when the user launches an app that is already open or uses the OS task manager
         * to switch back to the application.
         * 
         * This is only applicable when the app is running in a Cordova container.
         */
        private device_resume(): void {
            this.resume(false);
        }

        /**
         * Fired when Angular's route/location (eg URL hash) is changing.
         */
        private angular_locationChangeStart(event: ng.IAngularEvent, newRoute: string, oldRoute: string): void {

            // Chop off the long "file://..." prefix (we only care about the hash tag).
            newRoute = newRoute.substring(newRoute.indexOf("#"));
            oldRoute = oldRoute.substring(oldRoute.indexOf("#"));

            this.Logger.debug("Application", "angular_locationChangeStart", "Angular location changed.", {
                oldRoute: oldRoute,
                newRoute: newRoute
            });
        };

        //#endregion

        //#region Error Handlers

        /**
         * Fired when an unhandled JavaScript exception occurs outside of Angular.
         */
        private window_onerror(message: any, uri: string, lineNumber: number, columnNumber?: number): void {

            // Log the exception using the built-in logger.
            try {
                this.Logger.error("Application", "window_onerror", message, {
                    uri: uri,
                    lineNumber: lineNumber,
                    columnNumber: columnNumber
                });
            }
            catch (ex) {
                // If logging failed there is no use trying to log the failure.
            }

            // Alert the user to the error.
            try {
                // Show a generic message to the user.
                this.Plugins.toast.showLongBottom("An error has occurred; please try again.");

                // If this exception occurred in the HttpInterceptor, there may still be a progress indicator on the scrren.
                this.Plugins.spinner.activityStop();
            }
            catch (ex) {
                this.Logger.warn("Application", "window_onerror", "There was a problem alerting the user to an Angular error; falling back to a standard alert().", ex);
                alert("An error has occurred; please try again.");
            }
        }

        /**
         * Fired when an exception occurs within Angular.
         * 
         * This includes uncaught exceptions in ng-click methods for example.
         * 
         * This is public so it can be registered via Boot2.ts.
         */
        public angular_exceptionHandler(exception: Error, cause: string): void {

            var message = exception.message;

            if (!message) {
                message = "An unknown error ocurred in an Angular event.";
            }

            if (!cause) {
                cause = "[Unknown]";
            }

            // Log the exception using the built-in logger.
            try {
                this.Logger.error("Application", "angular_exceptionHandler", message, {
                    cause: cause,
                    exception: exception
                });
            }
            catch (ex) {
                // If logging failed there is no use trying to log the failure.
            }

            // Alert the user to the error.
            try {
                // Show a generic message to the user.
                this.Plugins.toast.showLongBottom("An error has occurred; please try again.");

                // If this exception occurred in the HttpInterceptor, there may still be a progress indicator on the scrren.
                this.Plugins.spinner.activityStop();
            }
            catch (ex) {
                this.Logger.warn("Application", "angular_exceptionHandler", "There was a problem alerting the user to an Angular error; falling back to a standard alert().", ex);
                alert("An error has occurred; please try again.");
            }
        }

        //#endregion
    }
}
