// Performance monitoring utilities

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  domContentLoaded?: number;
  loadComplete?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initWebVitals();
    this.initResourceMonitoring();
  }

  private initWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      this.metrics.fcp = lastEntry.startTime;
    }).observe({ entryTypes: ["paint"] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      this.metrics.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      this.metrics.fid = lastEntry.processingStart - lastEntry.startTime;
    }).observe({ entryTypes: ["first-input"] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries() as any[];
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cls = clsValue;
    }).observe({ entryTypes: ["layout-shift"] });

    // Navigation Timing
    if (typeof window !== "undefined" && "performance" in window) {
      window.addEventListener("load", () => {
        const navigation = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;
        this.metrics.loadComplete =
          navigation.loadEventEnd - navigation.loadEventStart;
      });
    }
  }

  private initResourceMonitoring() {
    // Monitor resource loading
    new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      entries.forEach((entry) => {
        // Log slow resources (>1s)
        if (entry.duration > 1000) {
          console.warn(`Slow resource: ${entry.name} took ${entry.duration}ms`);
        }
      });
    }).observe({ entryTypes: ["resource"] });
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public logMetrics() {
    console.group("🚀 Performance Metrics");
    console.log(
      "FCP:",
      this.metrics.fcp ? `${this.metrics.fcp.toFixed(2)}ms` : "Not measured",
    );
    console.log(
      "LCP:",
      this.metrics.lcp ? `${this.metrics.lcp.toFixed(2)}ms` : "Not measured",
    );
    console.log(
      "FID:",
      this.metrics.fid ? `${this.metrics.fid.toFixed(2)}ms` : "Not measured",
    );
    console.log(
      "CLS:",
      this.metrics.cls ? this.metrics.cls.toFixed(4) : "Not measured",
    );
    console.log(
      "TTFB:",
      this.metrics.ttfb ? `${this.metrics.ttfb.toFixed(2)}ms` : "Not measured",
    );
    console.groupEnd();
  }

  public reportToAnalytics() {
    // Send metrics to analytics service
    if (typeof window !== "undefined" && "gtag" in window) {
      const metrics = this.getMetrics();
      (window as any).gtag("event", "web_vitals", {
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
      });
    }
  }
}

// Bundle size monitoring
export const monitorBundleSize = () => {
  if (typeof window !== "undefined" && "performance" in window) {
    // Monitor transferred size vs decoded size
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const scripts = resources.filter((r) => r.initiatorType === "script");

    scripts.forEach((script) => {
      const compressionRatio = (
        (script.transferSize / script.decodedBodySize) *
        100
      ).toFixed(2);
      console.log(`Script: ${script.name}`);
      console.log(
        `  Transfer size: ${(script.transferSize / 1024).toFixed(2)} KB`,
      );
      console.log(
        `  Decoded size: ${(script.decodedBodySize / 1024).toFixed(2)} KB`,
      );
      console.log(`  Compression ratio: ${compressionRatio}%`);
    });
  }
};

// Lazy loading utilities
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
) => {
  const LazyComponent = React.lazy(importFunc);

  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <React.Suspense fallback={fallback || <div>Loading...</div>}>
      {/* @ts-expect-error - Complex generic inference with React.lazy */}
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ));
};

// Image optimization utilities
export const getOptimizedImageProps = (
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    priority?: boolean;
  } = {},
) => {
  const { width = 800, height, quality = 75, priority = false } = options;

  return {
    src,
    alt,
    width,
    height,
    quality,
    priority,
    placeholder: "blur" as const,
    blurDataURL: `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height || width}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/></svg>`,
    ).toString("base64")}`,
  };
};

// Cache utilities
export class CacheManager {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set(key: string, data: any, ttl: number = 300000): void {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const globalCache = new CacheManager();

// React performance utilities
export const usePerformanceMark = (name: string) => {
  React.useEffect(() => {
    if (typeof window !== "undefined" && "performance" in window) {
      performance.mark(`${name}-start`);

      return () => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);

        const measure = performance.getEntriesByName(name)[0];
        if (measure && measure.duration > 100) {
          // Log if > 100ms
          console.warn(
            `Slow component render: ${name} took ${measure.duration.toFixed(2)}ms`,
          );
        }
      };
    }
  }, [name]);
};

// Singleton performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring
if (typeof window !== "undefined") {
  // Log metrics on page load
  window.addEventListener("load", () => {
    setTimeout(() => {
      performanceMonitor.logMetrics();
      performanceMonitor.reportToAnalytics();
      monitorBundleSize();
    }, 1000);
  });
}

// Re-export React for convenience
import React from "react";
