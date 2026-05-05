export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f13",
        surface: "#1a1a24",
        accent: "#37e754",
        "accent-light": "#71e083",
        text: "#e8e6f0",
        muted: "#888888",
        border: "#2a2a38",
        error: "#f87171",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};