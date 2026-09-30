import { useState } from 'react';
import { HiSearch, HiLocationMarker } from 'react-icons/hi';

export default function SearchBar({ onSearch, className = '' }) {
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({ 
      service: service.trim(), 
      location: location.trim(), 
      coords 
    });
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
        setCoords({ lat: latitude, lng: longitude });

        try {
          // Reverse geocode to get a readable address name
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          if (data && data.display_name) {
            // Extract a shorter version of the address if possible (suburb, city, etc.)
            const address = data.address;
            const shortName =
              address.suburb ||
              address.neighbourhood ||
              address.city_district ||
              address.city ||
              address.town ||
              data.display_name.split(',')[0];
            setLocation(`${shortName} (Current Location)`);
          } else {
            setLocation('Current Location');
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setLocation('Current Location');
        }

        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
        setIsLocating(false);
      }
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
          placeholder="What service do you need? (e.g. Electrician, Plumbing)"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          aria-label="Search services"
        />
      </div>
      <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-surface">
        <HiLocationMarker className="w-5 h-5 text-text-muted shrink-0" />
        <input
          type="text"
          placeholder="Your location or area"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            if (e.target.value !== 'Current Location') {
              setCoords(null);
            }
          }}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          aria-label="Search location"
        />
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="text-primary hover:text-primary-dark p-1 text-xs font-medium cursor-pointer"
          title="Get live location"
        >
          {isLocating ? 'Locating...' : 'Locate Me'}
        </button>
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity duration-200 shrink-0 cursor-pointer"
      >
        Search
      </button>
    </form>
  );
}