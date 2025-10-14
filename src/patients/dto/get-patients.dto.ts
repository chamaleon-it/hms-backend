export class GetPatientsDto {
  query?: string;

  page: number = 1;

  limit: number = 100;
}
