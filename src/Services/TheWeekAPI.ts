namespace JustinCredible.TheWeek.Services {

    export class TheWeekAPI {

        //#region Injection

        public static ID = "TheWeekAPI";

        public static get $inject(): string[] {
            return [
                "$q",
                "$http",
                Logger.ID,
            ];
        }

        constructor (
            private $q: ng.IQService,
            private $http: ng.IHttpService,
            private Logger: Services.Logger) {
        }

        //#endregion

        public retrieveIssueFeed(): ng.IPromise<Interfaces.API.Feed> {
            let q = this.$q.defer<Interfaces.API.Feed>();

            let config: Interfaces.RequestConfig = {
                method: "GET",
                url: "https://magazine.theweek.com/endpoint.xml",
                blocking: false,
            };

            this.$http(config).then((result: ng.IHttpPromiseCallbackArg<any>) => {

                let converter = new X2JS();
                let endpointResponse: Interfaces.API.EndpointResponse = converter.xml_str2json(result.data);

                this.Logger.info(TheWeekAPI.ID, "retrieveIssueFeed", "Parsed endpoint XML result.", endpointResponse);

                q.resolve(endpointResponse.feed);

            }).catch((error: any) => {

                q.reject(error);

            });

            return q.promise;
        }
    }
}
