export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");
  const origin = new URL(request.url).origin;

  if (error || !code) {
    return Response.redirect(new URL(`/login?error=spotify_denied`, request.url));
  }

  const redirectUri  = `${origin}/api/auth/spotify/callback`;
  const clientId     = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return Response.redirect(new URL(`/login?error=missing_spotify_credentials`, request.url));
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });

    // Check content-type before parsing — Spotify sometimes returns HTML error pages
    const contentType = tokenRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await tokenRes.text();
      // Spotify Premium required message
      if (text.includes("Premium") || text.includes("premium") || text.includes("Active pre")) {
        return Response.redirect(new URL(`/login?error=spotify_premium_required`, request.url));
      }
      return Response.redirect(new URL(`/login?error=spotify_token_error`, request.url));
    }

    const tokens = await tokenRes.json();
    if (tokens.error) {
      return Response.redirect(new URL(`/login?error=${encodeURIComponent(tokens.error_description || tokens.error)}`, request.url));
    }

    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Spotify…</title></head>
<body style="background:#07070d;color:white;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;gap:16px">
  <div style="width:48px;height:48px;border:3px solid rgba(29,185,84,0.3);border-top-color:#1DB954;border-radius:50%;animation:spin 0.8s linear infinite"></div>
  <p style="color:#9999bb;font-size:14px">Connecting your Spotify account…</p>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  <script>
    (function() {
      const tokens  = ${JSON.stringify({ ...tokens, saved_at: Date.now() })};
      const profile = ${JSON.stringify(profile)};
      localStorage.setItem("arise:spotify:tokens",  JSON.stringify(tokens));
      localStorage.setItem("arise:spotify:profile", JSON.stringify(profile));
      window.location.href = "/login?connected=spotify";
    })();
  </script>
</body>
</html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return Response.redirect(new URL(`/login?error=${encodeURIComponent(String(e))}`, request.url));
  }
}
