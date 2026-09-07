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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Register API call
        await API.post('/users/register', {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        // Auto login after registration
        const loginRes = await API.post('/users/login', {
          phone: formData.phone,
          password: formData.password,
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