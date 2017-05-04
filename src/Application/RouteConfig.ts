
namespace JustinCredible.TheWeek {

    /**
     * Used to define all of the client-side routes for the application.
     * This maps routes to the controller/view that should be used.
     */
    export class RouteConfig {

        public static setupRoutes($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider): void {

            // Setup an abstract state for the tabs directive.
            $stateProvider.state("app", {
                url: "/app",
                abstract: true,
                templateUrl: "Views/Root/Root.html",
                controller: Controllers.RootController.ID
            });

            // An blank view useful as a place holder etc.
            $stateProvider.state("app.blank", {
                url: "/blank",
                views: {
                    "root-view": {
                        templateUrl: "Views/Blank.html"
                    }
                }
            });

            $stateProvider.state("app.magazine-list", {
                url: "/magazine/list",
                views: {
                    "root-view": {
                        templateUrl: "Views/Magazine-List/Magazine-List.html",
                        controller: Controllers.MagazineListController.ID,
                    }
                }
            });

            //#region Settings

            $stateProvider.state("app.developer", {
                url: "/settings/developer",
                views: {
                    "root-view": {
                        templateUrl: "Views/Settings/Developer/Developer.html",
                        controller: Controllers.DeveloperController.ID
                    }
                }
            });

            $stateProvider.state("app.logs", {
                url: "/settings/logs",
                views: {
                    "root-view": {
                        templateUrl: "Views/Settings/Logs-List/Logs-List.html",
                        controller: Controllers.LogsListController.ID
                    }
                }
            });

            $stateProvider.state("app.log-entry", {
                url: "/settings/log-entry/:id",
                params: {
                    id: {
                        value: "",
                        squash: false
                    }
                },
                views: {
                    "root-view": {
                        templateUrl: "Views/Settings/Log-Entry/Log-Entry.html",
                        controller: Controllers.LogEntryController.ID
                    }
                }
            });

            $stateProvider.state("app.about", {
                url: "/settings/about",
                views: {
                    "root-view": {
                        templateUrl: "Views/Settings/About/About.html",
                        controller: Controllers.AboutController.ID
                    }
                }
            });

            //#endregion

            // If none of the above states are matched, use the blank route.
            $urlRouterProvider.otherwise("/app/blank");
        }
    }
}
