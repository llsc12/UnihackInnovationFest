import { Badge } from "@/components/ui/badge";
import type { TrustScoreResult } from "@/lib/types";

export function TrustScoreBadge({
  score,
  band,
}: {
  score: number;
  band: TrustScoreResult["band"];
}) {
  const variant = band === "high" ? "success" : band === "medium" ? "warning" : "destructive";
  return <Badge variant={variant}>Trust {score}/100</Badge>;
}
