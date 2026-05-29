import type { CSSProperties } from "react";

interface Props {
  orientation?: "horizontal" | "vertical";
  className?: string;
  style?: CSSProperties;
}

export function Divider({
  orientation = "horizontal",
  className = "",
  style,
}: Props) {
  const base =
    orientation === "horizontal"
      ? "h-px w-full"
      : "h-full w-px self-stretch";
  return (
    <span
      role="separator"
      aria-orientation={orientation}
      className={`${base} ${className}`}
      style={{ background: "var(--rz-border)", ...style }}
    />
  );
}
