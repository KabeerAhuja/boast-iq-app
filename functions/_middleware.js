// Reverse-proxy Firebase Auth's helper endpoints from our own origin.
//
// Firebase serves the OAuth handler + iframe at <authDomain>/__/auth/*. Serving
// them from app.boast-iq.com (instead of the cross-site boastiq.firebaseapp.com)
// makes Google sign-in FIRST-PARTY, which fixes the popup loop / redirect
// failures in Safari + in-app browsers (Messages, WhatsApp, iOS WebViews).
//
// Pages ignores function files starting with "_" EXCEPT _middleware.js, so this
// root middleware is the only way to own the /__/* URL prefix. Every non-/__/
// request falls straight through to the static site via next().
const UPSTREAM = "https://boastiq.firebaseapp.com";

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Anything that isn't a Firebase helper path: serve the static site untouched.
  if (!url.pathname.startsWith("/__/")) return next();

  const target = UPSTREAM + url.pathname + url.search;
  const init = {
    method: request.method,
    headers: request.headers,
    redirect: "manual", // pass any 3xx back to the browser
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  // Strip headers that would stop the browser treating the handler as
  // first-party / same-origin on app.boast-iq.com.
  const headers = new Headers(upstream.headers);
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");
  headers.delete("x-frame-options");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
