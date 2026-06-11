import { Link } from "react-router-dom";
import { Globe, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-rose-500">
              <Globe className="h-6 w-6" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-rose-500">Stay</span>
                <span className="text-gray-900">Finder</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Find and book unique stays around the world. From apartments to villas, experience travel like never before.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">Explore</h3>
            <ul className="space-y-3">
              {[
                { label: "Search Stays", to: "/search" },
                { label: "Become a Host", to: "/become-host" },
                { label: "Wishlist", to: "/wishlist" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-gray-500 transition hover:text-gray-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">Support</h3>
            <ul className="space-y-3">
              {[
                { label: "My Trips", to: "/trips" },
                { label: "Account Settings", to: "/account" },
                { label: "Help Center", to: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-gray-500 transition hover:text-gray-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">Legal</h3>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", to: "#" },
                { label: "Terms of Service", to: "#" },
                { label: "Cancellation Policy", to: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.to} className="text-sm text-gray-500 transition hover:text-gray-900">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} StayFinder. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            Made with <Heart className="h-3 w-3 text-rose-400" /> for travelers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
