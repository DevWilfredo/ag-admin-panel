import { TransactionsScreen } from "@/features/transactions/transactions-screen";

export default function TransactionsLoading() {
  return <TransactionsScreen state={{ status: "loading" }} />;
}
