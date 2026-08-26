// Case-insensitive URL parameter reader.
// Usage: getUrlParam("isAdmin") matches ?isAdmin, ?isadmin, ?ISADMIN, etc.
export function getUrlParam(name) {
  const target = name.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase() === target) return value;
  }
  return null;
}