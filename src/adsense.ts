/** TOOLBOX v0.14.79 — AdSense loader. Requires an approved publisher ID via VITE_ADSENSE_CLIENT_ID. */
const SCRIPT_ID = "google-adsense-script";
const CLIENT_PATTERN = /^ca-pub-\d{16}$/;

export function installAdsense(): void {
  const clientId = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_ADSENSE_CLIENT_ID?.trim() ?? "";
  if (!CLIENT_PATTERN.test(clientId)) return;
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.adClient = clientId;
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(clientId);
  document.head.append(script);
}
