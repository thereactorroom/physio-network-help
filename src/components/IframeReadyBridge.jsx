import { useEffect } from "react";
import { getUrlParam } from "@/lib/urlParams";

// Fires the iframe-ready handshake to the parent window once the app has
// fully loaded. Reads `action` and `origin` from the URL (case-insensitive)
// and posts { action, payload: 'appready' } to the parent using `origin`
// as the target origin for security.
export default function IframeReadyBridge() {
  useEffect(() => {
    const action = getUrlParam("action");
    const origin = getUrlParam("origin");
    if (action && origin) {
      window.parent.postMessage({ action, payload: "appready" }, origin);
    }
  }, []);

  return null;
}