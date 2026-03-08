import bg from "../../assets/LNMIIT_campus_image.jpg";

export default function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-no-repeat bg-center bg-cover"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="bg-white/95 backdrop-blur shadow-2xl rounded-lg w-full max-w-md p-8">
        {children}
      </div>
    </div>
  );
}
