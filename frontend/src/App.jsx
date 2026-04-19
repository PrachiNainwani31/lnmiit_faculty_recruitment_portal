import { Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerify      from "./pages/OtpVerify";
import ResetPassword  from "./pages/ResetPassword";

import ToastProvider from "./components/ui/Toast";

import HodLayout    from "./components/layouts/HodLayout";
import HodDashboard from "./pages/hod/Dashboard";
import Candidates   from "./pages/hod/Candidates";
import Experts      from "./pages/hod/Experts";
import Comments     from "./pages/hod/Comments";
import HodLogs from "./pages/hod/Logs";

import DofaLayout            from "./components/layouts/DofaLayout";
import DofaDashboard         from "./pages/dofa/Dashboard";
import DofaCandidates        from "./pages/dofa/Candidates";
import DofaExperts           from "./pages/dofa/Experts";
import DofaComments          from "./pages/dofa/Comments";
import DocumentTracking      from "./pages/dofa/DocumentTracking";
import QuoteApproval         from "./pages/dofa/Quoteapproval";
import DofaLogs from "./pages/dofa/Logs";

import DofaOfficeLayout     from "./components/layouts/Dofaofficelayout";
import DofaOfficeDashboard  from "./pages/dofa-office/DofaOfficedashboard";
import DofaOfficeCandidates from "./pages/dofa-office/Dofaofficecandidates";
import ExpertConfirmation   from "./pages/dofa-office/Expertconfirmation";
import PickupDropManager    from "./pages/dofa-office/Pickupdropmanager";
import SelectCandidates     from "./pages/dofa-office/SelectedCandidates";
import RoomAllotmentPage    from "./pages/dofa-office/RoomAllotmentPage";
import InterviewLogs from "./pages/dofa-office/InterviewLogs";
import Registration  from "./pages/dofa-office/Registration";

import TravelPortalLayout from "./components/layouts/Travelportallayout";
import ExpertTravelPage   from "./pages/travel/Experttravelpage";
import TravelQuotes       from "./pages/travel/TravelQuotes";
import TravelTickets      from "./pages/travel/TravelTickets";
import TravelInvoices     from "./pages/travel/TravelInvoices";
import TravelPickup       from "./pages/travel/TravelPickup";

import { EstablishmentLayout, EstateLayout, LucsLayout } from "./components/layouts/NewLayouts";
import EstablishmentPage from "./pages/Establishmentpage";
import { EstatePage }    from "./pages/Estateandlucspage";
import { LucsPage }      from "./pages/Estateandlucspage";
import EstablishmentDashboard from "./pages/EstablishmentDashboard";
import EstablishmentOnboarding from "./pages/Establishmentpage";
import EstablishmentRoomView from "./pages/EstablishmentRoomView";


import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import RefereePage        from "./pages/Referee/RefereePage";
import ProtectedRoute     from "./components/ProtectedRoute";

export default function App() {
  return (
    <><ToastProvider />
    <Routes>

      {/* Root */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Auth */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp"      element={<OtpVerify />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Referee portal — PUBLIC */}
      <Route path="/referee/:refereeId" element={<RefereePage />} />

      {/* HOD */}
      <Route path="/hod" element={<ProtectedRoute role="HOD"><HodLayout /></ProtectedRoute>}>
        <Route index element={<HodDashboard />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="experts"    element={<Experts />} />
        <Route path="comments"   element={<Comments />} />
        <Route path="logs" element={<HodLogs />} />
      </Route>

      {/* DOFA */}
      <Route path="/dofa" element={<ProtectedRoute role="DOFA"><DofaLayout /></ProtectedRoute>}>
        <Route index                    element={<DofaDashboard />} />
        <Route path="candidates"        element={<DofaCandidates />} />
        <Route path="experts"           element={<DofaExperts />} />
        <Route path="comments"          element={<DofaComments />} />
        <Route path="document-tracking" element={<DocumentTracking />} />
        <Route path="quote-approval"    element={<QuoteApproval />} />
        <Route path="logs" element={<DofaLogs />} />
      </Route>

      {/* Candidate */}
      <Route
        path="/candidate"
        element={<ProtectedRoute role="CANDIDATE"><CandidateDashboard /></ProtectedRoute>}
      />

      {/* DOFA Office */}
      <Route path="/dofa-office" element={
        <ProtectedRoute role="DOFA_OFFICE"><DofaOfficeLayout /></ProtectedRoute>
      }>
        <Route index                     element={<DofaOfficeDashboard />} />
        <Route path="candidates"         element={<DofaOfficeCandidates />} />
        <Route path="document-tracking"  element={<DocumentTracking />} />
        <Route path="experts"            element={<ExpertConfirmation />} />
        <Route path="pickup"             element={<PickupDropManager />} />
        <Route path="select-candidates"  element={<SelectCandidates />} />
        <Route path="room-allotment"     element={<RoomAllotmentPage />} />
        <Route path="comments"           element={<DofaComments />} />
        <Route path="logs"       element={<InterviewLogs/>}/>
        <Route path="registration" element={<Registration />} />
        <Route path="cycle-logs" element={<DofaLogs/>}/>
      </Route>

      {/* Travel */}
      <Route path="/travel" element={
        <ProtectedRoute role="REGISTRAR_OFFICE"><TravelPortalLayout /></ProtectedRoute>
      }>
        <Route index           element={<ExpertTravelPage />} />
        <Route path="quotes"   element={<TravelQuotes />} />
        <Route path="tickets"  element={<TravelTickets />} />
        <Route path="invoices" element={<TravelInvoices />} />
        <Route path="pickup"   element={<TravelPickup />} />
      </Route>

      {/* Establishment */}
      <Route path="/establishment" element={<ProtectedRoute role="ESTABLISHMENT"><EstablishmentLayout /></ProtectedRoute>}>
        <Route index              element={<EstablishmentDashboard />} />
        <Route path="onboarding"      element={<EstablishmentOnboarding />} />
        <Route path="room-allotment"  element={<EstablishmentRoomView />} />
      </Route>

      {/* Estate */}
      <Route path="/estate" element={<ProtectedRoute role="ESTATE"><EstateLayout /></ProtectedRoute>}>
        <Route index element={<EstatePage />} />
      </Route>

      {/* LUCS */}
      <Route path="/lucs" element={<ProtectedRoute role="LUCS"><LucsLayout /></ProtectedRoute>}>
        <Route index element={<LucsPage />} />
      </Route>

    </Routes>
    </>
  );
}