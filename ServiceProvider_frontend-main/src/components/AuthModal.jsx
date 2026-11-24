import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import Modal from './Modal';
import API from '../utils/api';

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: 'customer',
  aadhaarImage: '',
  profilePicture: '',
  certificates: [],
  serviceCategory: '',
  experienceYears: 1,
};

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isRegister && formData.role === 'provider') {
      API.get('/categories')
        .then((res) => setCategories(res.data || []))
        .catch(() => setCategories([]));
    }
  }, [isRegister, formData.role]);

  useEffect(() => {
    if (!isOpen) {
      setShowPassword(false);
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setError('');
  };

  const validateInputs = () => {
    const cleanPhone = formData.phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return false;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return false;
    }

    if (isRegister) {
      if (!formData.name.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (formData.role === 'provider' && !formData.serviceCategory) {
        setError('Please select your service category.');
        return false;
      }
    }

    return true;
  };

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (!files?.length) return;

    try {
      if (name === 'certificates') {
        const base64Files = await Promise.all(
          Array.from(files).map((file) => convertToBase64(file))
        );
        setFormData((prev) => ({ ...prev, certificates: base64Files }));
      } else {
        const base64 = await convertToBase64(files[0]);
        setFormData((prev) => ({ ...prev, [name]: base64 }));
      }
      setError('');
    } catch {
      setError('Could not read the selected file. Please try another file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      let lat = null;
      let lng = null;
      const locationName = null;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (geoErr) {
          console.warn('Geolocation denied or failed', geoErr);
        }
      }

      let authData = null;

      if (isRegister) {
        const regPayload = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          password: formData.password,
          role: formData.role || 'customer',
        };

        const userRes = await API.post('/users/register', regPayload);
        const newUserId = userRes.data?.user?._id || userRes.data?._id;

        if (formData.role === 'provider') {
          await API.post('/providers', {
            userId: newUserId,
            aadhaarImage: formData.aadhaarImage || 'default_id_url',
            profilePicture: formData.profilePicture || 'default_pic_url',
            certificates: Array.isArray(formData.certificates) ? formData.certificates : [],
            servicesOffered: [formData.serviceCategory],
            experienceYears: Number(formData.experienceYears) || 1,
            location: lat && lng ? { type: 'Point', coordinates: [lng, lat] } : undefined,
            locationName,
          });
        }

        const loginRes = await API.post('/users/login', {
          phone: formData.phone.trim(),
          password: formData.password,
          lat,
          lng,
          locationName,
        });
        authData = loginRes.data;
      } else {
        const loginRes = await API.post('/users/login', {
          phone: formData.phone.trim(),
          password: formData.password,
          lat,
          lng,
          locationName,
        });
        authData = loginRes.data;
      }

      if (authData?.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
        if (onAuthSuccess) {
          onAuthSuccess(authData.user);
        }

        const signedInRole = (authData.user.role || '').toLowerCase();
        setFormData(INITIAL_FORM);
        onClose();

        if (signedInRole === 'provider') {
          navigate('/provider-dashboard');
        }
      } else {
        throw new Error('Authentication succeeded but invalid user payload received.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Authentication failed. Please verify your credentials.';
      setError(serverMessage);
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
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Phone Number (10 digits)
          </label>
          <input
            type="tel"
            name="phone"
            required
            maxLength={10}
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary transition-colors"
          />
        </div>

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. rahul@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
            </button>
          </div>
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
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name || cat.categoryName}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-text-muted mt-1">
                Select the primary service you offer to customers.
              </p>
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Profile Picture (Image)
              </label>
              <input
                type="file"
                accept="image/*"
                name="profilePicture"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Identity Proof (Image) *
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                name="aadhaarImage"
                required
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Certificates (Multiple Allowed)
              </label>
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
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className="text-primary font-semibold hover:underline ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className="text-primary font-semibold hover:underline ml-1 cursor-pointer"
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