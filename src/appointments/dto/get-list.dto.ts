import { Transform } from "class-transformer"

export class GetListDto{
    query?:string
    @Transform(({value})=>JSON.parse(value))
    status?:string
}