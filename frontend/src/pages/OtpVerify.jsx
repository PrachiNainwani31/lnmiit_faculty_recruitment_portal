import AuthLayout from "../components/layouts/AuthLayout";

export default function OtpVerify() {
  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">
          Verify OTP
        </h2>
        <p className="text-sm text-gray-500">
          Enter the OTP sent to your email
        </p>
      </div>

      <form className="space-y-4">
        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Verify OTP
        </button>
      </form>
    </AuthLayout>
  );
}
