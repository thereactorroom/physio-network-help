// ═══════════════════════════════════════════════════════════════════════════
// fusionBridge.js — iframe detection + bridge communication layer
// Ported from the ICE onQ fusion-boilerplate. Config-driven via fusionConfig.js.
// ═══════════════════════════════════════════════════════════════════════════

import { FUSION_CONFIG } from "@/lib/fusionConfig";

const C = FUSION_CONFIG;

// Bridge scripts declare their objects with `const` at the top level, which
// creates a global lexical binding that does NOT attach to `window`. We use
// `new Function` to evaluate in the global scope so we can access them,
// while keeping the name in a string to avoid lint errors.
export function getGlobalBridge(name) {
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return typeof ${name} !== 'undefined' ? ${name} : undefined`)();
  } catch {
    return undefined;
  }
}

// ── Host resolution ──────────────────────────────────────────────────────────
// Returns the appropriate base URL for the current environment (prod or UAT).
export function getFusionHostUrl() {
  let host = "";
  try {
    host = window.parent.location.hostname; // same-origin parent
  } catch {
    try {
      host = new URL(document.referrer).hostname; // cross-origin parent
    } catch {
      host = "";
    }
  }
  if (host && host.includes(C.UAT_SUBSTRING)) return C.HOST_URL_UAT;
  return C.HOST_URL_PROD;
}

// ── Fusion member data ───────────────────────────────────────────────────────
// Fetch the logged-in fusion member's community groups via the host bridge.
// Returns the groups array (see fusionConfig example), or null if unavailable.
export async function getFusionMemberGroups() {
  console.log("[FusionBridge] getFusionMemberGroups() called");
  const fusionBridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);
  console.log("[FusionBridge] FusionBridge global:", fusionBridge);
  if (!fusionBridge) {
    console.warn("[FusionBridge] FusionBridge global not found — bridge script may not have loaded.");
    return null;
  }
  console.log("[FusionBridge] typeof getUserCommunityGroups:", typeof fusionBridge.getUserCommunityGroups);
  if (typeof fusionBridge.getUserCommunityGroups !== "function") {
    console.warn("[FusionBridge] getUserCommunityGroups is not a function on FusionBridge.");
    return null;
  }
  // The bridge reads session/communityId from URL params into __context during init(),
  // and needs __csrf (fetched by init()) for its API calls. Ensure init has completed.
  console.log("[FusionBridge] bridge __context:", fusionBridge.__context);
  console.log("[FusionBridge] bridge __csrf (pre):", fusionBridge.__csrf);
  if (!fusionBridge.__csrf) {
    console.log("[FusionBridge] __csrf empty — awaiting FusionBridge.init(1) to populate it");
    try {
      await fusionBridge.init(1);
    } catch (e) {
      console.warn("[FusionBridge] init() threw:", e);
    }
    console.log("[FusionBridge] bridge __csrf (post init):", fusionBridge.__csrf);
  }

  try {
    const response = await fusionBridge.getUserCommunityGroups();
    console.log("[FusionBridge] resolved response from getUserCommunityGroups():", response);
    console.log("[FusionBridge] response (deep dump):");
    console.dir(response, { depth: null });
    try {
      console.log("[FusionBridge] response (JSON):", JSON.stringify(response, null, 2));
    } catch (e) {
      console.log("[FusionBridge] response not JSON-serializable:", e);
    }
    console.log("[FusionBridge] response keys:", response ? Object.keys(response) : response);
    console.log("[FusionBridge] response.result:", response?.result);
    console.log("[FusionBridge] response.member:", response?.member);
    console.log("[FusionBridge] response.member?.groups:", response?.member?.groups);
    if (response && response.result && response.member && Array.isArray(response.member.groups)) {
      console.log("[FusionBridge] parsed groups:", response.member.groups);
      return response.member.groups;
    }
    console.warn("[FusionBridge] response did not match expected shape { result, member.groups }.");
    return null;
  } catch (err) {
    console.error("[FusionBridge] error calling getUserCommunityGroups():", err);
    return null;
  }
}

// Resolves once the FusionBridge global is available (bridge script loaded),
// or rejects after the timeout. Call this before invoking bridge methods to
// avoid races with the async script injection.
export function waitForFusionBridge(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (getGlobalBridge(C.FUSION_BRIDGE_NAME)) {
      console.log("[FusionBridge] bridge already available");
      return resolve();
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (getGlobalBridge(C.FUSION_BRIDGE_NAME)) {
        clearInterval(interval);
        console.log("[FusionBridge] bridge became available after", Date.now() - start, "ms");
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        console.warn("[FusionBridge] timed out waiting for bridge script to load");
        reject(new Error("FusionBridge not available"));
      }
    }, 200);
  });
}

// True if the logged-in fusion member has an active group named "Admin".
export async function isFusionAdmin() {
  const groups = await getFusionMemberGroups();
  console.log("[FusionBridge] isFusionAdmin() groups:", groups);
  if (!groups) {
    console.log("[FusionBridge] isFusionAdmin() → false (no groups)");
    return false;
  }
  const adminGroups = groups.filter(
    (g) => g && typeof g.name === "string" && g.name.toLowerCase() === "admin"
  );
  console.log("[FusionBridge] admin-named groups found:", adminGroups);
  const result = adminGroups.length > 0;
  console.log("[FusionBridge] isFusionAdmin() →", result);
  return result;
}

// ── Iframe detection ─────────────────────────────────────────────────────────
// Determines if the app is running inside a fusion iframe.
// Priority: top-level check → fresh parent host → sessionStorage cache → bridge globals.
export function isInFusionIframe() {
  // A top-level window is never in a fusion iframe. Check this BEFORE the
  // sessionStorage cache so a stale "true" doesn't hide web-only UI on a
  // direct web visit.
  if (window.self === window.top) {
    try { sessionStorage.setItem(C.SESSION_CACHE_KEY, "false"); } catch {}
    return false;
  }

  // We're in an iframe. Try to detect the parent host FRESH first — this
  // overwrites any stale cached value when the current parent is actually
  // non-fusion (e.g., the Base44 builder preview).
  let host = "";
  try {
    host = window.parent.location.hostname; // same-origin parent
  } catch {
    try {
      host = new URL(document.referrer).hostname; // cross-origin parent via referrer
    } catch {
      host = "";
    }
  }

  const ownHost = window.location.hostname;

  // Fresh, usable host that isn't our own (i.e. not an internal navigation) →
  // detect from it and update the cache.
  if (host && host !== ownHost) {
    const result = host.endsWith(C.HOST_DOMAIN);
    try { sessionStorage.setItem(C.SESSION_CACHE_KEY, String(result)); } catch {}
    return result;
  }

  // Internal navigation (referrer is our own URL) or no usable referrer —
  // trust the cache, then fall back to bridge globals.
  try {
    const cached = sessionStorage.getItem(C.SESSION_CACHE_KEY);
    if (cached !== null) return cached === "true";
  } catch {}
  const hasBridge = !!window[C.BRIDGE_FLAG] || !!getGlobalBridge(C.FUSION_BRIDGE_NAME);
  try { sessionStorage.setItem(C.SESSION_CACHE_KEY, String(hasBridge)); } catch {}
  return hasBridge;
}

// ── Bridge action helpers ───────────────────────────────────────────────────
// Each helper tries the native bridge first (when in a fusion iframe),
// then falls back to standard browser behavior.

// Call a phone number
export function fusionCall(tel) {
  const bridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
  if (isInFusionIframe() && bridge && typeof bridge.openPhone === "function") {
    bridge.openPhone({ tel });
  } else {
    window.location.href = `tel:${tel}`;
  }
}

// Send SMS
export function fusionSMS(to, body) {
  const bridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
  if (isInFusionIframe() && bridge && typeof bridge.openSMS === "function") {
    bridge.openSMS({ to, body });
  } else {
    window.location.href = `sms:${to}?body=${encodeURIComponent(body)}`;
  }
}

// Download a file by URL
// Tries: NativeBridge.download → FusionBridge.send → postMessage → browser download
export function fusionDownload(url, filename) {
  const nativeBridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
  const fusionBridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);

  if (nativeBridge && typeof nativeBridge.download === "function") {
    nativeBridge.download({ url });
    return true;
  }

  if (fusionBridge && typeof fusionBridge.send === "function") {
    fusionBridge.send({ request: "download", payload: { url } });
    return true;
  }

  if (window.self !== window.top) {
    window.top.postMessage({ request: "download", payload: { url } }, "*");
    return true;
  }

  // Browser download fallback
  const link = document.createElement("a");
  link.href = url;
  if (filename) link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

// Open WhatsApp
// Tries: NativeBridge.openWhatsApp → FusionBridge.openWhatsApp → postMessage → wa.me link
export function fusionWhatsApp(uri) {
  // Inside a fusion iframe → delegate to the host's NativeBridge.
  if (window.self !== window.top) {
    const nativeBridge = getGlobalBridge(C.NATIVE_BRIDGE_NAME);
    if (nativeBridge && typeof nativeBridge.openWhatsApp === "function") {
      nativeBridge.openWhatsApp({ uri });
      return;
    }
    const fusionBridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);
    if (fusionBridge && typeof fusionBridge.openWhatsApp === "function") {
      fusionBridge.openWhatsApp(uri);
      return;
    }
    window.top.postMessage({ request: "openWhatsApp", payload: { uri } }, "*");
    return;
  }
  // Standalone web → open the wa.me link directly.
  window.location.href = uri;
}

// Close the component (tell the host to dismiss the iframe)
export function closeComponent() {
  const fusionBridge = getGlobalBridge(C.FUSION_BRIDGE_NAME);
  if (fusionBridge && typeof fusionBridge.closeComponent === "function") {
    fusionBridge.closeComponent();
  }
  // Always send the raw message as a fallback
  if (window.self !== window.top) {
    window.top.postMessage({ request: "closeComponent" }, "*");
  }
}