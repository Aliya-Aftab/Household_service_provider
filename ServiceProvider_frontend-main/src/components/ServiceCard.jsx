import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { HiCheckCircle } from 'react-icons/hi';

export default function ServiceCard({ provider }) {
  const targetId = provider.id || provider._id;

  return (
    <Link
      to={`/provider/${targetId}`}
      className="group block bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-transparent hover:border-primary/20"
    >
      {/* Recommended Badge */}
      {provider.recommended && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-xs font-semibold text-white flex items-center gap-1">
          <span>⭐</span> Recommended for You
        </div>
      )}

      <div className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={provider.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'}
              alt={provider.name || 'Professional'}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-primary/30 transition-all duration-300"
            />
            {provider.verified && (
              <HiCheckCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-primary bg-white rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                  {provider.name || 'Verified Professional'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">{provider.category || 'General Service'}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-primary">
                ₹{provider.price || 299}
              </span>
            </div>

            <div className="mt-2">
              <RatingStars rating={provider.rating || 4.5} />
            </div>

            <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{provider.experience || '3+ years'} exp</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              {provider.distanceKm !== null && provider.distanceKm !== undefined ? (
                <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  📍 {provider.distance}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-text-primary bg-gray-100 px-2 py-0.5 rounded-md">
                  📍 {provider.location || provider.city || 'Gorakhpur'}
                </span>
              )}
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{provider.reviews || 0} reviews</span>
            </div>
          </div>
        </div>

        {/* Interactive action indicator */}
        <div className="mt-4 w-full py-2.5 bg-primary/5 text-primary text-sm font-semibold rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300 text-center">
          View Profile & Book
        </div>
      </div>
    </Link>
  );
}