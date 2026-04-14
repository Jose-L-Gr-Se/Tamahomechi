import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hogar",
    short_name: "Hogar",
    description: "Hub doméstico compartido para tu hogar",
    start_url: "/hoy",
    display: "standalone",
    background_color: "#f7f3ef",
    theme_color: "#c06a3e",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
