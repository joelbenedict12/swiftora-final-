import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
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
          glow: "hsl(var(--primary-glow))",
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
        logistics: {
          blue: "hsl(var(--logistics-blue))",
          cyan: "hsl(var(--logistics-cyan))",
          navy: "hsl(var(--logistics-navy))",
          light: "hsl(var(--logistics-light))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.9)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "slide-in-right": {
          "0%": {
            transform: "translateX(100px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-20px)",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
        "paper-plane-fly": {
          "0%, 100%": {
            transform: "translate(0, 0) rotate(-45deg)",
          },
          "50%": {
            transform: "translate(40px, -40px) rotate(-45deg)",
          },
        },
        "paper-plane-fly-delayed": {
          "0%, 100%": {
            transform: "translate(0, 0) rotate(-45deg)",
          },
          "50%": {
            transform: "translate(-40px, 40px) rotate(-45deg)",
          },
        },
        "paper-plane-float": {
          "0%, 100%": {
            transform: "translateY(0) rotate(-45deg)",
            opacity: "0.3",
          },
          "50%": {
            transform: "translateY(-50px) rotate(-45deg)",
            opacity: "0.6",
          },
        },
        "paper-plane-spin": {
          "0%": {
            transform: "rotate(0deg) scale(1)",
            opacity: "0.2",
          },
          "50%": {
            transform: "rotate(180deg) scale(1.3)",
            opacity: "0.5",
          },
          "100%": {
            transform: "rotate(360deg) scale(1)",
            opacity: "0.2",
          },
        },
        "trail-1": {
          "0%": {
            transform: "translateX(-100%) scaleX(0.5)",
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateX(100%) scaleX(0.5)",
            opacity: "0",
          },
        },
        "trail-2": {
          "0%": {
            transform: "translateX(100%) scaleX(0.5)",
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateX(-100%) scaleX(0.5)",
            opacity: "0",
          },
        },
        "trail-3": {
          "0%": {
            transform: "translateX(-50%) scaleX(0.3)",
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateX(150%) scaleX(0.3)",
            opacity: "0",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "200% 0",
          },
          "100%": {
            backgroundPosition: "-200% 0",
          },
        },
        "glow-pulse": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px hsl(180 100% 50% / 0.4), 0 0 40px hsl(180 100% 50% / 0.2)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 30px hsl(180 100% 50% / 0.6), 0 0 60px hsl(180 100% 50% / 0.3)",
          },
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-in-center": {
          "0%": {
            opacity: "0",
            transform: "scale(0.9)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out",
        "scale-in": "scale-in 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.6s ease-out",
        "float": "float 3s ease-in-out infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "paper-plane-fly": "paper-plane-fly 8s ease-in-out infinite",
        "paper-plane-fly-delayed": "paper-plane-fly-delayed 10s ease-in-out infinite",
        "paper-plane-float": "paper-plane-float 6s ease-in-out infinite",
        "paper-plane-spin": "paper-plane-spin 15s linear infinite",
        "trail-1": "trail-1 4s ease-in-out infinite",
        "trail-2": "trail-2 5s ease-in-out infinite",
        "trail-3": "trail-3 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.5s ease-out",
        "scale-in-center": "scale-in-center 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
