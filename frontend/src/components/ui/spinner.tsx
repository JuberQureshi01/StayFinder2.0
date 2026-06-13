import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-gray-400", sizeMap[size])} />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </span>
  );
}

function PageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

export { Spinner, PageSpinner };
