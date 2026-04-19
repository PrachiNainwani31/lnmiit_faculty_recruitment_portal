import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api";

const SALUTATIONS = ["Prof.", "Dr.", "Mr.", "Ms.", "Mrs."];

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white";

/* ── Password field with eye toggle ── */
function PwdField({ name, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className={inputCls + " pr-10"}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
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

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label} {required && <span className="text-rose-600">*</span>}
    </label>
    {children}
  </div>
);

/* ══════════════════════════════════════════
   DRAW / TYPE SIGNATURE COMPONENT
══════════════════════════════════════════ */
function SignatureInput({ onSignatureReady }) {
  const [mode, setMode]     = useState("type"); // "type" | "draw"
  const [typed, setTyped]   = useState("");
  const canvasRef           = useRef(null);
  const isDrawing           = useRef(false);

  /* ── Canvas drawing ── */
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.strokeStyle = "#8b0000";
    ctx.lineTo(x, y);
    ctx.stroke();
    onSignatureReady(canvas.toDataURL());
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureReady(null);
  };

  return (
    <div className="space-y-3">
      {/* Tab toggle */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden w-fit">
        {["type", "draw"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-5 py-2 text-sm font-semibold transition ${
              mode === m
                ? "bg-rose-700 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {m === "type" ? "Type Signature" : "Draw Signature"}
          </button>
        ))}
      </div>

      {mode === "type" ? (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Type your full name to sign <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            placeholder="Type your full name"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              onSignatureReady(e.target.value || null);
            }}
            className={inputCls}
          />
          {/* Signature preview */}
          <div className="border border-gray-200 rounded-xl px-5 py-4 bg-gray-50 min-h-[60px] flex items-center justify-center">
            {typed ? (
              <p className="text-2xl font-serif italic text-rose-700">{typed}</p>
            ) : (
              <p className="text-gray-300 italic text-sm">Your signature will appear here</p>
            )}
          </div>
          <p className="text-xs text-gray-400">
            ✏ By typing your name, you are electronically signing this reference letter.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Draw your signature <span className="text-rose-600">*</span>
          </label>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={480}
              height={120}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-rose-600 hover:underline"
          >
            Clear
          </button>
          <p className="text-xs text-gray-400">
            ✏ By drawing your signature, you are electronically signing this reference letter.
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 0 — Landing
══════════════════════════════════════════ */
function LandingStep({ onChoose }) {
  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Referee Portal</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
          You have been invited to submit a letter of reference for a faculty applicant.
          Please choose how you would like to proceed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div
          onClick={() => onChoose("register")}
          className="border-2 border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:border-rose-300 hover:shadow-md transition"
        >
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-rose-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Register &amp; Submit</h3>
          <p className="text-sm text-gray-500 text-center">
            Create an account to submit your reference letter. You can log back in anytime to review your submission.
          </p>
          <button className="mt-2 w-full bg-rose-700 hover:bg-rose-800 text-white font-semibold py-2.5 rounded-lg transition text-sm">
            Register &amp; Continue
          </button>
        </div>

        <div
          onClick={() => onChoose("guest")}
          className="border-2 border-rose-700 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:shadow-md transition"
        >
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-rose-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Submit Without Registering</h3>
          <p className="text-sm text-gray-500 text-center">
            Submit your reference letter directly without creating an account. Quick and hassle-free.
          </p>
          <button className="mt-2 w-full border-2 border-rose-700 text-rose-700 hover:bg-rose-50 font-semibold py-2.5 rounded-lg transition text-sm">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8)           errors.push("At least 8 characters");
  if (!/[A-Z]/.test(pwd))       errors.push("One uppercase letter");
  if (!/[a-z]/.test(pwd))       errors.push("One lowercase letter");
  if (!/\d/.test(pwd))          errors.push("One number");
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pwd)) errors.push("One special character");
  return errors;
}
/* ══════════════════════════════════════════
   STEP 1a — Register / Login
══════════════════════════════════════════ */
function RegisterStep({ onBack, onSuccess }) {
  const [tab,     setTab]     = useState("register");
  const [form,    setForm]    = useState({ salutation:"Prof.", name:"", email:"", designation:"", password:"", confirm:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
  e.preventDefault();
  setError("");
  if (form.password !== form.confirm) return setError("Passwords do not match");
  const pwdErrors = validatePassword(form.password);
  if (pwdErrors.length > 0) return setError(`Password requirements: ${pwdErrors.join(", ")}`);
  setLoading(true);
  try {
    await axios.post(`${BASE}/auth/register`, {
      name: `${form.salutation} ${form.name}`,
      email: form.email,
      password: form.password,
      role: "REFEREE",
    });
    const res = await axios.post(`${BASE}/auth/login`, { email: form.email, password: form.password });
    localStorage.setItem("token", res.data.token);
    onSuccess();
  } catch (err) {
    const msg = err.response?.data?.msg || err.response?.data?.message || "";
    //  If already registered, try logging in directly
    if (err.response?.status === 400 && (msg.toLowerCase().includes("exist") || msg.toLowerCase().includes("already"))) {
      setError("This email is already registered. Please use the Login tab instead.");
      setTab("login");  // ← auto-switch to login tab
    } else {
      setError(msg || "Registration failed");
    }
  } finally {
    setLoading(false);
  }
};

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/auth/login`, { email: form.email, password: form.password });
      localStorage.setItem("token", res.data.token);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        ← Back
      </button>

      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
        {["register", "login"].map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${tab === t ? "bg-rose-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            {t === "register" ? "Register" : "Login"}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      {tab === "register" ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Create your account</h2>
          <p className="text-sm text-gray-500">Register to submit your reference letter securely.</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Salutation" required>
              <select name="salutation" value={form.salutation} onChange={change} className={inputCls}>
                {SALUTATIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Full Name" required>
              <input name="name" placeholder="Your full name" value={form.name} onChange={change} required className={inputCls} />
            </Field>
          </div>

          <Field label="Email ID" required>
            <input type="email" name="email" placeholder="Your email address" value={form.email} onChange={change} required className={inputCls} />
          </Field>

          <Field label="Designation" required>
            <input name="designation" placeholder="e.g. Professor, Scientist" value={form.designation} onChange={change} required className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Password" required>
              <PwdField name="password" placeholder="Create password" value={form.password} onChange={change} />
              {form.password && validatePassword(form.password).length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {validatePassword(form.password).map(e => (
                    <p key={e} className="text-xs text-red-500">• {e}</p>
                  ))}
                </div>
              )}
              {form.password && validatePassword(form.password).length === 0 && (
                <p className="text-xs text-green-600 mt-1">Password strength: Good</p>
              )}
            </Field>
            <Field label="Confirm Password" required>
              <PwdField name="confirm" placeholder="Repeat password" value={form.confirm} onChange={change} />
            </Field>
          </div>

          <button disabled={loading} className="w-full bg-rose-700 hover:bg-rose-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? "Registering..." : "Register & Proceed"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
          <Field label="Email ID" required>
            <input type="email" name="email" placeholder="Your email" value={form.email} onChange={change} required className={inputCls} />
          </Field>
          <Field label="Password" required>
            <PwdField name="password" placeholder="Your password" value={form.password} onChange={change} />
          </Field>
          <button disabled={loading} className="w-full bg-rose-700 hover:bg-rose-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60">
            {loading ? "Logging in..." : "Login & Proceed"}
          </button>
        </form>
      )}
    </div>
  );
}

function AuthenticatedSubmitStep({ refereeId, candidateName, onDone }) {
  const [file,      setFile]      = useState(null);
  const [signature, setSignature] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file)      return setError("Please upload your reference letter (PDF).");
    if (!signature) return setError("Please provide your signature.");

    const formData = new FormData();
    formData.append("letter",     file);
    formData.append("signedName", typeof signature === "string" && signature.startsWith("data:")
      ? signature : signature);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(`${BASE}/referee/upload/${refereeId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Submit Reference Letter</h2>
      <p className="text-sm text-gray-500">For candidate: <strong>{candidateName}</strong></p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <Field label="Upload Reference Letter (PDF)" required>
        {!file ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-rose-400 transition">
            <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
            <span className="text-sm text-gray-500">Click to upload PDF</span>
          </label>
        ) : (
          <div className="flex items-center justify-between border border-green-200 bg-green-50 rounded-xl px-4 py-3">
            <span className="text-sm text-green-700">📄 {file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="text-red-500 text-xs">Remove</button>
          </div>
        )}
      </Field>

      <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Signature</p>
      <SignatureInput onSignatureReady={setSignature} />

      <button disabled={loading}
        className="w-full bg-rose-700 hover:bg-rose-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
        {loading ? "Submitting..." : "Submit Reference Letter"}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════
   STEP 1b — Guest submit
══════════════════════════════════════════ */
function GuestStep({ refereeId, candidateName, prefillName, prefillEmail, onBack }) {
  const [form, setForm] = useState({
    salutation:  "Dr.",
    name:        prefillName  || "",
    email:       prefillEmail || "",
    designation: "",
    department:  "",
    institute:   "",
  });
  const [file,      setFile]      = useState(null);
  const [signature, setSignature] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file)      return setError("Please upload your reference letter (PDF).");
    if (!signature) return setError("Please provide your signature.");

    const formData = new FormData();
    formData.append("letter",      file);
    formData.append("signedName",  typeof signature === "string" && signature.startsWith("data:")
      ? `${form.salutation} ${form.name}` : signature);
    formData.append("guestEmail",  form.email);
    formData.append("designation", form.designation);
    formData.append("department",  form.department);
    formData.append("institute",   form.institute);

    try {
      setLoading(true);
      await axios.post(`${BASE}/referee/upload/${refereeId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800">Submit Reference Letter</h2>
      <p className="text-sm text-gray-500 mt-1 mb-5">No account required. Fill in your details and submit.</p>

      {/* Guest warning */}
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex gap-2">
        <span>⚠</span>
        <span>Submitting as a guest means you will not be able to revisit or modify your submission later.</span>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 flex gap-2 items-center">
          Reference letter submitted successfully! Thank you.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Your Details</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Salutation" required>
            <select name="salutation" value={form.salutation} onChange={change} className={inputCls}>
              {SALUTATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Full Name" required>
            <input name="name" placeholder="Your full name" value={form.name} onChange={change} required className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email ID" required>
            <input type="email" name="email" placeholder="Your email" value={form.email} onChange={change} required className={inputCls} />
          </Field>
          <Field label="Designation" required>
            <input name="designation" placeholder="e.g. Professor" value={form.designation} onChange={change} required className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Department">
            <input name="department" placeholder="e.g. CSE" value={form.department} onChange={change} className={inputCls} />
          </Field>
          <Field label="Institute / Organisation" required>
            <input name="institute" placeholder="e.g. IIT Delhi" value={form.institute} onChange={change} required className={inputCls} />
          </Field>
        </div>

        {/* Letter Upload */}
        <p className="text-xs font-bold text-rose-700 uppercase tracking-widest pt-2">Letter of Reference</p>

        <Field label="Upload Reference Letter" required>
          {!file ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition">
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
              <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-gray-500">Click to upload your letter of reference</span>
              <span className="text-xs text-gray-400 mt-1">PDF only · Max 4MB</span>
            </label>
          ) : (
            <div className="flex items-center justify-between border border-green-200 bg-green-50 rounded-xl px-4 py-3">
              <span className="text-sm text-green-700 font-medium">📄 {file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-red-500 text-xs hover:underline">Remove</button>
            </div>
          )}
        </Field>

        {/* Signature */}
        <p className="text-xs font-bold text-rose-700 uppercase tracking-widest pt-2">Signature</p>
        <SignatureInput onSignatureReady={setSignature} />

        {!success && (
          <button
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-xl transition text-white ${
              success
                ? "bg-green-600 cursor-default"
                : "bg-rose-700 hover:bg-rose-800 disabled:opacity-60"
            }`}
          >
            {loading ? "Submitting..." : success ? "Submitted ✓" : "Submit Reference Letter"}
          </button>
        )}
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function RefereePage() {
  const { refereeId } = useParams();
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [step,    setStep]    = useState("landing");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaInput,    setCaptchaInput]    = useState("");
  const [captchaError,    setCaptchaError]    = useState("");
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  useEffect(() => {
    localStorage.removeItem("token");
  }, []);
  useEffect(() => {
  axios
    .get(`${BASE}/referee/info/${refereeId}`)
    .then((res) => {
      setInfo(res.data);
      if (res.data.alreadySubmitted) setStep("done");
      setRequiresCaptcha(!!res.data.requiresCaptcha); // ← SET from API
    })
    .catch(() => setError("This link is invalid or has expired."))
    .finally(() => setLoading(false));
}, [refereeId]);

  /* ── wrapper with LNMIIT background ── */
  const Wrapper = ({ children }) => (
    <div
      className="min-h-screen flex items-center justify-center ng-white bg-no-repeat bg-center bg-cover py-10 px-4"
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-700 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">
            IP
          </div>
          <div>
            <p className="font-bold text-white drop-shadow leading-tight">Institute Portal</p>
            <p className="text-xs text-white/70 drop-shadow">Faculty Recruitment</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <Wrapper>
      <p className="text-center text-gray-400 py-10">Loading...</p>
    </Wrapper>
  );

  if (error) return (
    <Wrapper>
      <div className="text-center py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </Wrapper>
  );

  if (step === "done") return (
    <Wrapper>
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Already Submitted</h2>
        <p className="text-gray-500 text-sm">
          Your reference letter for <strong>{info?.candidateName}</strong> has already been submitted.
        </p>
      </div>
    </Wrapper>
  );

   if (loading) return <Wrapper><p className="text-center text-gray-400 py-10">Loading...</p></Wrapper>;
  if (error)   return <Wrapper><div className="text-center py-8"><h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h2><p className="text-gray-500 text-sm">{error}</p></div></Wrapper>;
  if (step === "done") return (
    <Wrapper>
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Already Submitted</h2>
        <p className="text-gray-500 text-sm">Your reference letter for <strong>{info?.candidateName}</strong> has already been submitted.</p>
      </div>
    </Wrapper>
  );

  // ── CAPTCHA gate — shown before landing if requiresCaptcha ──
  if (requiresCaptcha && !captchaVerified) return (
  <Wrapper>
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-rose-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Enter Your Access Code</h2>
        <p className="text-sm text-gray-500 mt-2">
          Check the reference letter invitation email you received.<br/>
          Enter the 6-character access code shown in the email.
        </p>
      </div>

      <input
        type="text"
        maxLength={6}
        autoFocus
        value={captchaInput}
        onChange={e => {
          setCaptchaInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
          if (captchaError) setCaptchaError("");
        }}
        placeholder="e.g. A3F9B2"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest uppercase focus:outline-none focus:border-red-400"
      />

      {captchaError && <p className="text-red-600 text-sm text-center">{captchaError}</p>}

      <button
        onClick={async () => {
          try {
            await axios.post(`${BASE}/referee/verify-captcha`, { refereeId, captcha: captchaInput });
            setCaptchaVerified(true);
            setRequiresCaptcha(false);
          } catch (err) {
            setCaptchaError(err.response?.data?.message || "Incorrect code. Please try again.");
          }
        }}
        disabled={captchaInput.length < 6}
        className="w-full bg-rose-700 hover:bg-rose-800 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition"
      >
        Verify & Continue
      </button>
    </div>
  </Wrapper>
);

  // ── Normal flow ──
  return (
    <Wrapper>
      {step === "landing"  && <LandingStep onChoose={setStep} />}
      {step === "register" && <RegisterStep onBack={() => setStep("landing")} onSuccess={() => setStep("submit")} />}
      {step === "submit"   && <AuthenticatedSubmitStep refereeId={refereeId} candidateName={info?.candidateName} onDone={() => setStep("done")} />}
      {step === "guest"    && <GuestStep refereeId={refereeId} candidateName={info?.candidateName} prefillName={info?.refereeName} prefillEmail={info?.refereeEmail} onBack={() => setStep("landing")} />}
    </Wrapper>
  )
}