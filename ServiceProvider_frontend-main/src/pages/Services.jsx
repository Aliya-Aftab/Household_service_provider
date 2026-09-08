import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import FilterSidebar from '../components/FilterSidebar';
import SearchBar from '../components/SearchBar';
import API, { transformProvider } from '../utils/api';
import { HiAdjustments } from 'react-icons/hi';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [rawProviders, setRawProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize search & location state directly from URL query parameters
  const [searchQuery, setSearchQuery] = useState({
    service: searchParams.get('search') || searchParams.get('service') || '',
    location: searchParams.get('location') || '',
  });

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'All',
    priceRange: null,
    minRating: null,
    distance: null,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  // Synchronize state whenever URL search params change
  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    const term = searchParams.get('search') || searchParams.get('service') || '';
    const loc = searchParams.get('location') || '';

    setFilters((prev) => ({ ...prev, category: cat }));
    setSearchQuery({ service: term, location: loc });
  }, [searchParams]);

  // Fetch real data from MongoDB
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await API.get('/providers');
        const list = Array.isArray(res.data) ? res.data : [];
        const formatted = list.map(transformProvider);
        setRawProviders(formatted);
      } catch (err) {
        console.error('Failed to load providers from backend:', err);
        setRawProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams(searchParams);

    if (newFilters.category && newFilters.category !== 'All') {
      params.set('category', newFilters.category);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearch = ({ service, location }) => {
    const term = (service || '').trim();
    const loc = (location || '').trim();

    setSearchQuery({ service: term, location: loc });

    const params = new URLSearchParams(searchParams);
    if (term) params.set('search', term);
    else params.delete('search');

    if (loc) params.set('location', loc);
    else params.delete('location');

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({ category: 'All', priceRange: null, minRating: null, distance: null });
    setSearchQuery({ service: '', location: '' });
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    let result = [...rawProviders];

    // Search input keyword filtering (Service / Name / Category / Skills)
    if (searchQuery.service.trim()) {
      const q = searchQuery.service.toLowerCase().trim();
      result = result.filter((p) => {
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const matchesServices = Array.isArray(p.services)
          ? p.services.some((s) => (s?.name || '').toLowerCase().includes(q))
          : false;
        const matchesSkills = Array.isArray(p.skills)
          ? p.skills.some((s) => (s || '').toLowerCase().includes(q))
          : false;

        return pName.includes(q) || pCat.includes(q) || matchesServices || matchesSkills;
      });
    }

    // Smart tokenized location filtering
    if (searchQuery.location.trim()) {
      const tokens = searchQuery.location
        .toLowerCase()
        .split(/[,\s]+/)
        .filter((t) => t.length > 2);

      if (tokens.length > 0) {
        result = result.filter((p) => {
          const loc = (p.location || '').toLowerCase();
          return tokens.some((token) => loc.includes(token));
        });
      }
    }

    // Category sidebar filter
    if (filters.category && filters.category !== 'All') {
      result = result.filter(
        (p) => (p.category || '').toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Rating filter
    if (filters.minRating) {
      result = result.filter((p) => (p.rating || 0) >= filters.minRating);
    }

    // Price range filter
    if (filters.priceRange) {
      const ranges = {
        'Under ₹300': [0, 300],
        '₹300 - ₹500': [300, 500],
        '₹500 - ₹1000': [500, 1000],
        'Above ₹1000': [1000, Infinity],
      };
      const [min, max] = ranges[filters.priceRange] || [0, Infinity];
      result = result.filter((p) => (p.price || 0) >= min && (p.price || 0) <= max);
    }

    // Sort order
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price-low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'recommended':
      default:
        result.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
    }

    return result;
  }, [filters, sortBy, rawProviders, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          {filters.category !== 'All' ? `${filters.category} Services` : 'All Services'}
        </h1>
        <p className="text-text-secondary mt-1">
          {loading ? 'Loading providers...' : `${filtered.length} providers available`}
        </p>
      </div>

      {/* Search */}
      <SearchBar onSearch={handleSearch} className="mb-6" />

      {/* Active Search Chips */}
      {(searchQuery.service || searchQuery.location) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-text-muted">Filtering by:</span>
          {searchQuery.service && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              "{searchQuery.service}"
            </span>
          )}
          {searchQuery.location && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              Location: {searchQuery.location}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSearch({ service: '', location: '' })}
            className="text-xs text-red-500 hover:underline ml-1 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Mobile Filter Button + Sort */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Open filters"
        >
          <HiAdjustments className="w-4 h-4" />
          Filters
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="ml-auto px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Sort by"
        >
          <option value="recommended">Recommended</option>
          <option value="rating">Highest Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* Layout */}
      <div className="flex gap-8">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />

        <div className="flex-1">
          {loading ? (
            <div className="text-center py-16">
              <p className="text-text-secondary">Connecting to database...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((provider) => (
                <ServiceCard key={provider.id || provider._id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl card-shadow p-12 text-center border border-border/50">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-semibold text-text-primary">No providers found</p>
              <p className="text-text-secondary mt-1">Try adjusting your search criteria or filters</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}