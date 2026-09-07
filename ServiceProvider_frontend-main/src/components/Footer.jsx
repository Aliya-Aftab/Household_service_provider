import { Link } from 'react-router-dom';

const footerLinks = {
  Company: [
    { label: 'About Us', to: '/' },
    { label: 'Careers', to: '/' },
    { label: 'Press', to: '/' },
  ],
  Support: [
    { label: 'Help Center', to: '/' },
    { label: 'Safety', to: '/' },
    { label: 'Terms', to: '/' },
  ],
  Services: [
    { label: 'Electrician', to: '/services' },
    { label: 'Plumber', to: '/services' },
    { label: 'Beautician', to: '/services' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Smart<span className="text-primary-light">Service</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Find trusted service providers near you. Quality services at your doorstep.
            </p>
          </div>

          {/* Link Groups */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2024 Smart Service Hub. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <Link
                key={item}
                to="/"
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
