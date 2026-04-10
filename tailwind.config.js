/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // RemiX Design Tokens
        hellfire:  "#FF003C",
        ember:     "#FF2D55",
        crimson:   "#8B0000",
        blood:     "#B11226",
        violet:    "#7C3AED",
        arcane:    "#9D4EDD",
        plasma:    "#C77DFF",
        void:      "#07070d",
        pit:       "#0d0d18",
        chamber:   "#121220",
        dungeon:   "#181828",
        bone:      "#8888aa",
        ghost:     "#ccccee",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body:    ['Rajdhani', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shine": {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(255,0,60,0.4)" },
          "50%":       { boxShadow: "0 0 25px rgba(255,0,60,0.8), 0 0 50px rgba(124,58,237,0.3)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shine": "shine 8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 12s linear infinite",
      },
      backgroundImage: {
        "hellfire-gradient": "linear-gradient(135deg, #8B0000, #FF003C, #7C3AED)",
        "blood-gradient": "linear-gradient(135deg, #8B0000, #B11226)",
        "void-gradient": "linear-gradient(to bottom, #07070d, #0d0d18)",
        "card-gradient": "linear-gradient(135deg, rgba(18,18,32,0.9), rgba(24,24,40,0.6))",
      },
      boxShadow: {
        "glow-red":    "0 0 20px rgba(255,0,60,0.35), 0 0 60px rgba(255,0,60,0.1)",
        "glow-violet": "0 0 20px rgba(124,58,237,0.35), 0 0 60px rgba(124,58,237,0.1)",
        "glow-mixed":  "0 0 28px rgba(255,0,60,0.22), 0 0 60px rgba(124,58,237,0.12)",
        "card":        "0 4px 24px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
