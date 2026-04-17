export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");
  const origin = new URL(request.url).origin;

  if (error || !code) {
    return Response.redirect(new URL(`/login?error=google_denied`, request.url));
  }

  const redirectUri  = `${origin}/api/auth/google/callback`;
  const clientId     = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return Response.redirect(new URL(`/login?error=missing_credentials`, request.url));
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
    if (tokens.error) return Response.redirect(new URL(`/login?error=${tokens.error}`, request.url));

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    // Store tokens + profile in localStorage via inline script, then redirect to /login
    const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Google…</title></head>
<body style="background:#07070d;color:white;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;gap:16px">
  <div style="width:48px;height:48px;border:3px solid rgba(255,0,60,0.3);border-top-color:#FF003C;border-radius:50%;animation:spin 0.8s linear infinite"></div>
  <p style="color:#9999bb;font-size:14px">Connecting your Google account…</p>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  <script>
    (function() {
      const tokens  = ${JSON.stringify({ ...tokens, saved_at: Date.now() })};
      const profile = ${JSON.stringify(profile)};
      
      // Save to all expected keys for compatibility
      localStorage.setItem("arise:google:tokens",  JSON.stringify(tokens));
      localStorage.setItem("arise:google:profile", JSON.stringify(profile));
      // Legacy keys
      localStorage.setItem("arise:google:token", tokens.access_token || "");
      localStorage.setItem("arise:google:user",  JSON.stringify(profile));
      
      // Create unified session from Google profile
      const existingSession = localStorage.getItem("arise:session:v2");
      if (!existingSession) {
        const googleSession = {
          id:         "google_" + profile.id,
          name:       profile.name,
          identifier: profile.email,
          avatar:     profile.picture || null,
          verified:   true,
          authType:   "google",
          playlists:  [],
          likedSongs: [],
          savedAt:    Date.now(),
        };
        localStorage.setItem("arise:session:v2", JSON.stringify(googleSession));
      } else {
        // Update existing session with Google avatar if missing
        try {
          const s = JSON.parse(existingSession);
          if (!s.avatar && profile.picture) {
            s.avatar = profile.picture;
            localStorage.setItem("arise:session:v2", JSON.stringify(s));
          }
        } catch {}
      }
      
      window.location.href = "/login?connected=google";
    })();
  </script>
</body>
</html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return Response.redirect(new URL(`/login?error=${encodeURIComponent(String(e))}`, request.url));
  }
}
