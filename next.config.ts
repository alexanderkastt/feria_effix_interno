import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cachea segmentos de página en el navegador (Client Router Cache) para
    // que navegar entre pantallas ya visitadas sea instantáneo en vez de
    // volver a pedirle todo al servidor. 30s alcanza para que se sienta
    // rápido sin arriesgar mostrar datos viejos por mucho tiempo — y para
    // los módulos con Realtime, un cambio real fuerza un refresh explícito
    // que ignora esta caché igual.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
