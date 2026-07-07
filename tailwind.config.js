/** @type {import('tailwindcss').Config} */
// Union of the theme previously configured inline on every page via the
// cdn.tailwindcss.com runtime script. Keep in sync with the classes used
// in *.html and rebuild with `npm run build:css`.
module.exports = {
  darkMode: "class",
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed": "#e2e2e2",
        "primary-container": "#ff8c00",
        "tertiary-container": "#a9aaaa",
        "on-secondary-fixed-variant": "#474746",
        "tertiary-fixed-dim": "#c6c6c7",
        "on-surface-variant": "#564334",
        "inverse-surface": "#3a2e25",
        "outline": "#897362",
        "surface": "#fff8f5",
        "surface-container-low": "#fff1e9",
        "on-background": "#241912",
        "inverse-on-surface": "#ffede3",
        "surface-dim": "#ead6c9",
        "on-secondary": "#ffffff",
        "error-container": "#ffdad6",
        "tertiary": "#5d5f5f",
        "secondary-fixed-dim": "#c8c6c5",
        "outline-variant": "#ddc1ae",
        "error": "#ba1a1a",
        "on-tertiary": "#ffffff",
        "on-error-container": "#93000a",
        "surface-bright": "#fff8f5",
        "on-primary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#f3dfd1",
        "surface-container": "#ffeadd",
        "on-tertiary-fixed": "#1a1c1c",
        "on-error": "#ffffff",
        "primary-fixed": "#ffdcc3",
        "on-primary-fixed": "#2f1500",
        "surface-container-high": "#f9e4d7",
        "inverse-primary": "#ffb77d",
        "on-primary-container": "#623200",
        "primary-fixed-dim": "#ffb77d",
        "on-tertiary-fixed-variant": "#454747",
        "surface-container-highest": "#f3dfd1",
        "on-tertiary-container": "#3d3f3f",
        "background": "#fff8f5",
        "secondary": "#5f5e5e",
        "on-secondary-fixed": "#1c1b1b",
        "secondary-container": "#e2dfde",
        "surface-tint": "#904d00",
        "on-secondary-container": "#636262",
        "on-primary-fixed-variant": "#6e3900",
        "secondary-fixed": "#e5e2e1",
        "on-surface": "#241912",
        "primary": "#904d00"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "container-max": "1280px",
        "unit": "8px",
        "margin-edge": "32px",
        "gutter": "24px",
        "element-gap": "24px",
        "section-gap": "120px"
      },
      fontFamily: {
        "label-bold": ["Plus Jakarta Sans"],
        "body-lg": ["Plus Jakarta Sans"],
        "body-md": ["Plus Jakarta Sans"],
        "headline-lg": ["Space Grotesk"],
        "display-xl": ["Space Grotesk"],
        "headline-md": ["Space Grotesk"]
      },
      fontSize: {
        "label-bold": ["14px", { lineHeight: "1.0", letterSpacing: "0.05em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "1.7", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-lg": ["40px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "display-xl": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["28px", { lineHeight: "1.3", fontWeight: "600" }]
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
};
