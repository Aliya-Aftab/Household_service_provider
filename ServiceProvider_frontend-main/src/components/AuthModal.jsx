import { useState } from 'react';
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      let authData = null;

      if (isRegister) {
        const regPayload = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          password: formData.password,
          role: formData.role || 'customer',
        };

        const regRes = await API.post('/users/register', regPayload);
        authData = regRes.data;

        // Fallback: If registration did not return token, sign in immediately
        if (!authData?.token) {
          const loginRes = await API.post('/users/login', {
            phone: formData.phone.trim(),
            password: formData.password,
          });
          authData = loginRes.data;
        }
      } else {
        const loginRes = await API.post('/users/login', {
          phone: formData.phone.trim(),
          password: formData.password,
        });
        authData = loginRes.data;
      }

      if (authData?.token && authData?.user) {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        if (onAuthSuccess) {
          onAuthSuccess(authData.user);
        }
        
        // Reset state & close modal
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          role: 'customer',
        });
        onClose();
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
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary transition-colors"
          />
        </div>

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
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
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