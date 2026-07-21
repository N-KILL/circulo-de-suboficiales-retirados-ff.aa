declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      isElectron: boolean;
    };
  }
}

function getApiBaseUrl(): string {
  if (window.electronAPI?.isElectron && import.meta.env.PROD) {
    return "http://localhost:3001";
  }
  return "";
}

export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl();
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (base && url.startsWith("/")) {
    input = base + url;
  }

  return fetch(input, init);
}
