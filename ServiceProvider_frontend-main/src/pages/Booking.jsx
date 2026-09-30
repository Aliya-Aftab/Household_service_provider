import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import BookingForm from '../components/BookingForm';
import RatingStars from '../components/RatingStars';
import API, { transformProvider } from '../utils/api';
import AuthModal from '../components/AuthModal';
import { HiCheckCircle, HiArrowLeft } from 'react-icons/hi';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  const navigate = useNavigate();

  // Support both /booking/:providerId and /booking?provider=...
  const providerParam = routeParams.providerId || searchParams.get('provider');
  const serviceIndex = parseInt(searchParams.get('service') || '0', 10);

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const fetchTargetProvider = async () => {
      try {
        if (providerParam) {
          const res = await API.get(`/providers/${providerParam}`);
          setProvider(transformProvider(res.data));
        } else {
          // If no param supplied, grab the first active provider
          const res = await API.get('/providers');
          if (Array.isArray(res.data) && res.data.length > 0) {
            setProvider(transformProvider(res.data[0]));
          }
        }
      } catch (err) {
        console.error('Failed to load provider for booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTargetProvider();
  }, [providerParam]);

  const activeServices = provider?.services && provider.services.length > 0
    ? provider.services
    : [{ name: provider?.category || 'Standard Service', price: provider?.price || 299, categoryId: provider?.categoryId }];

  const service = activeServices[serviceIndex] || activeServices[0];
  const servicePrice = Number(service?.price || provider?.price || 299);
  const platformFee = 29;
  const taxes = Math.round(servicePrice * 0.18);
  const totalAmount = servicePrice + platformFee + taxes;

  const handleSubmit = async (formData) => {
    const storedUser = localStorage.getItem('user');
    let user = null;

    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse user session:', e);
      }
    }

    if (!user?._id) {
      alert('Please sign in or create an account to confirm this booking.');
      setAuthModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: user._id,
        providerId: provider.userDocId || provider.id || provider._id,
        serviceCategory: service.categoryId || provider.categoryId,
        bookingDate: new Date(formData.date).toISOString(),
        timeSlot: {
          startTime: formData.time || '10:00 AM',
          endTime: formData.time || '11:00 AM',
        },
        address: `${formData.address}, ${formData.city} - ${formData.pincode}`,
        price: totalAmount,
        status: 'pending',
      };

      const res = await API.post('/bookings', payload);
      setCreatedBooking(res.data);
      setConfirmed(true);
    } catch (err) {
      console.error('Booking Error:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to place booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-text-secondary text-base">Loading booking checkout details...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">😕</p>
        <h2 className="text-xl font-bold text-text-primary">Provider Not Found</h2>
        <Link to="/services" className="mt-4 inline-block text-sm text-primary font-semibold hover:underline">
          Return to All Services
        </Link>
      </div>
    );
  }

  if (confirmed) {
    const bookingIdDisplay = createdBooking?._id
      ? String(createdBooking._id).substring(String(createdBooking._id).length - 6).toUpperCase()
      : 'SUCCESS';

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiCheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Booking Confirmed! 🎉</h1>
        <p className="mt-3 text-text-secondary">
          Your appointment with <strong>{provider.name}</strong> for <strong>{service.name}</strong> has been sent.
        </p>

        <div className="mt-8 bg-white rounded-2xl card-shadow p-6 text-left border border-border/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-text-primary">Booking Summary</h3>
            <span className="text-xs bg-primary/10 text-primary font-mono px-2 py-0.5 rounded">#{bookingIdDisplay}</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Provider', value: provider.name },
              { label: 'Service', value: service.name },
              { label: 'Amount Paid/Due', value: `₹${totalAmount}` },
              { label: 'Status', value: 'Pending Confirmation' },
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
      <Link
        to={`/provider/${provider.id || provider._id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors mb-6"
      >
        <HiArrowLeft className="w-4 h-4" />
        Back to profile
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8">Complete Your Booking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
            {submitting ? (
              <div className="py-12 text-center text-primary font-medium">
                Saving booking to MongoDB Atlas...
              </div>
            ) : (
              <BookingForm
                provider={provider}
                service={service}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50 sticky top-20">
            <h3 className="font-bold text-text-primary mb-4">Booking Summary</h3>

            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <img
                src={provider.image}
                alt={provider.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <p className="font-semibold text-text-primary">{provider.name}</p>
                <RatingStars rating={provider.rating || 4.5} />
              </div>
            </div>

            <div className="py-4 border-b border-border">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{service.name}</span>
                <span className="font-medium text-text-primary">₹{servicePrice}</span>
              </div>
            </div>

            <div className="py-4 border-b border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Service Base Fee</span>
                <span className="text-text-primary">₹{servicePrice}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Platform Fee</span>
                <span className="text-text-primary">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Taxes (18% GST)</span>
                <span className="text-text-primary">₹{taxes}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <span className="font-bold text-text-primary">Total Amount</span>
              <span className="text-xl font-bold text-primary">₹{totalAmount}</span>
            </div>

            <div className="mt-5 p-3 bg-emerald-50 rounded-xl">
              <p className="text-xs text-emerald-700 font-medium">
                ✅ 100% satisfaction guaranteed. Free cancellation before appointment dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
}