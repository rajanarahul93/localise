import { useEffect } from "react";

export function usePerformance() {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      const links = [
        "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      ];

      links.forEach((href) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = href;
        link.as = "style";
        document.head.appendChild(link);
      });
    };

    // Lazy load non-critical resources
    const lazyLoadResources = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          preloadCriticalResources();
        });
      } else {
        setTimeout(preloadCriticalResources, 1000);
      }
    };

    lazyLoadResources();

    // Performance monitoring
    if ("performance" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "navigation") {
            console.log("Navigation timing:", entry);
          }
        });
      });

      observer.observe({ entryTypes: ["navigation"] });

      return () => observer.disconnect();
    }
  }, []);
}