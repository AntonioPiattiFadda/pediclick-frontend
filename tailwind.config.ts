// import type { Config } from "tailwindcss";

// export default {
//   content: [
//     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     extend: {
//       width: {
//         "progressModalsWidth": "var(--progress-modals-width)",
//       },
//       height: {
//         "staticsToolsContainerHeight": "var(--statics-tools-height)",
//       },
//       colors: {
//         newBackground: "hsl(var(--newBackground))",
//         newTextColor : "hsl(var(--newTextColor))",
//         newPrimaryTextColor: "hsl(var(--newPrimaryTextColor))",
//         newBoxShadow: "var(--newTextColor)",
//         modalSecontaryTextColor: "hsl(var(--modalSecontaryTextColor))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         card: "hsl(var(--card))",
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover))",
//           foreground: "hsl(var(--popover-foreground))",
//         },
//       },
     
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
      
//       keyframes: {
//         "accordion-down": {
//           from: {
//             height: "0",
//           },
//           to: {
//             height: "var(--radix-accordion-content-height)",
//           },
//         },
//         "accordion-up": {
//           from: {
//             height: "var(--radix-accordion-content-height)",
//           },
//           to: {
//             height: "0",
//           },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//       },
//       sidebar: {
//         DEFAULT: "hsl(var(--sidebar-background))",
//         foreground: "hsl(var(--sidebar-foreground))",
//         primary: "hsl(var(--sidebar-primary))",
//         "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
//         accent: "hsl(var(--sidebar-accent))",
//         "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
//         border: "hsl(var(--sidebar-border))",
//         ring: "hsl(var(--sidebar-ring))",
//       },
//     },
//   },
//   // eslint-disable-next-line @typescript-eslint/no-require-imports
//   plugins: [require("tailwindcss-animate")],
// } satisfies Config;
