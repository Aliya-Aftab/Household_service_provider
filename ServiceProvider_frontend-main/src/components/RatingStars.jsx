import { HiStar } from 'react-icons/hi';

export default function RatingStars({ rating, size = 'sm' }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <HiStar
          key={i}
          className={`${sizeClasses} ${
            i < fullStars
              ? 'text-amber-400'
              : i === fullStars && hasHalf
              ? 'text-amber-300'
              : 'text-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-text-primary">{rating}</span>
    </div>
  );
}
