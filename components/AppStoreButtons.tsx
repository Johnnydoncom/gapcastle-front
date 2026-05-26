import { Apple, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export const AppStoreButtons = ({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) => {
  const base =
    "group inline-flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-elegant";
  const styles =
    variant === "dark"
      ? "bg-foreground text-background border border-foreground/10"
      : "bg-card text-foreground border border-border";

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <a href="#" aria-label="Download on the App Store" className={cn(base, styles)}>
        <Apple className="h-7 w-7" />
        <div className="flex flex-col leading-tight text-left">
          <span className="text-[10px] uppercase tracking-wider opacity-70">Download on the</span>
          <span className="text-sm font-semibold">App Store</span>
        </div>
      </a>
      <a href="#" aria-label="Get it on Google Play" className={cn(base, styles)}>
        <Play className="h-6 w-6 fill-current" />
        <div className="flex flex-col leading-tight text-left">
          <span className="text-[10px] uppercase tracking-wider opacity-70">Get it on</span>
          <span className="text-sm font-semibold">Google Play</span>
        </div>
      </a>
    </div>
  );
};
