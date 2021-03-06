namespace JustinCredible.TheWeek.Models {

    export class MagazineIssue {
        public id: string;
        public title: string;
        public summary: string;
        public imageURL: string;
        public size: string;

        public updated: moment.Moment;
        public published: moment.Moment;

        public isFutureIssue: boolean;
    }
}
