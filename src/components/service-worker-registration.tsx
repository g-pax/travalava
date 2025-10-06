"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Service worker disabled for normal web app behavior
    // If you need PWA features, re-enable this code
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log("Service Worker unregistered:", registration);
        });
      });
    }
  }, []);

  return null;
}
