"use client";
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[sw-registrar] service worker registration failed:", err);
      });
    }
  }, []);
  return null;
}
