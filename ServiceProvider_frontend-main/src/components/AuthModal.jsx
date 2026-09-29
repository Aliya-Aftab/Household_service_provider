import { useState, useEffect } from 'react';
import Modal from './Modal';
import API from '../utils/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'customer',
    aadhaarImage: '',
    profilePicture: '',
    certificates: '',
    serviceCategory: '',
    experienceYears: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetch categories when the role switches to provider
  useEffect(() => {
    if (isRegister && formData.role === 'provider') {
      API.get('/categories')
        .then((res) => setCategories(res.data || []))
        .catch(() => setCategories([]));
    }
  }, [isRegister, formData.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (!files.length) return;

    if (name === 'certificates') {
      const base64Files = await Promise.all(
        Array.from(files).map((file) => convertToBase64(file))
      );
      setFormData((prev) => ({ ...prev, certificates: base64Files }));
    } else {
      const base64 = await convertToBase64(files[0]);
      setFormData((prev) => ({ ...prev, [name]: base64 }));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let lat = null;
      let lng = null;
      let locationName = null;
      
      // Get GPS coordinates — city name will be resolved server-side
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (geoErr) {
          console.warn("Geolocation denied or failed", geoErr);
        }
      }

      if (isRegister) {
        // Validate: provider must select a category
        if (formData.role === 'provider' && !formData.serviceCategory) {
          setError('Please select your service category (e.g. Plumber, Beauty, Carpenter).');
          setLoading(false);
          return;
        }

        // Register API call
        const userRes = await API.post('/users/register', {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        const newUserId = userRes.data._id;

        if (formData.role === 'provider') {
          await API.post('/providers', {
            userId: newUserId,
            aadhaarImage: formData.aadhaarImage || 'default_id_url',
            profilePicture: formData.profilePicture || 'default_pic_url',
            certificates: Array.isArray(formData.certificates) ? formData.certificates : [],
            servicesOffered: [formData.serviceCategory],
            experienceYears: Number(formData.experienceYears) || 1,
            location: (lat && lng) ? { type: "Point", coordinates: [lng, lat] } : undefined,
            locationName
          });
        }

        // Auto login after registration
        const loginRes = await API.post('/users/login', {
          phone: formData.phone,
          password: formData.password,
          lat,
          lng,
          locationName
        });

        localStorage.setItem('token', loginRes.data.token);
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
        if (onAuthSuccess) onAuthSuccess(loginRes.data.user);
        onClose();
      } else {
        // Login API call
        const res = await API.post('/users/login', {
          phone: formData.phone,
          password: formData.password,
          lat,
          lng,
          locationName
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (onAuthSuccess) onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? 'Create an Account' : 'Sign In to SmartService'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. rahul@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
            >
              <option value="customer">Customer</option>
              <option value="provider">Service Provider</option>
            </select>
          </div>
        )}

        {isRegister && formData.role === 'provider' && (
          <>
            {/* ── Service Category (mandatory) ── */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                name="serviceCategory"
                value={formData.serviceCategory}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
              >
                <option value="">-- Select your service type --</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  /* Fallback hardcoded list if DB categories not seeded yet */
                  <>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="carpenter">Carpenter</option>
                    <option value="beauty">Beauty &amp; Salon</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="painter">Painter</option>
                    <option value="ac_repair">AC Repair</option>
                    <option value="appliance_repair">Appliance Repair</option>
                  </>
                )}
              </select>
              <p className="text-[10px] text-text-muted mt-1">
                Select the primary service you offer to customers.
              </p>
            </div>

            {/* ── Experience Years ── */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                name="experienceYears"
                min="0"
                max="50"
                value={formData.experienceYears}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>

            {/* ── Profile Picture ── */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Profile Picture (Image)</label>
              <input
                type="file"
                accept="image/*"
                name="profilePicture"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            {/* ── Aadhaar ── */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Aadhaar/ID Proof (Image) *</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                name="aadhaarImage"
                required
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            {/* ── Certificates ── */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Certificates (Multiple Allowed)</label>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                name="certificates"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Processing...' : isRegister ? 'Register & Sign In' : 'Sign In'}
        </button>

        <div className="pt-2 text-center text-xs text-text-secondary">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className="text-primary font-semibold hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className="text-primary font-semibold hover:underline ml-1"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}