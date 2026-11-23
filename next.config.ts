import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Los avatares de la API ya son JPEG pequeños (300×300) servidos por Cloudflare con caché de 90 días.
    // Pasarlos por el optimizador de Next hace que el servidor los pida todos desde una sola IP, y la API
    // responde 429 (Too Many Requests) en cuanto se hace scroll. Sin optimizar, cada navegador los descarga
    // directamente de la CDN, con su propia IP y su propia caché.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rickandmortyapi.com",
        pathname: "/api/character/avatar/**",
      },
    ],
  },
};

export default nextConfig;
