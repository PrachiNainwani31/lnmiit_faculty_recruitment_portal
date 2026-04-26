import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/api";

function StrengthBar({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[@#$%!&*]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  const labels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score < 3 ? "text-red-500" : score < 5 ? "text-amber-500" : "text-green-600"}`}>
        {labels[score]}
      </p>
      <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
        {[
          [password.length >= 8,     "At least 8 characters"],
          [/[A-Z]/.test(password),   "One uppercase letter"],
          [/[a-z]/.test(password),   "One lowercase letter"],
          [/[0-9]/.test(password),   "One number"],
          [/[@#$%!&*]/.test(password),"One special character (@#$%!&*)"],
        ].map(([ok, label]) => (
          <li key={label} className={ok ? "text-green-600" : "text-gray-400"}>
            {ok ? "✓" : "○"} {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResetPassword() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get("token");
  const email      = params.get("email");

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!password) { setError("Password is required"); return; }
    if (password.length < 8) { setError("Minimum 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setError("Must include uppercase letter"); return; }
    if (!/[a-z]/.test(password)) { setError("Must include lowercase letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Must include a number"); return; }
    if (!/[@#$%!&*]/.test(password)) { setError("Must include special character (@#$%!&*)"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    try {
      setLoading(true);
      await API.post("/registration/reset-password", { email, token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Invalid reset link</p>
          <a href="/login" className="text-sm text-blue-600 underline mt-2 block">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-xs text-gray-400 mt-1">{email}</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-green-700 font-semibold">Password reset successfully!</p>
            <p className="text-sm text-green-600 mt-1">Redirecting to login…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                New Password <span className="text-red-500">*</span>
              </label>
                <div className="relative">
                  <input
                  type={showPwd ? "text" : "password"}
                  className="w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 border-gray-200"
                  placeholder="Enter new password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                />
              <button type="button" tabIndex={-1} onClick={() => setShowPwd(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7
                        a9.97 9.97 0 012.19-3.568M6.34 6.34A9.953 9.953 0 0112 5
                        c4.477 0 8.268 2.943 9.542 7a9.972 9.972 0 01-4.21 5.206
                        M15 12a3 3 0 00-3-3m0 0a3 3 0 00-2.122.879M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7
                        -1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              </div>
              <StrengthBar password={password} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 border-gray-200"
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7
                        a9.97 9.97 0 012.19-3.568M6.34 6.34A9.953 9.953 0 0112 5
                        c4.477 0 8.268 2.943 9.542 7a9.972 9.972 0 01-4.21 5.206
                        M15 12a3 3 0 00-3-3m0 0a3 3 0 00-2.122.879M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7
                        -1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              </div>
              {confirm && confirm !== password && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}