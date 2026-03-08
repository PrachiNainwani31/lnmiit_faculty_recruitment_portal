import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/layouts/AuthLayout";

export default function ResetPassword() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <h2 className="text-center text-lg font-semibold mb-4">Reset Password</h2>

      <input className="w-full border p-2 rounded mb-3" placeholder="New Password" />
      <input className="w-full border p-2 rounded mb-3" placeholder="Confirm Password" />

      <button
        onClick={() => navigate("/login")}
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        Submit
      </button>
    </AuthLayout>
  );
}
