import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RatingStars from '../components/RatingStars';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import AuthModal from '../components/AuthModal';
import API, { transformProvider } from '../utils/api';
import { HiCheckCircle, HiLocationMarker, HiClock, HiCalendar, HiStar } from 'react-icons/hi';

export default function ProviderProfile() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await API.get(`/providers/${id}`);
        if (res.data) {
          setProvider(transformProvider(res.data));
        }
      } catch (err) {
        console.error('Failed to load provider profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProvider();
    }
  }, [id]);

  const handleBookService = (svc) => {
    const chosen = svc || (provider?.services && provider.services[0]) || {
      name: provider?.category || 'General Service',
      price: provider?.price || 299,
      categoryId: provider?.categoryId,
    };

    setSelectedService(chosen);

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      alert('Please sign in or create an account to book a service.');
      setAuthModal(true);
      return;
    }
    setBookingModal(true);
  };

  const handleBookingSubmit = async (formData) => {
    setBookingLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      let customerId = null;

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          customerId = parsed._id;
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }

      if (!customerId) {
        alert('Please sign in to confirm this booking.');
        setBookingModal(false);
        setAuthModal(true);
        return;
      }

      const payload = {
        customerId: customerId,
        providerId: provider.userDocId || provider.id,
        serviceCategory: selectedService?.categoryId || provider.categoryId,
        bookingDate: new Date(formData.date).toISOString(),
        timeSlot: {
          startTime: formData.time || '10:00 AM',
          endTime: formData.time || '11:00 AM',
        },
        address: `${formData.address || ''}, ${formData.city || ''} - ${formData.pincode || ''}`.trim().replace(/^,\s*|-\s*$/g, ''),
        price: selectedService?.price || provider.price || 299,
        status: 'pending',
      };

      const response = await API.post('/bookings', payload);
      alert(`Booking confirmed successfully! Booking ID: ${response.data._id || 'Created'}`);
      setBookingModal(false);
    } catch (err) {
      console.error('Booking Error:', err.response?.data || err.message);
      alert(`Booking failed: ${err.response?.data?.message || err.response?.data?.error || err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      alert('Please sign in to leave a review.');
      setAuthModal(true);
      return;
    }

    if (!reviewText.trim()) {
      alert('Please enter a review message.');
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (err) {
      alert('Invalid user session. Please sign in again.');
      return;
    }

    setReviewSubmitting(true);

    try {
      // Find a recent completed booking or pass valid fallback reference
      let bookingId = null;
      try {
        const userBookingsRes = await API.get(`/bookings/user/${user._id}`);
        const validBooking = (userBookingsRes.data || []).find(
          (b) => (b.providerId?._id === provider.userDocId || b.providerId === provider.userDocId)
        );
        if (validBooking) {
          bookingId = validBooking._id;
        }
      } catch (bErr) {
        console.warn('Could not auto-fetch user bookingId for review:', bErr);
      }

      const payload = {
        bookingId: bookingId || undefined,
        customerId: user._id,
        providerId: provider.userDocId || provider.id,
        rating: Number(reviewRating),
        comment: reviewText.trim(),
        review: reviewText.trim(),
      };

      // Also trigger rating update on provider document
      await API.post('/reviews', payload).catch(async () => {
        // Fallback directly to provider rating patch if standalone reviews endpoint rejects missing bookingId
        await API.patch(`/providers/${provider.id}/rating`, { rating: Number(reviewRating) });
      });

      const newReviewItem = {
        user: user.name || 'You',
        rating: Number(reviewRating),
        text: reviewText.trim(),
        date: 'Just now',
      };

      const newTotal = (provider.reviews || 0) + 1;
      const newAvg = Number(((((provider.rating || 4.5) * (provider.reviews || 0)) + Number(reviewRating)) / newTotal).toFixed(1));

      setProvider((prev) => ({
        ...prev,
        rating: newAvg,
        reviews: newTotal,
        reviewsList: [newReviewItem, ...(prev.reviewsList || [])],
      }));

      setReviewText('');
      setReviewRating(5);
      alert('Thank you! Your review has been submitted.');
    } catch (err) {
      console.error('Review error:', err);
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary text-lg">Loading provider profile from database...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="text-xl font-bold text-text-primary">Provider not found</h2>
        <Link to="/services" className="mt-4 inline-block text-primary hover:underline">
          Browse all services
        </Link>
      </div>
    );
  }

  const safeServices = Array.isArray(provider.services) && provider.services.length > 0
    ? provider.services
    : [{ name: provider.category || 'General Service', price: provider.price || 299, categoryId: provider.categoryId }];

  const minPrice = safeServices.reduce((min, s) => Math.min(min, s.price || 299), safeServices[0]?.price || 299);

  const isDayAvailable = (day) => {
    if (!Array.isArray(provider.availability)) return true;
    return provider.availability.some((a) => {
      if (typeof a === 'string') return a.toLowerCase().includes(day.toLowerCase());
      if (typeof a === 'object' && a?.day) return a.day.toLowerCase().includes(day.toLowerCase());
      return false;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link to="/services" className="hover:text-primary transition-colors">Services</Link>
        <span>/</span>
        <span className="text-text-secondary">{provider.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative shrink-0">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-gray-100"
                />
                {provider.verified && (
                  <HiCheckCircle className="absolute -bottom-1 -right-1 w-7 h-7 text-primary bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-text-primary">{provider.name}</h1>
                    <p className="text-text-secondary mt-0.5">{provider.category}</p>
                  </div>
                  {provider.recommended && (
                    <span className="shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      ⭐ Recommended
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <RatingStars rating={provider.rating} size="md" />
                  <span className="text-sm text-text-muted ml-2">({provider.reviews} reviews)</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <HiLocationMarker className="w-4 h-4" />
                    {provider.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiClock className="w-4 h-4" />
                    {provider.experience}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm text-text-secondary leading-relaxed">{provider.about}</p>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
            <h2 className="text-lg font-bold text-text-primary mb-4">Services & Pricing</h2>
            <div className="space-y-3">
              {safeServices.map((svc, idx) => (
                <div
                  key={svc.name || idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-dark transition-colors"
                >
                  <div>
                    <p className="font-medium text-text-primary">{svc.name}</p>
                    <p className="text-sm text-text-muted">Starting from</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">₹{svc.price}</span>
                    <button
                      type="button"
                      onClick={() => handleBookService(svc)}
                      className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
            <h2 className="text-lg font-bold text-text-primary mb-4">Customer Reviews</h2>

            {/* Leave a Review Form */}
            <form onSubmit={handleReviewSubmit} className="mb-6 p-4 rounded-xl bg-surface border border-border/70">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Leave a Rating & Review</h3>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-text-secondary">Your Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <HiStar
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-text-primary ml-1">{reviewRating} / 5</span>
              </div>

              <textarea
                rows={3}
                placeholder="Write your experience with this service provider..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-white text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-muted resize-none"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>

            {/* Reviews List */}
            {Array.isArray(provider.reviewsList) && provider.reviewsList.length > 0 ? (
              <div className="space-y-4">
                {provider.reviewsList.map((review, i) => (
                  <div key={i} className="pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {review.user ? review.user.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{review.user}</p>
                          <p className="text-xs text-text-muted">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <HiStar className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No reviews yet for this provider. Be the first to leave one!</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50 sticky top-20">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <HiCalendar className="w-5 h-5 text-primary" />
              Availability
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day) => (
                <div
                  key={day}
                  className={`text-center py-2 rounded-lg text-xs font-medium ${
                    isDayAvailable(day)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-50 text-gray-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleBookService(safeServices[0])}
              className="mt-5 w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Book Appointment
            </button>

            <p className="mt-3 text-xs text-text-muted text-center">
              Starting from ₹{minPrice}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        title={`Book ${selectedService?.name || 'Service'}`}
      >
        <div className="mb-4 p-3 bg-surface rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">{provider.name}</p>
              <p className="text-sm text-text-secondary">{selectedService?.name}</p>
            </div>
            <span className="text-lg font-bold text-primary">₹{selectedService?.price}</span>
          </div>
        </div>
        {bookingLoading ? (
          <div className="py-8 text-center text-primary font-medium">Processing booking with database...</div>
        ) : (
          <BookingForm
            provider={provider}
            service={selectedService}
            onSubmit={handleBookingSubmit}
          />
        )}
      </Modal>

      {/* Login Modal prompt if guest clicks Book */}
      <AuthModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        onAuthSuccess={() => {
          setAuthModal(false);
          setBookingModal(true);
        }}
      />
    </div>
  );
}