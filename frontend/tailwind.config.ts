import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#ECEAE8",
        card: "#FFFFFF",
        blush: "#FFDBDA",
        rose: "#DB7F8E",
        roseDeep: "#C2667A",
        slate: "#D5C5C8",
        steel: "#9DA3A4",
        taupe: "#604D53",
        ink: "#43383C",
        line: "rgba(157,163,164,0.45)",
        lineSoft: "rgba(157,163,164,0.26)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      boxShadow: {
        panel: "0 22px 44px rgba(96, 77, 83, 0.08)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.55)"
      }
    }
  },
  plugins: []
};

export default config;
