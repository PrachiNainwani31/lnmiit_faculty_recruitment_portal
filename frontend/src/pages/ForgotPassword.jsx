import { useState } from "react";
import API from "../api/api";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address"); return;
    }
    try {
      setLoading(true); setError("");
      await API.post("/registration/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your registered email to receive a reset link
          </p>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-green-700 font-semibold">Reset link sent!</p>
            <p className="text-sm text-green-600 mt-1">
              Check your email for the password reset link. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 ${
                  error ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <p className="text-center text-xs text-gray-400">
              <a href="/login" className="text-red-600 hover:underline">← Back to Login</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}