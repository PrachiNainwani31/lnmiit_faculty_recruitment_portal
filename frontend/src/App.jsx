import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerify from "./pages/OtpVerify";
import ResetPassword from "./pages/ResetPassword";

import HodLayout from "./components/layouts/HodLayout";
import HodDashboard from "./pages/hod/Dashboard";
import Candidates from "./pages/hod/Candidates";
import Experts from "./pages/hod/Experts";

import DofaLayout from "./components/layouts/DofaLayout";
import DofaDashboard from "./pages/dofa/Dashboard";
import DofaCandidates from "./pages/dofa/Candidates";
import DofaExperts from "./pages/dofa/Experts";
import DofaComments from "./pages/dofa/Comments";
import Comments from "./pages/dofa/Comments";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
      <Routes>

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* HOD Portal with Sidebar Layout */}
        <Route
          path="/hod"
          element={
            <ProtectedRoute role="HOD">
              <HodLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HodDashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="experts" element={<Experts />} />
          <Route path="comments" element={<Comments />} />
        </Route>

       {/* DOFA Portal */}
        <Route
          path="/dofa"
          element={
            <ProtectedRoute role="DOFA">
              <DofaLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DofaDashboard />} />
          <Route path="candidates" element={<DofaCandidates />} />
          <Route path="experts" element={<DofaExperts />} />
          <Route path="comments" element={<DofaComments />} /> 
        </Route>

      </Routes>
  );
}
