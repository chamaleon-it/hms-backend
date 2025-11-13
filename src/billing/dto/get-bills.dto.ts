export class GetBillisDto {
  q?: string;
  method?: 'Cash' | 'Online' | 'Insurance';
  status?: 'Paid' | 'Partial' | 'Unpaid';
  date?: string;
}
