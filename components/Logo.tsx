import Image from "next/image";
import logoImg from "@/assets/gapcastle-logo.png";

export const Logo = ({ className = "", variant = "full" }: { className?: string; variant?: "full" | "mark" }) => (
  <div className={`flex items-center ${className}`}>
    <Image
      src={logoImg}
      alt="Gap Castle"
      className={variant === "mark" ? "h-9 w-auto" : "h-10 w-auto"}
    />
  </div>
);
