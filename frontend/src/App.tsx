import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Search from "./pages/SearchPage";
import ListingDetails from "./pages/ListingDetails";
import Login from "./pages/Login";
import Trips from "./pages/Trips";
import Wishlist from "./pages/Wishlist";
import Chat from "./pages/Chat";
import HostDashboard from "./pages/HostDashboard";
import HostBookings from "./pages/HostBookings";
import CreateListing from "./pages/CreateListing";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import BecomeHost from "./pages/BecomeHost";
import EditListing from "./pages/EditListing";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminListings from "./pages/admin/AdminListings";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminHosts from "./pages/admin/AdminHosts";

function AppLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/forgot-password" || location.pathname.startsWith("/reset-password");

  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      {!isAuthPage && <Navbar />}

      <main className={`flex-grow ${!isAuthPage ? "pt-16 sm:pt-20 pb-16 md:pb-0" : ""}`}>
        <Routes>
          {/* STANDALONE PAGES (no Navbar/Footer) */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* PUBLIC ZONE */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listing/:id" element={<ListingDetails />} />

          {/* CUSTOMER ZONE (Requires Auth) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/trips" element={<Trips />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Profile />} />
            <Route path="/chat/:bookingId" element={<Chat />} />
            <Route path="/become-host" element={<BecomeHost />} />
          </Route>

          {/* ADMIN ZONE (Requires Auth AND 'admin' role) */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/listings" element={<AdminListings />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/hosts" element={<AdminHosts />} />
          </Route>

          {/* HOST ZONE (Requires Auth AND 'host' or 'admin' role) */}
          <Route
            element={<ProtectedRoute allowedRoles={["host", "admin"]} />}
          >
            <Route path="/host/dashboard" element={<HostDashboard />} />
            <Route path="/host/bookings" element={<HostBookings />} />
            <Route path="/host/create-listing" element={<CreateListing />} />
            <Route path="/host/edit-listing/:id" element={<EditListing />} />
          </Route>
        </Routes>
      </main>

      {!isAuthPage && <Footer />}
      <Toaster richColors position="bottom-right" />
    </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
