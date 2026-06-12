import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LordIcon } from "../components/ui/LordIcon";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell flex items-center justify-center p-6">
      <div className="auth-card w-full max-w-md rounded-3xl p-8 md:p-10">
        <div className="mb-6 flex items-center gap-3">
          <LordIcon name="fitness" size={40} trigger="loop-on-hover" color="blue" />
          <div>
            <p className="text-2xl font-extrabold tracking-tight">APEX</p>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Health & Performance</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-white/45">Log meals, workouts, and progress in one dashboard.</p>

        {error && (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm text-white/50">Email</label>
            <input className="apex-input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/50">Password</label>
            <input className="apex-input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="apex-btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/45">
          New here?{" "}
          <Link to="/register" className="font-medium text-blue-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
