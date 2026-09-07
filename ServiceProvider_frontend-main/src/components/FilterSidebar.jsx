import { HiStar, HiX } from 'react-icons/hi';
import { categories } from '../data/categories';

export default function FilterSidebar({ filters, onFilterChange, isOpen, onClose }) {
  const priceRanges = [
    { label: 'Under ₹300', min: 0, max: 300 },
    { label: '₹300 - ₹500', min: 300, max: 500 },
    { label: '₹500 - ₹1000', min: 500, max: 1000 },
    { label: 'Above ₹1000', min: 1000, max: Infinity },
  ];

  const ratings = [4.5, 4.0, 3.5, 3.0];
  const distances = ['< 2 km', '< 5 km', '< 10 km', 'Any'];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-20 left-0 top-0 h-full lg:h-auto w-72 bg-white lg:bg-transparent z-50 lg:z-0 
          transform transition-transform duration-300 lg:transform-none overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-5 lg:p-0">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h3 className="text-lg font-bold text-text-primary">Filters</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Close filters">
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Category</h4>
            <div className="space-y-1.5">
              <button
                onClick={() => onFilterChange({ ...filters, category: 'All' })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.category === 'All'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ ...filters, category: cat.name })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    filters.category === cat.name
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Price Range</h4>
            <div className="space-y-1.5">
              {priceRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => onFilterChange({ ...filters, priceRange: range.label })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.priceRange === range.label
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Rating</h4>
            <div className="space-y-1.5">
              {ratings.map((r) => (
                <button
                  key={r}
                  onClick={() => onFilterChange({ ...filters, minRating: r })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                    filters.minRating === r
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <HiStar className="w-4 h-4 text-amber-400" />
                  {r}+ & above
                </button>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Distance</h4>
            <div className="space-y-1.5">
              {distances.map((d) => (
                <button
                  key={d}
                  onClick={() => onFilterChange({ ...filters, distance: d })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.distance === d
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() =>
              onFilterChange({
                category: 'All',
                priceRange: null,
                minRating: null,
                distance: null,
              })
            }
            className="w-full py-2.5 text-sm font-medium text-danger hover:bg-red-50 rounded-xl transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </aside>
    </>
  );
}
