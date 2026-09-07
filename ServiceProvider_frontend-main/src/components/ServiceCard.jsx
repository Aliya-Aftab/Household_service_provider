import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { HiCheckCircle, HiBadgeCheck } from 'react-icons/hi';

export default function ServiceCard({ provider }) {
  return (
    <Link
      to={`/provider/${provider.id}`}
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
              src={provider.image}
              alt={provider.name}
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
                  {provider.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">{provider.category}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-primary">
                ₹{provider.price}
              </span>
            </div>

            <div className="mt-2">
              <RatingStars rating={provider.rating} />
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
              <span>{provider.experience} exp</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{provider.distance}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{provider.reviews} reviews</span>
            </div>
          </div>
        </div>

        {/* Book Button */}
        <button className="mt-4 w-full py-2.5 bg-primary/5 text-primary text-sm font-semibold rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
          Book Now
        </button>
      </div>
    </Link>
  );
}
