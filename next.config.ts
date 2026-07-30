import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "loca.lt", 
    "trycloudflare.com", 
    "ngrok-free.app", 
    "pinggy.io", 
    "*.trycloudflare.com",
    "192.168.29.106",
    "addressed-miracle-marking-metallica.trycloudflare.com"
  ]
};

export default nextConfig;
