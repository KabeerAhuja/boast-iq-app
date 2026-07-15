// Reverse-proxy Firebase Auth's helper endpoints from our own domain.
//
// Firebase serves the OAuth handler + iframe at <authDomain>/__/auth/* and the
// runtime config at /__/firebase/init.json. Hosting these on our own origin
// (app.boast-iq.com) instead of the cross-site boastiq.firebaseapp.com makes
// Google sign-in FIRST-PARTY, which is what fixes the popup loop / redirect
// failures in Safari + in-app browsers (Messages, WhatsApp, iOS WebViews).
//
// This Pages Function matches every /__/* request and streams it through to the
// real Firebase Hosting handler. Everything else on the site stays a plain
// static asset (this function only runs for /__/* paths).
const UPSTREAM = "https://boastiq.firebaseapp.com";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = UPSTREAM + url.pathname + url.search;

  const init = {
    method: request.method,
    headers: request.headers,
    redirect: "manual", // pass any 3xx straight back to the browser
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  // Copy the response but drop hop-by-hop / origin-locking headers so the
  // browser treats the handler as first-party on app.boast-iq.com.
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
