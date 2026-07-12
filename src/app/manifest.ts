import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FormLab Fitness",
    short_name: "FormLab",
    description: "Fitness logging, planning and projections.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#0d5c63",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
