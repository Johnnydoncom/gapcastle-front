import logoImg from "@/assets/gapcastle-logo.png";

export const Logo = ({ className = "", variant = "full" }: { className?: string; variant?: "full" | "mark" }) => (
  <div className={`flex items-center ${className}`}>
    <img
      src={logoImg.src}
      alt="GapCastle — your bridge to financial gap"
      className={variant === "mark" ? "h-9 w-auto" : "h-10 w-auto"}
    />
  </div>
);
