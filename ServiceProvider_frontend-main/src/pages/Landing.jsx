import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import CategoryCard from '../components/CategoryCard';
import ServiceCard from '../components/ServiceCard';
import API, { transformProvider } from '../utils/api';
import { categories } from '../data/categories';
import { providers as fallbackProviders } from '../data/providers';

export default function Landing() {
  const navigate = useNavigate();
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real providers from MongoDB Atlas for "Featured Providers"
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await API.get('/providers');
        const list = Array.isArray(res.data) ? res.data : [];
        const formatted = list.map(transformProvider);
        const recs = formatted.filter((p) => p.recommended);

        // Use live recommended providers, or fallback to top-rated live providers
        if (recs.length > 0) {
          setFeaturedProviders(recs.slice(0, 3));
        } else if (formatted.length > 0) {
          setFeaturedProviders(formatted.slice(0, 3));
        } else {
          setFeaturedProviders(fallbackProviders.filter((p) => p.recommended).slice(0, 3));
        }
      } catch (err) {
        console.warn('Using local fallback providers for landing page:', err.message);
        setFeaturedProviders(fallbackProviders.filter((p) => p.recommended).slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    loadFeatured();
  }, []);

  // When user clicks Search on SearchBar
  const handleSearch = ({ service, location, coords }) => {
    const params = new URLSearchParams();
    const term = (service || '').trim();
    const loc = (location || '').trim();

    if (term) params.set('search', term);
    if (loc) params.set('location', loc);
    if (coords?.lat && coords?.lng) {
      params.set('lat', coords.lat);
      params.set('lng', coords.lng);
    }

    navigate(`/services?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span>✨</span> Trusted by 10,000+ users
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary leading-tight tracking-tight">
              Find Trusted Services{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Near You
              </span>
            </h1>
            <p className="mt-5 text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
              Book verified professionals for home services within your area. From electricians to beauticians — quality service at your doorstep.
            </p>

            {/* Search Bar WIRED WITH onSearch */}
            <div className="mt-8 max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Popular Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-text-muted">
              <span>Popular:</span>
              {['Electrician', 'Plumber', 'AC Repair', 'Cleaner', 'Carpenter'].map((s) => (
                <Link
                  key={s}
                  to={`/services?search=${encodeURIComponent(s)}`}
                  className="px-3.5 py-1 rounded-full bg-white border border-border hover:border-primary/50 hover:text-primary transition-all duration-200 text-xs sm:text-sm font-medium cursor-pointer shadow-xs"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '3,000+', label: 'Service Providers' },
              { value: '50,000+', label: 'Bookings Done' },
              { value: '4.8', label: 'Average Rating' },
              { value: '25+', label: 'Cities' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Browse Categories</h2>
          <p className="text-text-secondary mt-2">Find the right professional for every need</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id || cat.name} category={cat} />
          ))}
        </div>
      </section>

      {/* Featured Providers (Live MongoDB) */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">⭐ Featured Providers</h2>
              <p className="text-text-secondary mt-2">Top-rated professionals recommended for you</p>
            </div>
            <Link
              to="/services"
              className="hidden sm:inline-flex text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredProviders.map((provider) => (
              <ServiceCard key={provider.id || provider._id} provider={provider} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/services"
              className="inline-flex px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              View All Providers
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold">Become a Service Provider</h2>
            <p className="mt-3 text-blue-100 max-w-md mx-auto">
              Join our growing network and reach thousands of customers in your area.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/services"
                className="px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Get Started
              </Link>
              <Link
                to="/services"
                className="px-8 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}