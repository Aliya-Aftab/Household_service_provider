import { useState, useEffect } from 'react';

export default function BookingForm({ provider, service, onSubmit }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    address: '',
    city: 'Gorakhpur',
    pincode: '',
    phone: '',
    notes: '',
    payment: 'cash',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.phone) {
          setForm((prev) => ({ ...prev, phone: parsed.phone }));
        }
      } catch (err) {
        console.error('Failed to prefill user phone:', err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'phone') nextValue = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'pincode') nextValue = value.replace(/\D/g, '').slice(0, 6);
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.date) {
      setFormError('Please select a valid booking date.');
      return;
    }

    if (!form.time) {
      setFormError('Please select a preferred time slot.');
      return;
    }

    if (!form.address.trim()) {
      setFormError('Please provide your service address.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setFormError('Please enter a valid 10-digit contact phone number.');
      return;
    }

    onSubmit?.(form);
  };

  const timeSlots = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-200">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="date">
            Service Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            min={todayStr}
            value={form.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="time">
            Time Slot
          </label>
          <select
            id="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="address">
          Service Address
        </label>
        <input
          id="address"
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          required
          placeholder="House/Flat number, landmark, street area..."
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="city">
            City
          </label>
          <input
            id="city"
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            placeholder="City"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="pincode">
            Pincode
          </label>
          <input
            id="pincode"
            type="text"
            name="pincode"
            maxLength={6}
            value={form.pincode}
            onChange={handleChange}
            placeholder="e.g. 273001"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="phone">
          Contact Phone
        </label>
        <input
          id="phone"
          type="tel"
          name="phone"
          maxLength={10}
          value={form.phone}
          onChange={handleChange}
          required
          placeholder="10-digit mobile number"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="notes">
          Special Instructions (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Any specific requirement or instructions for the professional..."
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Payment Method</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'cash', label: 'Cash', desc: 'Pay after service' },
            { value: 'upi', label: 'UPI', desc: 'GPay / PhonePe / Paytm' },
            { value: 'card', label: 'Card', desc: 'Credit / Debit' },
          ].map((method) => (
            <button
              type="button"
              key={method.value}
              onClick={() => setForm((prev) => ({ ...prev, payment: method.value }))}
              className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                form.payment === method.value
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-semibold">{method.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{method.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:opacity-95 transition-all shadow-md cursor-pointer"
      >
        Confirm &amp; Place Booking
      </button>
    </form>
  );
}