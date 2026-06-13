import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  Menu,
  UserCircle2,
  LogOut,
  Heart,
  HomeIcon,
  MapPin,
  Settings,
  Shield,
  Home,
  Building2,
  Calendar,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { RootState } from "@/app/store";
import { logout } from "@/features/auth/authSlice";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        dropdownButtonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !dropdownButtonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? "border-b border-gray-200 bg-white shadow-sm"
            : "border-b border-transparent bg-white/95 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group flex items-center gap-2 text-rose-500 transition-colors hover:text-rose-600"
          >
            <div
            >
              <HomeIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <span className="hidden text-xl font-bold tracking-tight md:block">
              <span className="text-rose-500">Stay</span>
              <span className="text-gray-900">Finder</span>
            </span>
          </Link>

          <motion.div
            onClick={() => navigate("/search")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="hidden cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white py-2 pl-5 pr-2 shadow-sm transition-shadow duration-200 hover:shadow-md md:flex"
          >
            <span className="text-sm font-semibold text-gray-900">Anywhere</span>
            <div className="mx-2 h-6 w-px bg-gray-300" />
            <span className="text-sm font-semibold text-gray-900">Any week</span>
            <div className="mx-2 h-6 w-px bg-gray-300" />
            <span className="mr-3 text-sm font-light text-gray-500">Add guests</span>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full bg-rose-500 p-2 text-white transition-colors hover:bg-rose-600"
            >
              <Search className="h-4 w-4" strokeWidth={3} />
            </motion.div>
          </motion.div>

          <div className="flex items-center gap-2">
            <Link
              to={user ? (user?.role === "host" ? "/host/dashboard" : "/become-host") : "/login"}
              className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 md:block"
            >
              StayFinder your home
            </Link>

            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="relative hidden rounded-full p-2.5 text-gray-900 transition-colors hover:bg-gray-100 md:block"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {(user as any)?.wishlist?.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                    {(user as any).wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && <NotificationBell />}

            <div className="relative">
              <button
                ref={dropdownButtonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 rounded-full border bg-white p-1.5 pl-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                  isDropdownOpen ? "border-gray-400 shadow-md" : "border-gray-200"
                }`}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <Menu className="h-5 w-5 text-gray-600" />
                <motion.div
                  animate={{ scale: isAuthenticated ? 1 : 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {isAuthenticated && user?.profile?.profilePicture ? (
                    <img src={user.profile.profilePicture} alt={user.name || "User avatar"} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500" />
                  )}
                </motion.div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="border-b border-gray-100 px-4 py-4">
                          <div className="flex items-center gap-3">
                            {user?.profile?.profilePicture ? (
                              <img src={user.profile.profilePicture} alt={user.name || "User"} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                                <span className="text-lg font-semibold text-rose-500">
                                  {(user?.name || "U").charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || "User"}</p>
                              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          {[
                            { icon: MapPin, label: "My Trips", to: "/trips" },
                            { icon: Heart, label: "Wishlist", to: "/wishlist" },
                            { icon: Settings, label: "Account Settings", to: "/account" },
                            ...(user?.role === "host" ? [{ icon: Building2, label: "Host Dashboard", to: "/host/dashboard" }, { icon: Calendar, label: "Reservations", to: "/host/bookings" }] : []),
                            ...(user?.role === "admin" ? [{ icon: Shield, label: "Admin Panel", to: "/admin" }] : []),
                          ].map((item: any, index: number) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Link
                                to={item.to}
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                role="menuitem"
                              >
                                <item.icon className="h-4 w-4 text-gray-500" />
                                <span>{item.label}</span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                        <div className="border-t border-gray-100">
                          <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            role="menuitem"
                          >
                            <LogOut className="h-4 w-4 text-gray-500" />
                            <span>Log out</span>
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                        >
                          <Link
                            to="/login"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                            role="menuitem"
                          >
                            <UserCircle2 className="h-5 w-5 text-gray-500" />
                            <span>Log in</span>
                          </Link>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Link
                            to="/login"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            role="menuitem"
                          >
                            <HomeIcon className="h-5 w-5 text-gray-500" />
                            <span>Sign up</span>
                          </Link>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden pb-2">
        <div className="flex items-center justify-around py-1.5">
          {[
            { icon: Home, label: "Home", to: "/" },
            { icon: Search, label: "Search", to: "/search" },
            ...(isAuthenticated
              ? [{ icon: MapPin, label: "Trips", to: "/trips" }]
              : []),
            ...(isAuthenticated
              ? [
                  {
                    icon: Heart,
                    label: "Wishlist",
                    to: "/wishlist",
                    badge: (user as any)?.wishlist?.length,
                  },
                ]
              : []),
            {
              icon: UserCircle2,
              label: isAuthenticated ? "Profile" : "Log in",
              to: isAuthenticated ? "/account" : "/login",
            },
          ].map((item: any) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.action) item.action();
                else if (item.to) navigate(item.to);
              }}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive(item.to) ? "text-rose-500" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute -right-0.5 top-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold leading-none text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

    </>
  );
};

export default Navbar;
