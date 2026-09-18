# ReelSave

A small, passcode-protected personal utility for saving public Instagram Reels and individual YouTube videos that you own or have permission to download. The frontend and API routes deploy together as one Next.js project.

## What it supports

- Public Instagram Reel URLs
- Public YouTube watch, Shorts, and `youtu.be` URLs
- Ready-made MP4/WebM formats that already include audio
- Quality selection, responsive phone/desktop UI, and short-lived signed download links
- Direct attachment streaming for known files up to 50 MB and 10 minutes
- Temporary source redirects for larger files, unknown sizes, or failed proxy connections

It does not support playlists, live streams, private or login-required media, region bypassing, cookies, separate audio/video merging, or arbitrary URLs. Media is streamed or redirected and is never stored by the app.

## Local setup

Requirements: Node.js 22.12 or newer and npm. Installation downloads the appropriate `yt-dlp` binary for the current operating system. Linux deployments additionally install yt-dlp's standalone executable so the runtime does not require Python.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set both values in `.env.local`:

- `APP_PASSCODE`: the passcode used to unlock your deployment.
- `SESSION_SECRET`: at least 32 random characters, used to sign sessions and ten-minute download links. Generate one with `openssl rand -base64 48` or a password manager.

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Automated tests use fixtures and do not contact Instagram or YouTube. After deployment, manually smoke-test one short public Reel and one short public YouTube video that you are permitted to download.

## Deploy to Vercel

1. Push this directory to a personal Git repository and import it into Vercel.
2. Add `APP_PASSCODE` and `SESSION_SECRET` to the project environment variables for Production and Preview.
3. Deploy. Vercel detects Next.js automatically; no database or storage service is required.

The Hobby plan is intended for personal, non-commercial projects. Large files use a source redirect because function response, runtime, and transfer limits can change. A source redirect may open the video in a browser tab, where the device's normal save action is used.

## Maintenance and limitations

Instagram and YouTube can change markup, signatures, authentication, or bot protections without notice. Cloud-hosted requests may also be blocked even when a link works locally. When extraction starts failing, update the pinned `youtube-dl-exec` package and redeploy so its current `yt-dlp` binary is installed:

```bash
npm install youtube-dl-exec@latest --save-exact
npm test
npm run build
```

Only public, permitted media should be used. YouTube's official API policy does not allow general audiovisual downloading without prior approval, so YouTube support here is unofficial and best-effort. Review the [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies) and the applicable Instagram terms before use.
