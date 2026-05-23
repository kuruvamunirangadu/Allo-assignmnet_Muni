import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07111f"
        }
      },
      boxShadow: {
        glow: "0 20px 60px rgba(68, 106, 255, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
