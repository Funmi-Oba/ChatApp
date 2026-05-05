import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      navigate("/chat");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full p-4 bg-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4 border w-14 h-14 rounded-2xl bg-surface border-border">
            <svg
              className="w-7 h-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl text-text">
            Create your <span className="text-2xl font-bold text-accent">ChatApp</span> account
          </h1>
          <p className="mt-1 text-sm text-muted">
            End-to-end encrypted messaging
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 border bg-surface border-border rounded-2xl">
          {error && (
            <div className="px-4 py-3 text-sm border rounded-lg bg-error/10 border-error/30 text-error">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-muted mb-1.5">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="yourname"
              className="w-full px-4 py-3 text-sm transition-colors border bg-bg border-border rounded-xl text-text placeholder-muted focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 text-sm transition-colors border bg-bg border-border rounded-xl text-text placeholder-muted focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 text-sm transition-colors border bg-bg border-border rounded-xl text-text placeholder-muted focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              className="w-full px-4 py-3 text-sm transition-colors border bg-bg border-border rounded-xl text-text placeholder-muted focus:border-accent focus:outline-none"
              required
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center w-full gap-2 py-3 mt-2 font-semibold transition-colors bg-accent hover:bg-accent-light text-bg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full border-bg border-t-transparent animate-spin" />
                Registering...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Encryption notice */}
          <div className="flex items-center gap-2 pt-1 text-xs text-muted">
            <svg
              className="w-3.5 h-3.5 text-accent shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Encryption keys are generated on your device
          </div>
        </div>

        <p className="mt-6 text-sm text-center text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="transition-colors text-accent hover:text-accent-light"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
