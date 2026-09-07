import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import BookingForm from '../components/BookingForm';
import RatingStars from '../components/RatingStars';
import { providers } from '../data/providers';
import { HiCheckCircle, HiArrowLeft } from 'react-icons/hi';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const providerId = parseInt(searchParams.get('provider') || '1');
  const serviceIndex = parseInt(searchParams.get('service') || '0');
  const provider = providers.find((p) => p.id === providerId) || providers[0];
  const service = provider.services[serviceIndex] || provider.services[0];
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (formData) => {
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiCheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Booking Confirmed! 🎉</h1>
        <p className="mt-3 text-text-secondary">
          Your appointment with <strong>{provider.name}</strong> for <strong>{service.name}</strong> has been confirmed.
        </p>
        <div className="mt-8 bg-white rounded-2xl card-shadow p-6 text-left border border-border/50">
          <h3 className="font-bold text-text-primary mb-4">Booking Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Provider', value: provider.name },
              { label: 'Service', value: service.name },
              { label: 'Amount', value: `₹${service.price}` },
              { label: 'Status', value: 'Confirmed' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="font-medium text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/services"
            className="px-6 py-2.5 border border-border text-text-primary font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Book Another Service
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        to={`/provider/${provider.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to profile
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8">Complete Your Booking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
            <BookingForm
              provider={provider}
              service={service}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50 sticky top-20">
            <h3 className="font-bold text-text-primary mb-4">Booking Summary</h3>

            {/* Provider Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <img
                src={provider.image}
                alt={provider.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <p className="font-semibold text-text-primary">{provider.name}</p>
                <RatingStars rating={provider.rating} />
              </div>
            </div>

            {/* Service */}
            <div className="py-4 border-b border-border">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{service.name}</span>
                <span className="font-medium text-text-primary">₹{service.price}</span>
              </div>
            </div>

            {/* Total */}
            <div className="py-4 border-b border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Service Fee</span>
                <span className="text-text-primary">₹{service.price}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Platform Fee</span>
                <span className="text-text-primary">₹29</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Taxes</span>
                <span className="text-text-primary">₹{Math.round(service.price * 0.18)}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <span className="font-bold text-text-primary">Total</span>
              <span className="text-xl font-bold text-primary">
                ₹{service.price + 29 + Math.round(service.price * 0.18)}
              </span>
            </div>

            <div className="mt-5 p-3 bg-emerald-50 rounded-xl">
              <p className="text-xs text-emerald-700 font-medium">
                ✅ 100% satisfaction guaranteed. Free cancellation up to 4 hours before the appointment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
