import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/services?category=${category.name}`}
      className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20"
    >
      <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
        {category.icon}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
          {category.name}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{category.count} providers</p>
      </div>
    </Link>
  );
}
