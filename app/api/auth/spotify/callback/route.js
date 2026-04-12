export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) return Response.redirect(new URL(`/profile?error=spotify_denied`, request.url));

  const origin       = new URL(request.url).origin;
  const redirectUri  = `${origin}/api/auth/spotify/callback`;
  const clientId     = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) return Response.redirect(new URL(`/profile?error=missing_spotify_credentials`, request.url));

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) return Response.redirect(new URL(`/profile?error=${tokens.error}`, request.url));

    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    const html = `<!DOCTYPE html><html><body style="background:#07070d;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<script>
localStorage.setItem("arise:spotify:tokens", JSON.stringify(${JSON.stringify({ ...tokens, saved_at: Date.now() })}));
localStorage.setItem("arise:spotify:profile", JSON.stringify(${JSON.stringify(profile)}));
window.location.href="/profile?connected=spotify";
</script>Connecting Spotify account…</body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return Response.redirect(new URL(`/profile?error=${encodeURIComponent(String(e))}`, request.url));
  }
}
