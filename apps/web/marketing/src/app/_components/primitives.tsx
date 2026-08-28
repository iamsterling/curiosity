import Link from "next/link";

export function Eyebrow({
  index,
  children,
  className
}: {
  index?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}): React.JSX.Element {
  return (
    <div className={`c-eyebrow${className ? ` ${className}` : ""}`}>
      <span className="c-eyebrow-dot" />
      {index ? <span className="c-eyebrow-index">{index}</span> : null}
      <span>{children}</span>
    </div>
  );
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  className
}: {
  index?: string | undefined;
  eyebrow: string;
  title: string;
  description?: string | undefined;
  align?: "center" | "left";
  className?: string | undefined;
}): React.JSX.Element {
  return (
    <div
      className={
        align === "center"
          ? `mx-auto max-w-2xl text-center${className ? ` ${className}` : ""}`
          : `max-w-2xl${className ? ` ${className}` : ""}`
      }
    >
      <Eyebrow index={index} className={align === "center" ? "c-eyebrow--center" : undefined}>
        {eyebrow}
      </Eyebrow>
      <h2 className="c-h2 mt-4">{title}</h2>
      {description ? <p className="c-subtitle mt-4">{description}</p> : null}
    </div>
  );
}
