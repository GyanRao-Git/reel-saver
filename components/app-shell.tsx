"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ResolvedMedia } from "@/lib/types";

type ApiError = { error?: string };

function formatBytes(bytes: number | null) {
  if (bytes === null) return "Size unknown";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function detectPlatform(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host.includes("instagram")) return "Instagram Reel";
    if (host.includes("youtu")) return "YouTube";
  } catch {}
  return null;
}

export function AppShell({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  if (!authenticated) return <Unlock onUnlock={() => setAuthenticated(true)} />;
  return <Downloader onLock={() => setAuthenticated(false)} />;
}

function Unlock({ onUnlock }: { onUnlock: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const body = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(body.error || "Could not unlock the app.");
      onUnlock();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not unlock the app.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell center-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="auth-card" aria-labelledby="unlock-title">
        <Logo />
        <p className="eyebrow">Private workspace</p>
        <h1 id="unlock-title">Your links stay yours.</h1>
        <p className="subtle">Enter the personal passcode configured for this deployment.</p>
        <form onSubmit={submit} className="stack">
          <label htmlFor="passcode">Passcode</label>
          <input
            id="passcode"
            type="password"
            autoComplete="current-password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="••••••••••••"
            required
            autoFocus
          />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>
            {busy ? "Unlocking…" : "Unlock ReelSave"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Downloader({ onLock }: { onLock: () => void }) {
  const [url, setUrl] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<ResolvedMedia | null>(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const platform = useMemo(() => detectPlatform(url), [url]);
  const chosen = result?.formats.find((format) => format.id === selected) ?? result?.formats[0];

  async function resolve(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = (await response.json()) as ResolvedMedia & ApiError;
      if (response.status === 401) {
        onLock();
        return;
      }
      if (!response.ok) throw new Error(body.error || "Could not inspect this link.");
      setResult(body);
      setSelected(body.formats[0]?.id ?? "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not inspect this link.");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    await fetch("/api/session", { method: "DELETE" });
    onLock();
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="nav">
        <Logo />
        <button className="text-button" onClick={lock}>Lock app</button>
      </nav>
      <section className="hero">
        <p className="eyebrow"><span className="status-dot" /> Personal media utility</p>
        <h1>Save it.<br /><em>Keep it close.</em></h1>
        <p className="hero-copy">
          Paste a public Instagram Reel or YouTube link. Choose a ready-made quality and save it to this device.
        </p>
      </section>

      <section className="download-card" aria-labelledby="download-title">
        <div className="card-heading">
          <div><span>01</span><h2 id="download-title">Paste your link</h2></div>
          {platform && <span className="platform-chip">{platform}</span>}
        </div>
        <form onSubmit={resolve} className="stack">
          <label className="sr-only" htmlFor="media-url">Instagram Reel or YouTube URL</label>
          <div className="url-row">
            <input
              id="media-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://youtube.com/shorts/…"
              required
            />
            <button className="primary-button inspect-button" disabled={busy || !confirmed}>
              {busy ? <><span className="spinner" /> Inspecting</> : "Find video"}
            </button>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>I own this media or have permission to download it.</span>
          </label>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </section>

      {result && (
        <section className="result-card" aria-live="polite">
          <div className="preview">
            {/* Remote provider thumbnails are intentionally not sent through Vercel image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {result.thumbnail ? <img src={result.thumbnail} alt="" /> : <div className="preview-placeholder">No preview</div>}
            {formatDuration(result.duration) && <span>{formatDuration(result.duration)}</span>}
          </div>
          <div className="result-copy">
            <p className="eyebrow">Ready to save</p>
            <h2>{result.title}</h2>
            <div className="quality-list" role="radiogroup" aria-label="Video quality">
              {result.formats.map((format) => (
                <label key={format.id} className={selected === format.id ? "quality selected" : "quality"}>
                  <input
                    type="radio"
                    name="quality"
                    value={format.id}
                    checked={selected === format.id}
                    onChange={() => setSelected(format.id)}
                  />
                  <strong>{format.label}</strong>
                  <span>{format.ext.toUpperCase()} · {formatBytes(format.size)}</span>
                </label>
              ))}
            </div>
            {chosen && (
              <a className="primary-button save-button" href={chosen.downloadUrl}>
                {chosen.delivery === "source" ? "Open source download" : "Download video"}
              </a>
            )}
            {chosen?.delivery === "source" && (
              <p className="small-note">This larger file opens from its temporary source to stay within the free hosting limits.</p>
            )}
          </div>
        </section>
      )}

      <footer>
        <p>Private by design · Nothing is stored</p>
        <p>Public media only. Respect creators and platform terms.</p>
      </footer>
    </main>
  );
}

function Logo() {
  return <div className="logo" aria-label="ReelSave"><span>R</span> ReelSave</div>;
}
