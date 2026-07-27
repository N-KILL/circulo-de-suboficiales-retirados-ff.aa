/**
 * Frontend error logger — captures unhandled errors and sends them to the backend.
 * The backend logs them via tracing into the same app.log.
 */
export function initFrontendErrorLogger() {
  // 1. Global uncaught errors
  window.onerror = (message, source, lineno, colno, error) => {
    sendError({
      type: "window.onerror",
      message: String(message),
      source: source ?? undefined,
      line: lineno ?? undefined,
      column: colno ?? undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  };

  // 2. Unhandled Promise Rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    sendError({
      type: "unhandledrejection",
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  // 3. React error boundary integration
  // Call `logFrontendError(error, errorInfo)` from componentDidCatch
}

export function logFrontendError(error: Error, componentStack?: string) {
  sendError({
    type: "react_error_boundary",
    message: error.message,
    stack: error.stack,
    component: componentStack,
  });
}

interface FrontendError {
  type: string;
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  component?: string;
}

function sendError(err: FrontendError) {
  try {
    const payload = {
      ...err,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Use sendBeacon for reliability (works even during page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/frontend-errors", blob);
    } else {
      fetch("/api/frontend-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silently fail — never crash the app
  }
}
