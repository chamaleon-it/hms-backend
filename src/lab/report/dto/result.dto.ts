export class ResultDto {
    _id: string;
    name: {
        _id: string;
        value: string | number;
        name: string;
    }[];
}