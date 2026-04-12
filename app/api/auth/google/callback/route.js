export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return Response.redirect(new URL(`/profile?error=google_denied`, request.url));
  }

  const origin       = new URL(request.url).origin;
  const redirectUri  = `${origin}/api/auth/google/callback`;
  const clientId     = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return Response.redirect(new URL(`/profile?error=missing_google_credentials`, request.url));
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) return Response.redirect(new URL(`/profile?error=${tokens.error}`, request.url));

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    const html = `<!DOCTYPE html><html><body style="background:#07070d;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<script>
localStorage.setItem("arise:google:tokens", JSON.stringify(${JSON.stringify({ ...tokens, saved_at: Date.now() })}));
localStorage.setItem("arise:google:profile", JSON.stringify(${JSON.stringify(profile)}));
window.location.href="/profile?connected=google";
</script>Connecting Google account…</body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return Response.redirect(new URL(`/profile?error=${encodeURIComponent(String(e))}`, request.url));
  }
}
