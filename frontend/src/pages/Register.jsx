import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/layouts/AuthLayout";
import logo from "../assets/lnmiit_logo.png";
import axios from "axios";
import API from "../api/api";

/* ── Reusable password input with show/hide toggle ── */
function PasswordInput({ name, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        className="w-full border px-3 py-2 rounded pr-10"
        value={value}
        onChange={onChange}
        required
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                 a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
                 M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59
                 m7.532 7.532l3.29 3.29M3 3l3.59 3.59
                 m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
                 a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5
                 c4.478 0 8.268 2.943 9.542 7
                 -1.274 4.057-5.064 7-9.542 7
                 -4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:     "",
    email:    "",
    password: "",
    confirm:  "",
    role:     "REFEREE",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      await API.post("/auth/register",{
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     form.role,
      });
      alert("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <img src={logo} className="mx-auto max-w-[220px] mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">
          Create a new account
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-3">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleRegister}>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full border px-3 py-2 rounded"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          value={form.email}
          onChange={handleChange}
          required
        />

        <select
          name="role"
          className="w-full border px-3 py-2 rounded text-gray-700 bg-white"
          value={form.role}
          onChange={handleChange}
        >
          <option value="REFEREE">Referee</option>
        </select>

        <PasswordInput
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <PasswordInput
          name="confirm"
          placeholder="Confirm Password"
          value={form.confirm}
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Already have an account? Login
        </button>

      </form>
    </AuthLayout>
  );
}