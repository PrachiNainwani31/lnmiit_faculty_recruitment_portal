import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/layouts/AuthLayout";
import logo from "../assets/lnmiit_logo.png";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      const { token, user } = res.data;

      //  Store auth info
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Role-based redirect
      if (user.role === "HOD") {
        navigate("/hod");
      } else if (user.role === "DOFA") {
        navigate("/dofa");
      } else if (user.role === "CANDIDATE") {
        navigate("/candidate");
      } else if(user.role === "REFEREE") {
        navigate(`/referee-portal`);
      } else {
        setError("Unauthorized role");
      }
    } catch (err) {
      setError(
        err.response?.data?.msg || "Login failed"
      );
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
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-3">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Forgot Password
        </button>
      </form>
    </AuthLayout>
  );
}
