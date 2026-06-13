import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "sonner";

import ErrorBoundary from "@/components/common/ErrorBoundary";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Public pages
const Home = lazy(() => import("@/pages/public/Home"));
const SearchPage = lazy(() => import("@/pages/public/SearchPage"));
const ListingDetails = lazy(() => import("@/pages/public/ListingDetails"));
const Login = lazy(() => import("@/pages/public/Login"));
const ForgotPassword = lazy(() => import("@/pages/public/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/public/ResetPassword"));

// User pages
const Trips = lazy(() => import("@/pages/user/Trips"));
const Wishlist = lazy(() => import("@/pages/user/Wishlist"));
const Profile = lazy(() => import("@/pages/user/Profile"));
const Chat = lazy(() => import("@/pages/user/Chat"));
const BecomeHost = lazy(() => import("@/pages/user/BecomeHost"));

// Host pages
const HostDashboard = lazy(() => import("@/pages/host/HostDashboard"));
const HostBookings = lazy(() => import("@/pages/host/HostBookings"));
const CreateListing = lazy(() => import("@/pages/host/CreateListing"));
const EditListing = lazy(() => import("@/pages/host/EditListing"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminListings = lazy(() => import("@/pages/admin/AdminListings"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminHosts = lazy(() => import("@/pages/admin/AdminHosts"));

const fallback = (
  <div className="flex h-screen items-center justify-center">Loading...</div>
);

const isAuthRoute = (pathname: string) =>
  pathname === "/login" ||
  pathname === "/forgot-password" ||
  pathname.startsWith("/reset-password");

function AppLayout() {
  const location = useLocation();
  const hideNavbar = isAuthRoute(location.pathname);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      {!hideNavbar && <Navbar />}

      <main className={`flex-grow ${!hideNavbar ? "pt-16 sm:pt-20 pb-16 md:pb-0" : ""}`}>
        <Suspense fallback={fallback}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* User (protected) */}
            <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat/:bookingId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/become-host" element={<ProtectedRoute><BecomeHost /></ProtectedRoute>} />

            {/* Host (protected) */}
            <Route path="/host/dashboard" element={<ProtectedRoute allowedRoles={["host", "admin"]}><HostDashboard /></ProtectedRoute>} />
            <Route path="/host/bookings" element={<ProtectedRoute allowedRoles={["host", "admin"]}><HostBookings /></ProtectedRoute>} />
            <Route path="/host/create-listing" element={<ProtectedRoute allowedRoles={["host", "admin"]}><CreateListing /></ProtectedRoute>} />
            <Route path="/host/edit-listing/:id" element={<ProtectedRoute allowedRoles={["host", "admin"]}><EditListing /></ProtectedRoute>} />

            {/* Admin (protected) */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/listings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminListings /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBookings /></ProtectedRoute>} />
            <Route path="/admin/hosts" element={<ProtectedRoute allowedRoles={["admin"]}><AdminHosts /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<div className="flex h-screen items-center justify-center">404 Page Not Found</div>} />
          </Routes>
        </Suspense>
      </main>

      {!hideNavbar && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppLayout />
        <Toaster richColors position="bottom-right" />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
