export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={`reveal max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="display mt-3 text-[2.125rem] text-paper sm:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-5 text-base leading-relaxed text-mist sm:text-lg">{subtitle}</p>}
    </div>
  );
}
