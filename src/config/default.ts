import DefaultWallpaper from "../assets/wallpaper/Ixora.jpeg";

export const defaultConfig = {
  ui: {
    wallpaper: {
      path: DefaultWallpaper,
      fit: "cover", // หรือ "contain", "fill", "stretch", "center"
      blur: false,
      opacity: 1.0,
      darkOverlay: false,
    },
  },
  theme: {
    mode: "light", // "dark" | "light" | "auto"
    accentColor: "#00BFFF", // ตัวอย่างสี accent
  },
} as const;
