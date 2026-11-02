"use client";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/icon";
import type { SessionUser } from "@/lib/domain";

export function AuthDialog({
  open,
  onClose,
  onSuccess,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: SessionUser) => void;
  message?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json() as { user?: SessionUser; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error ?? "Something went wrong.");
      onSuccess(result.user);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="auth-dialog__top"><button className="icon-button" type="button" onClick={onClose} aria-label="Close sign in"><Icon name="close" /></button><span>Welcome to Roam</span><span /></div>
        <div className="auth-dialog__body">
          <p className="eyebrow">A more considered way away</p>
          <h2 id="auth-title">{mode === "login" ? "Sign in or join" : "Create your account"}</h2>
          {message && <p className="form-note">{message}</p>}
          <form onSubmit={submit}>
            {mode === "register" && <label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={80} required placeholder="Samira Khan" /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
            <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 10 : 1} maxLength={200} required placeholder={mode === "register" ? "At least 10 characters" : "Your password"} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button--primary button--full" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Continue" : "Create account"}</button>
          </form>
          <p className="auth-dialog__switch">{mode === "login" ? "New to Roam?" : "Already have an account?"} <button type="button" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
          <p className="auth-dialog__legal">By continuing, you agree to our Terms of Service and acknowledge our Privacy Policy.</p>
        </div>
      </section>
    </div>
  );
}