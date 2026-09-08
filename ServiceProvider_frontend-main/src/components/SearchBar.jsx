import { useState } from 'react';
import { HiSearch, HiLocationMarker } from 'react-icons/hi';

export default function SearchBar({ onSearch, className = '' }) {
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({ service: service.trim(), location: location.trim() });
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
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          aria-label="Search location"
        />
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