"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = redirect;
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = redirect;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
          },
        });
        if (signUpError) throw signUpError;
        setSuccess("Account created! Check your email for the verification link, then log in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.refresh();
        window.location.href = redirect;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) { setError("Enter your email first"); return; }
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
      },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setSuccess("Magic link sent! Check your email and click the link to log in.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
      },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0B0E1A" }}>
      <div className="w-full max-w-md p-8 rounded-3xl" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                <line x1="8.12" y1="8.12" x2="12" y2="12"/>
              </svg>
            </div>
          </Link>
          <h1 className="text-xl font-bold text-white">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm mt-1 text-gray-500">
            {mode === "signup" ? "Get 30 free daily credits instantly" : "Log in to your HelpEdit account"}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl mb-4 text-sm bg-red-500/10 border border-red-500/25 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl mb-4 text-sm bg-green-500/10 border border-green-500/25 text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-400">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }} />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-gray-400">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-gray-400">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} minLength={6}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        <div className="relative my-5 text-center text-xs text-gray-600">
          <div className="absolute top-1/2 left-0 w-[calc(50%-16px)] h-px bg-white/5" />
          <div className="absolute top-1/2 right-0 w-[calc(50%-16px)] h-px bg-white/5" />
          or
        </div>

        <button onClick={handleMagicLink} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:border-purple-500/25 hover:bg-purple-500/5 transition-all mb-3 disabled:opacity-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Send Magic Link (no password needed)
        </button>

        <button onClick={handleGoogleLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:border-purple-500/25 hover:bg-purple-500/5 transition-all disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs mt-5 text-gray-500">
          {mode === "signup" ? (
            <>Already have an account?{" "}
              <button className="font-semibold text-purple-400 hover:underline"
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Log in</button>
            </>
          ) : (
            <>No account?{" "}
              <button className="font-semibold text-purple-400 hover:underline"
                onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>Sign up free</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}