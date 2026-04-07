// Frontend-safe validators — import in React components

export const validators = {
  /** Email must have @ and valid domain */
  email: (v) => {
    if (!v) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address";
    return null;
  },

  /** Full name — no digits allowed */
  fullName: (v) => {
    if (!v?.trim()) return "Full name is required";
    if (/\d/.test(v)) return "Name should not contain numbers";
    if (v.trim().length < 2) return "Name is too short";
    return null;
  },

  /** Phone — exactly 10 digits */
  phone: (v) => {
    if (!v) return null; // optional
    if (!/^\d{10}$/.test(v.replace(/\s/g, ""))) return "Phone number must be exactly 10 digits";
    return null;
  },

  /** Password strength */
  password: (v) => {
    if (!v) return "Password is required";
    if (v.length < 8) return "Minimum 8 characters required";
    if (!/[A-Z]/.test(v)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(v)) return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(v)) return "Must contain at least one number";
    if (!/[@#$%!&*]/.test(v)) return "Must contain at least one special character (@#$%!&*)";
    return null;
  },

  /** Department code */
  required: (v, label = "This field") => {
    if (!v?.toString().trim()) return `${label} is required`;
    return null;
  },
};

/** Hook-friendly: returns error string or null */
export function validate(rules, values) {
  const errors = {};
  for (const [field, fn] of Object.entries(rules)) {
    const err = fn(values[field]);
    if (err) errors[field] = err;
  }
  return errors;
}