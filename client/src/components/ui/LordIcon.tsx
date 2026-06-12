import { LORDICON_COLORS, LORDICON_PATHS, type LordIconColor, type LordIconName } from "../../lib/lordicons";

export interface LordIconProps {
  name: LordIconName;
  size?: number;
  trigger?: "hover" | "click" | "loop" | "loop-on-hover" | "morph" | "in";
  color?: LordIconColor;
  colors?: string;
  state?: string;
  className?: string;
}

export function LordIcon({
  name,
  size = 24,
  trigger = "hover",
  color = "blue",
  colors,
  state,
  className = "",
}: LordIconProps) {
  const src = LORDICON_PATHS[name];
  const resolvedColors = colors ?? LORDICON_COLORS[color];

  return (
    <lord-icon
      src={src}
      trigger={trigger}
      colors={resolvedColors}
      state={state}
      stroke="light"
      style={{ width: size, height: size, display: "inline-block" }}
      className={className}
    />
  );
}

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          trigger?: string;
          colors?: string;
          stroke?: string;
          state?: string;
        },
        HTMLElement
      >;
    }
  }
}
