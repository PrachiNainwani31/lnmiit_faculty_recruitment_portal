import { Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerify      from "./pages/OtpVerify";
import ResetPassword  from "./pages/ResetPassword";

import HodLayout    from "./components/layouts/HodLayout";
import HodDashboard from "./pages/hod/Dashboard";
import Candidates   from "./pages/hod/Candidates";
import Experts      from "./pages/hod/Experts";
import Comments     from "./pages/dofa/Comments";

import DofaLayout       from "./components/layouts/DofaLayout";
import DofaDashboard    from "./pages/dofa/Dashboard";
import DofaCandidates   from "./pages/dofa/Candidates";
import DofaExperts      from "./pages/dofa/Experts";
import DofaComments     from "./pages/dofa/Comments";
import DocumentTracking from "./pages/dofa/DocumentTracking";

import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import RefereePage        from "./pages/Referee/RefereePage";
import ProtectedRoute     from "./components/ProtectedRoute";


export default function App() {
  return (
    <Routes>

      {/* Root */}
      <Route path="/" element={<Navigate to="/register" />} />

      {/* Auth */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp"      element={<OtpVerify />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Referee portal — PUBLIC, no login needed */}
      <Route path="/referee/:refereeId" element={<RefereePage />} />

      {/* HOD */}
      <Route
        path="/hod"
        element={<ProtectedRoute role="HOD"><HodLayout /></ProtectedRoute>}
      >
        <Route index             element={<HodDashboard />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="experts"    element={<Experts />} />
        <Route path="comments"   element={<Comments />} />
      </Route>

      {/* DOFA */}
      <Route
        path="/dofa"
        element={<ProtectedRoute role="DOFA"><DofaLayout /></ProtectedRoute>}
      >
        <Route index                    element={<DofaDashboard />} />
        <Route path="candidates"        element={<DofaCandidates />} />
        <Route path="experts"           element={<DofaExperts />} />
        <Route path="comments"          element={<DofaComments />} />
        {/* FIX: absolute path "/dofa/document-tracking" → relative "document-tracking" */}
        <Route path="document-tracking" element={<DocumentTracking />} />
      </Route>

      {/* Candidate */}
      <Route
        path="/candidate"
        element={<ProtectedRoute role="CANDIDATE"><CandidateDashboard /></ProtectedRoute>}
      />

    </Routes>
  );
}