import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX, HiBell, HiLogout } from 'react-icons/hi';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user session:', e);
      }
    }
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Base navigation links
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  // Show Admin link exclusively if logged in as an admin
  if (currentUser?.role === 'admin') {
    navLinks.push({ path: '/admin', label: 'Admin' });
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                Smart<span className="text-primary">Service</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 transition-all duration-200"
                  >
                    <HiBell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
                  </Link>

                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-surface hover:bg-surface-dark transition-all duration-200 border border-border"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {getInitials(currentUser.name)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
                  >
                    <HiLogout className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 cursor-pointer shadow-sm"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 pt-2 space-y-1 bg-white border-t border-border">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-border">
              {currentUser ? (
                <div className="flex items-center justify-between px-2 py-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {getInitials(currentUser.name)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-text-primary">{currentUser.name}</p>
                      <p className="text-xs text-text-muted">{currentUser.phone}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                    className="p-2 text-text-muted hover:text-danger rounded-lg"
                  >
                    <HiLogout className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full mt-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}