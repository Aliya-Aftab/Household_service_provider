import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import FilterSidebar from '../components/FilterSidebar';
import SearchBar from '../components/SearchBar';
import API, { transformProvider } from '../utils/api';
import { calculateDistanceKm } from '../utils/distance';
import { HiAdjustments, HiLocationMarker } from 'react-icons/hi';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL query parameters
  const initialCategory = searchParams.get('category') || 'All';
  const initialService = searchParams.get('service') || '';
  const initialLoc = searchParams.get('location') || '';
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');
  const initialCoords =
    initialLat && initialLng
      ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) }
      : null;
  const initialMaxKm = searchParams.get('maxKm') ? Number(searchParams.get('maxKm')) : 15;

  const [rawProviders, setRawProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState({
    service: initialService,
    location: initialLoc,
    coords: initialCoords,
  });

  const [maxDistanceKm, setMaxDistanceKm] = useState(initialMaxKm); // Distance limit in km
  const [isLocatingPrompt, setIsLocatingPrompt] = useState(false);

  const [filters, setFilters] = useState({
    category: initialCategory,
    priceRange: null,
    minRating: null,
    distance: null,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  // Sync category state when URL search param changes
  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    const serv = searchParams.get('service');
    const loc = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const km = searchParams.get('maxKm');

    setFilters((prev) => ({ ...prev, category: cat }));

    if (serv !== null || loc !== null || (lat && lng)) {
      setSearchQuery((prev) => ({
        service: serv !== null ? serv : prev.service,
        location: loc !== null ? loc : prev.location,
        coords: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : prev.coords,
      }));
    }

    if (km) {
      setMaxDistanceKm(Number(km));
    }
  }, [searchParams]);

  // Fetch providers from MongoDB
  const fetchProviders = async (coords = null, maxKm = 25, serviceText = '') => {
    setLoading(true);
    try {
      let endpoint = '/providers';
      if (coords && coords.lat && coords.lng) {
        endpoint = `/providers/nearby?lng=${coords.lng}&lat=${coords.lat}&maxKm=${maxKm}${
          serviceText ? `&service=${encodeURIComponent(serviceText)}` : ''
        }`;
      }
      const res = await API.get(endpoint);
      let formatted = res.data.map(transformProvider);

      // Ensure every provider has distanceKm calculated if user coordinates exist
      if (coords && coords.lat && coords.lng) {
        formatted = formatted.map((p) => {
          if ((p.distanceKm === null || p.distanceKm === undefined) && p.coordinates && p.coordinates.length === 2) {
            const calculatedDist = calculateDistanceKm(
              coords.lat,
              coords.lng,
              p.coordinates[1],
              p.coordinates[0]
            );
            return {
              ...p,
              distanceKm: calculatedDist,
              distance: calculatedDist !== null ? `${calculatedDist} km away` : p.distance,
            };
          }
          return p;
        });
      }

      setRawProviders(formatted);
    } catch (err) {
      console.error('Failed to load providers from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders(searchQuery.coords, maxDistanceKm, searchQuery.service);
  }, [searchQuery.coords?.lat, searchQuery.coords?.lng, maxDistanceKm, searchQuery.service]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (newFilters.category !== 'All') {
      setSearchParams((prev) => {
        prev.set('category', newFilters.category);
        return prev;
      });
    } else {
      setSearchParams((prev) => {
        prev.delete('category');
        return prev;
      });
    }
  };

  const handleSearch = ({ service, location, coords }) => {
    setSearchQuery({ service, location, coords });
    setSearchParams((prev) => {
      if (service) prev.set('service', service);
      else prev.delete('service');
      if (location) prev.set('location', location);
      else prev.delete('location');
      if (coords?.lat && coords?.lng) {
        prev.set('lat', coords.lat);
        prev.set('lng', coords.lng);
      } else {
        prev.delete('lat');
        prev.delete('lng');
      }
      return prev;
    });
  };

  const handleResetFilters = () => {
    setFilters({ category: 'All', priceRange: null, minRating: null, distance: null });
    setSearchQuery({ service: '', location: '', coords: null });
    setMaxDistanceKm(15);
    setSearchParams({});
  };

  // User triggers browser geolocation directly from the Services page
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocatingPrompt(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = { lat: latitude, lng: longitude };

        let locName = 'Current Location';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const shortName =
              addr.suburb ||
              addr.neighbourhood ||
              addr.city_district ||
              addr.city ||
              addr.town ||
              data.display_name.split(',')[0];
            locName = `${shortName} (GPS)`;
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e);
        }

        handleSearch({
          service: searchQuery.service,
          location: locName,
          coords: newCoords,
        });
        setIsLocatingPrompt(false);
      },
      (err) => {
        console.error('Location error:', err);
        alert('Could not access your location. Please check browser permissions.');
        setIsLocatingPrompt(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const filtered = useMemo(() => {
    let result = [...rawProviders];

    // Distance filtering based on maxDistanceKm limit when coords are present
    if (searchQuery.coords && maxDistanceKm) {
      result = result.filter((p) => {
        if (p.distanceKm !== null && p.distanceKm !== undefined) {
          return p.distanceKm <= maxDistanceKm;
        }
        return true;
      });
    }

    // Also support FilterSidebar distance option if explicitly clicked
    if (filters.distance && filters.distance !== 'Any') {
      const maxFilterKm = parseFloat(filters.distance.replace(/[^\d.]/g, ''));
      if (!isNaN(maxFilterKm)) {
        result = result.filter((p) => {
          if (p.distanceKm !== null && p.distanceKm !== undefined) {
            return p.distanceKm <= maxFilterKm;
          }
          return true;
        });
      }
    }

    // Search input keyword filtering (Service / Name / Skills)
    if (searchQuery.service.trim()) {
      const q = searchQuery.service.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.services?.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    // Smart tokenized location filtering (only if not using GPS coordinates)
    if (
      searchQuery.location.trim() &&
      !searchQuery.coords &&
      !searchQuery.location.includes('GPS') &&
      searchQuery.location !== 'Current Location'
    ) {
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
    if (filters.category !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
    }

    // Rating filter
    if (filters.minRating) {
      result = result.filter((p) => p.rating >= filters.minRating);
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
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    // Sort order
    switch (sortBy) {
      case 'distance-low':
        result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'recommended':
      default:
        if (searchQuery.coords) {
          result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        } else {
          result.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
        }
    }

    return result;
  }, [filters, sortBy, rawProviders, searchQuery, maxDistanceKm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          {filters.category !== 'All' ? `${filters.category} Services` : 'All Services'}
        </h1>
        <p className="text-text-secondary mt-1">
          {loading ? 'Finding service providers...' : `${filtered.length} verified providers available`}
        </p>
      </div>

      {/* Search Bar with synced initial values */}
      <SearchBar
        onSearch={handleSearch}
        initialValues={{
          service: searchQuery.service,
          location: searchQuery.location,
          coords: searchQuery.coords,
        }}
        className="mb-6"
      />

      {/* Distance Limit & GPS Bar */}
      {searchQuery.coords ? (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              📍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary text-sm">
                  {searchQuery.location || 'Current GPS Location'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  ✓ GPS Active
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Showing service providers within <strong>{maxDistanceKm} km</strong> distance limit
              </p>
            </div>
          </div>

          {/* Quick Distance Radius Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-text-secondary mr-1">Distance Limit:</span>
            {[3, 5, 10, 15, 25, 50].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setMaxDistanceKm(km)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  maxDistanceKm === km
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                    : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
                }`}
              >
                ≤ {km} km
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-sm text-amber-900">
            <span className="text-xl">🎯</span>
            <div>
              <p className="font-semibold text-xs sm:text-sm">Find professionals closest to your doorstep</p>
              <p className="text-xs text-amber-700">Enable current location to see exact km distance and nearest providers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocatingPrompt}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-colors cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
          >
            <HiLocationMarker className="w-4 h-4" />
            {isLocatingPrompt ? 'Detecting Location...' : 'Use My Current Location'}
          </button>
        </div>
      )}

      {/* Active Search Chips */}
      {(searchQuery.service || searchQuery.location) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-text-muted">Filtering by:</span>
          {searchQuery.service && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              Service: "{searchQuery.service}"
            </span>
          )}
          {searchQuery.location && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              📍 {searchQuery.location}
            </span>
          )}
          {searchQuery.coords && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
              Max Distance: {maxDistanceKm} km
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery({ service: '', location: '', coords: null });
              setSearchParams({});
            }}
            className="text-xs text-red-500 hover:underline ml-1 cursor-pointer font-medium"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Mobile Filter Button + Sort */}
      <div className="flex items-center gap-3 mb-6">
        <button
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
          className="ml-auto px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          aria-label="Sort by"
        >
          <option value="recommended">Recommended</option>
          <option value="distance-low">📍 Distance: Nearest First</option>
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3"></div>
              <p className="text-text-secondary">Finding nearby service providers...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((provider) => (
                <ServiceCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl card-shadow p-12 text-center border border-border/50">
              <p className="text-5xl mb-4">📍</p>
              <p className="text-lg font-semibold text-text-primary">
                {searchQuery.coords
                  ? `No ${searchQuery.service || ''} providers found within ${maxDistanceKm} km`
                  : 'No providers found'}
              </p>
              <p className="text-text-secondary mt-1 max-w-md mx-auto text-sm">
                {searchQuery.coords
                  ? `Try expanding your distance limit to 25 km or 50 km to find professionals in surrounding neighborhoods.`
                  : 'Try adjusting your search query, service category, or filters.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {searchQuery.coords && maxDistanceKm < 50 && (
                  <button
                    type="button"
                    onClick={() => setMaxDistanceKm(50)}
                    className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
                  >
                    Expand to 50 km
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-gray-100 text-text-primary text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}