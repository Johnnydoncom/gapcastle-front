export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: { eyebrow?: string; title: React.ReactNode; subtitle?: string; align?: "center" | "left" }) => (
  <div className={align === "center" ? "mx-auto max-w-2xl text-center animate-fade-in-up" : "max-w-2xl animate-fade-in-up"}>
    {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
    <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">{title}</h2>
    {subtitle && <p className="mt-4 text-base text-muted-foreground md:text-lg">{subtitle}</p>}
  </div>
);

export const PageHero = ({
  eyebrow, title, subtitle, children,
}: { eyebrow: string; title: React.ReactNode; subtitle?: string; children?: React.ReactNode }) => (
  <section className="relative overflow-hidden border-b">
    <div className="absolute inset-0 -z-10 gradient-mesh" />
    <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
    <div className="absolute -bottom-24 -left-24 -z-10 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
    <div className="container py-20 md:py-28 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary animate-fade-in">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl animate-fade-in-up">{title}</h1>
      {subtitle && <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: "120ms" }}>{subtitle}</p>}
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>{children}</div>}
    </div>
  </section>
);
