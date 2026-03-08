import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/layouts/AuthLayout";

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <h2 className="text-center text-lg font-semibold mb-4">Forgot Password</h2>

      <form className="space-y-4">
        <input className="w-full border p-2 rounded" placeholder="Email" />
        <button
          type="button"
          onClick={() => navigate("/verify-otp")}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Send OTP
        </button>
      </form>
    </AuthLayout>
  );
}
