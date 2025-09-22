import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { createPortal } from "react-dom"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return typeof document !== "undefined"
    ? createPortal(
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group fixed z-[999999] pointer-events-auto"
        style={{
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          zIndex: 100000,
        } as React.CSSProperties}
        {...props}
      />,
      document.body
    )
    : null
}

export { Toaster }
