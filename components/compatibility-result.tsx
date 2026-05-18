import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { CompatibilityResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompatibilityResultPanel({ result }: { result: CompatibilityResult }) {
  const palette =
    result.verdict === "compatible"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : result.verdict === "maybe"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
      : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300";

  const Icon =
    result.verdict === "compatible"
      ? CheckCircle2
      : result.verdict === "maybe"
      ? AlertTriangle
      : XCircle;

  const label =
    result.verdict === "compatible"
      ? "Compatible"
      : result.verdict === "maybe"
      ? "Maybe compatible"
      : "Not compatible";

  return (
    <div className={cn("rounded-lg border p-4", palette)}>
      <div className="flex items-center gap-2 text-base font-semibold">
        <Icon className="h-5 w-5" />
        {label} <span className="font-normal opacity-80">— {Math.round(result.confidence * 100)}% confidence</span>
      </div>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {result.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
