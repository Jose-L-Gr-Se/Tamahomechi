import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tamahomechi",
    short_name: "Tamahomechi",
    description: "El Tamagotchi de tu hogar",
    start_url: "/hoy",
    display: "standalone",
    background_color: "#f7f2eb",
    theme_color: "#c06a3e",
    orientation: "portrait",
    icons: [
      // Vector icon — preferred by modern browsers, scales perfectly.
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // Maskable hint for Android adaptive icons (uses the same SVG;
      // safe-zone is preserved by the rounded-tile background in LogoMark).
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
