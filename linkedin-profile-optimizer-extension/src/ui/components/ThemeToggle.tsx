import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../theme/useTheme";
import { IconButton } from "./IconButton";

interface Props {
  className?: string;
  size?: "sm" | "md";
}

/**
 * Single-icon theme switcher — shows the icon for the theme the click
 * will switch to. Matches the rest of the header IconButton row instead
 * of a wide segmented pill.
 */
export function ThemeToggle({ className = "", size = "md" }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = `Switch to ${isDark ? "light" : "dark"} theme`;
  const iconCls = size === "sm" ? "h-[19px] w-[19px]" : "h-[21px] w-[21px]";

  return (
    <IconButton
      size={size}
      onClick={toggle}
      title={label}
      ariaLabel={label}
      className={className}
    >
      <Icon className={iconCls} aria-hidden="true" />
    </IconButton>
  );
}

export type { Theme };
