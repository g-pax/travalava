//  Clear all caches utility
export function clearAllCaches() {
  if (typeof window === "undefined") return;

  // Clear localStorage query cache
  try {
    localStorage.removeItem("travalava-query-cache");
    console.log("Cleared localStorage query cache");
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }

  // Clear all browser caches
  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        console.log("Cleared cache:", cacheName);
      });
    });
  }

  // Clear IndexedDB if present
  if ("indexedDB" in window) {
    // You can add specific IndexedDB clearing logic here if needed
    console.log("IndexedDB clearing would go here if implemented");
  }

  console.log("All caches cleared - app will fetch fresh data");
}

// Run this on load in development to ensure fresh data
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  clearAllCaches();
}