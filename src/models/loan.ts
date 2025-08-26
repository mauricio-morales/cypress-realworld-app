export enum LoanStatus {
  active = "active",
  paid = "paid",
}

export interface Loan {
  id: string;
  uuid: string;
  borrowerId: string;
  lenderId: string;
  amount: number;
  outstandingBalance: number;
  interestRate: number;
  term: number;
  status: LoanStatus;
  createdAt: Date;
  modifiedAt: Date;
}
