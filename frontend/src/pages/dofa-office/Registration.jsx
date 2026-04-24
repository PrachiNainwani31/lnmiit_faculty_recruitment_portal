import { useState, useEffect } from "react";
import API from "../../api/api";

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Communication and Computer Engineering",
  "Mechanical-Mechatronics Engineering",
  "Physics",
  "Mathematics",
  "Humanities and Social Sciences",
  "Artificial Intelligence and Data Science",
  "Other",
];

const ROLES = [
  { value: "DOFA",          label: "Dean of Faculty Affairs(DoFA)"              },
  { value: "ADOFA",            label: "Assistant Dean of Faculty Affairs (ADoFA)" },
  { value: "DOFA_OFFICE",   label: "DoFA Office"       },
  { value: "HOD",           label: "Head of Department(HoD)"               },
  { value: "ESTABLISHMENT", label: "Establishment"     },
  { value: "LUCS",          label: "LUCS"              },
  { value: "ESTATE",        label: "Estate"            },
  { value: "REGISTRAR_OFFICE",        label: "Registrar Office (Travel)" },
  { value: "OTHER",         label: "Other"             },
];

/* ── Inline field error ── */
function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1">{error}</p>;
}

/* ── Input wrapper with validation ── */
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <FieldError error={error} />
    </div>
  );
}

const inputCls = (err) =>
  `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 transition ${
    err ? "border-red-400 bg-red-50" : "border-gray-200"
  }`;

/* ══════════════════════════
   Validators
══════════════════════════ */
function validateEmail(v) {
  if (!v?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address";
  return null;
}
function validateName(v) {
  if (!v?.trim()) return "Full name is required";
  if (/\d/.test(v)) return "Name should not contain numbers";
  if (v.trim().length < 2) return "Name is too short";
  return null;
}
function validatePassword(v) {
  if (!v) return "Password is required";
  if (v.length < 8) return "Minimum 8 characters";
  if (!/[A-Z]/.test(v)) return "Must include an uppercase letter";
  if (!/[a-z]/.test(v)) return "Must include a lowercase letter";
  if (!/[0-9]/.test(v)) return "Must include a number";
  if (!/[@#$%!&*]/.test(v)) return "Must include a special character (@#$%!&*)";
  return null;
}

/* ══════════════════════════
   Register User Tab
══════════════════════════ */
function RegisterUser({ onRefresh }) {
  const [form, setForm] = useState({
    name: "", email: "", role: "", department: "", otherRole: "",
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    // Clear error on change
    setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    const nameErr  = validateName(form.name);
    const emailErr = validateEmail(form.email);
    if (nameErr)  e.name  = nameErr;
    if (emailErr) e.email = emailErr;
    if (!form.role) e.role = "Role is required";
    if (form.role === "HOD" && !form.department) e.department = "Department is required for HOD";
    if (form.role === "OTHER" && !form.otherRole.trim()) e.otherRole = "Please specify role";
    if (form.department === "Other" && !form.otherDepartment?.trim())
      e.otherDepartment = "Please specify department";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    try {
      setSaving(true);
      setSuccess("");
      await API.post("/registration/users", form);
      setSuccess(`✓ ${form.name} registered. Login credentials sent to ${form.email}.`);
      setForm({ name: "", email: "", role: "", department: "", otherRole: "" });
      setErrors({});
      onRefresh();
    } catch (err) {
      setErrors({ _global: err.response?.data?.message || "Registration failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800">Register New User</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          A system-generated password will be emailed to the user immediately.
        </p>
      </div>

      {errors._global && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {errors._global}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}>
          <input
            className={inputCls(errors.name)}
            placeholder="e.g. Dr. Ramesh Kumar"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            onKeyPress={e => { if (/\d/.test(e.key)) e.preventDefault(); }}
          />
        </Field>

        <Field label="Email Address" required error={errors.email}>
          <input
            type="email"
            className={inputCls(errors.email)}
            placeholder="e.g. hod.cse@lnmiit.ac.in"
            value={form.email}
            onChange={e => set("email", e.target.value)}
          />
        </Field>

        <Field label="Role" required error={errors.role}>
          <select
            className={inputCls(errors.role)}
            value={form.role}
            onChange={e => set("role", e.target.value)}
          >
            <option value="">— Select Role —</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>

        {form.role === "OTHER" && (
          <Field label="Specify Role" required error={errors.otherRole}>
            <input
              className={inputCls(errors.otherRole)}
              placeholder="Enter role name"
              value={form.otherRole}
              onChange={e => set("otherRole", e.target.value)}
            />
          </Field>
        )}

        <Field label="Department" error={errors.department}>
          <select
            className={inputCls(errors.department)}
            value={form.department}
            onChange={e => set("department", e.target.value)}
          >
            <option value="">— Select Department (if applicable) —</option>
            {DEPARTMENTS.filter(d => d !== "Other").map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
            <option value="Other">Other</option>
          </select>
        </Field>
        {form.department === "Other" && (
          <Field label="Specify Department" required error={errors.otherDepartment}>
            <input
              className={inputCls(errors.otherDepartment)}
              placeholder="Enter department name"
              value={form.otherDepartment || ""}
              onChange={e => set("otherDepartment", e.target.value)}
            />
          </Field>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition"
        >
          {saving ? "Registering…" : "Register & Send Credentials"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════
   User List Tab
══════════════════════════ */
function UserList({ users, onDelete }) {
  const [filter, setFilter] = useState("");

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    u.role.toLowerCase().includes(filter.toLowerCase())
  );

  const roleColor = {
    DOFA:          "bg-red-100 text-red-700 border-red-200",
    DOFA_OFFICE:   "bg-rose-100 text-rose-700 border-rose-200",
    HOD:           "bg-blue-100 text-blue-700 border-blue-200",
    ESTABLISHMENT: "bg-amber-100 text-amber-700 border-amber-200",
    LUCS:          "bg-purple-100 text-purple-700 border-purple-200",
    ESTATE:        "bg-teal-100 text-teal-700 border-teal-200",
    TRAVEL:        "bg-indigo-100 text-indigo-700 border-indigo-200",
    CANDIDATE:     "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-red-200"
          placeholder="Search by name, email or role…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <span className="text-xs text-gray-400">{filtered.length} users</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Registered</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400 italic">
                  No users found
                </td>
              </tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    roleColor[u.role] || "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">{u.department || "—"}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => {
                      if (!window.confirm(`Remove ${u.name}? They will lose portal access.`)) return;
                      onDelete(u.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════
   Main Registration Page
══════════════════════════ */
export default function Registration() {
  const [tab,     setTab]     = useState("register");
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/registration/users");
      setUsers(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/registration/users/${id}`);
      loadUsers();
    } catch {
      alert("Failed to remove user");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">User Registration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Register portal users. System-generated passwords are emailed automatically.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <span className="text-blue-500 mt-0.5 shrink-0">ℹ</span>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Candidates</strong> are automatically registered when their application email is first used — 
          no manual action needed.</p>
          <p><strong>HoD, DoFA, Establishment</strong> and all other staff must be registered here. 
          Credentials are sent by email instantly.</p>
          <p>Users can reset their password anytime using <strong>Forgot Password</strong> on the login page.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: "register", label: "➕ Register New User" },
          { id: "list",     label: `👥 All Users (${users.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? "bg-white shadow-sm text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {tab === "register" && <RegisterUser onRefresh={loadUsers} />}
        {tab === "list"     && (
          loading
            ? <p className="text-gray-400 text-sm">Loading…</p>
            : <UserList users={users} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}