import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/layouts/AuthLayout";
import logo from "../assets/lnmiit_logo.png";
import axios from "axios";

function PwdField({ value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder="Password"
        className="w-full border px-3 py-2 rounded pr-10"
        value={value}
        onChange={onChange}
        required
      />
      <button type="button" tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role",  user.role);
      localStorage.setItem("user",  JSON.stringify(user));

      const routes = {
        HOD:          "/hod",
        DOFA:         "/dofa",
        ADOFA:        "/dofa",
        CANDIDATE:    "/candidate",
        REFEREE:      "/referee-portal",
        DOFA_OFFICE:  "/dofa-office",
        ESTABLISHMENT:"/travel",
        ADMIN:        "/dofa",
      };

      const dest = routes[user.role];
      if (dest) {
        navigate(dest);
      } else {
        setError("Unauthorized role");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <img src={logo} className="mx-auto max-w-[220px] mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">
          Welcome! Sign in to start your session
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-3">{error}</div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <PwdField value={password} onChange={e => setPassword(e.target.value)} />

        <button disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60">
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button type="button" onClick={() => navigate("/forgot-password")}
          className="w-full bg-blue-600 text-white py-2 rounded">
          Forgot Password
        </button>
      </form>
    </AuthLayout>
  );
}