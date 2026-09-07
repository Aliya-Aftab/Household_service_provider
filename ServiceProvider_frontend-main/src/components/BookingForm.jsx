import { useState } from 'react';

export default function BookingForm({ provider, service, onSubmit }) {
  const [form, setForm] = useState({
    date: '',
    time: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
    notes: '',
    payment: 'cash',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
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
            <option value="">Select a time</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="address">
          Address
        </label>
        <input
          id="address"
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          required
          placeholder="Street address, apartment, etc."
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="city">City</label>
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
          <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="pincode">Pincode</label>
          <input
            id="pincode"
            type="text"
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            required
            placeholder="560001"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
          placeholder="+91 9876543210"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="notes">
          Special Instructions (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any specific requirements..."
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
        />
      </div>

      {/* Payment */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">Payment Method</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'cash', label: '💵 Cash', desc: 'Pay on service' },
            { value: 'upi', label: '📱 UPI', desc: 'GPay, PhonePe' },
            { value: 'card', label: '💳 Card', desc: 'Credit/Debit' },
          ].map((method) => (
            <button
              type="button"
              key={method.value}
              onClick={() => setForm({ ...form, payment: method.value })}
              className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                form.payment === method.value
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-gray-300'
              }`}
            >
              <p className="text-base">{method.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{method.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity duration-200 cursor-pointer"
      >
        Confirm Booking
      </button>
    </form>
  );
}
