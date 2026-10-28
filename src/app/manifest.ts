import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NRL People",
    short_name: "NRL People",
    description: "HRMS for Numaligarh Refinery Limited. Works offline in plant areas with poor signal.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fb",
    theme_color: "#3d5afe",
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Kiosk", url: "/kiosk", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Attendance", url: "/time", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
