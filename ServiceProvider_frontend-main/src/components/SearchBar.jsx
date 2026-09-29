import { useState, useEffect } from 'react';
import { HiSearch, HiLocationMarker, HiCheckCircle } from 'react-icons/hi';

export default function SearchBar({ onSearch, initialValues, className = '' }) {
  const [service, setService] = useState(initialValues?.service || '');
  const [location, setLocation] = useState(initialValues?.location || '');
  const [coords, setCoords] = useState(initialValues?.coords || null);
  const [isLocating, setIsLocating] = useState(false);

  // Sync state if initialValues changes from parent (e.g. URL query params)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.service !== undefined) setService(initialValues.service || '');
      if (initialValues.location !== undefined) setLocation(initialValues.location || '');
      if (initialValues.coords !== undefined) setCoords(initialValues.coords || null);
    }
  }, [initialValues?.service, initialValues?.location, initialValues?.coords?.lat, initialValues?.coords?.lng]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({ service: service.trim(), location: location.trim(), coords });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoords(newCoords);

        let locName = 'Current Location';
        try {
          // Reverse geocode to get a readable address name
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
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        }

        setLocation(locName);
        setIsLocating(false);

        // Optionally trigger immediate search with new coords if service is already typed
        if (service.trim()) {
          onSearch?.({ service: service.trim(), location: locName, coords: newCoords });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please check browser permissions.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row bg-white rounded-2xl card-shadow p-2 gap-2 border border-border ${className}`}
    >
      <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-surface">
        <HiSearch className="w-5 h-5 text-text-muted shrink-0" />
        <input
          type="text"
          placeholder="What service do you need? (e.g. Carpenter, Plumber, AC Repair)"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          aria-label="Search services"
        />
      </div>
      <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-surface relative">
        <HiLocationMarker className={`w-5 h-5 shrink-0 ${coords ? 'text-primary' : 'text-text-muted'}`} />
        <input
          type="text"
          placeholder="Your location / city"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            // If user types custom text, clear the GPS coords unless they re-locate
            if (coords) setCoords(null);
          }}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          aria-label="Search location"
        />
        {coords && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
            <HiCheckCircle className="w-3.5 h-3.5" /> GPS Active
          </span>
        )}
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          title="Auto-detect current GPS location"
        >
          {isLocating ? 'Locating...' : '🎯 Locate Me'}
        </button>
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity duration-200 shrink-0 cursor-pointer shadow-sm"
      >
        Search
      </button>
    </form>
  );
}
