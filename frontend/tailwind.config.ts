import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        saffron: "#fca311",
        mist: "#edf2f4",
        mint: "#b7e4c7",
        coral: "#ff6b6b"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 45px rgba(20, 33, 61, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
