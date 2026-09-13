import { ProtectedRoute } from "@/features/auth/protected-route";
import { SearchResultsClient } from "@/features/search/search-results-client";

export default function SearchPage() {
  return <ProtectedRoute capability="view:dashboard"><SearchResultsClient /></ProtectedRoute>;
}
