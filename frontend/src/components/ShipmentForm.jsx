import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ShipmentForm({ onClose, onCreated }) {
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({
    productName: '',
    originAddress: '',
    originLat: '28.6139',
    originLng: '77.2090',
    destAddress: '',
    destLat: '13.0827',
    destLng: '80.2707',
    deviceId: '',
    tempMin: '2',
    tempMax: '8',
  });

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        productName: form.productName,
        origin: { address: form.originAddress, lat: parseFloat(form.originLat), lng: parseFloat(form.originLng) },
        destination: { address: form.destAddress, lat: parseFloat(form.destLat), lng: parseFloat(form.destLng) },
        deviceId: form.deviceId || null,
        tempRange: { min: parseFloat(form.tempMin), max: parseFloat(form.tempMax) },
      };
      const shipment = await api.createShipment(data);
      onCreated?.(shipment);
      onClose();
    } catch (err) {
      alert('Failed to create shipment: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-modal border border-gray-100 animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Shipment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Configure a new cold-chain transport</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-90">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name</label>
            <input name="productName" value={form.productName} onChange={handleChange} required
              className="input-field" placeholder="e.g., COVID-19 Vaccine (Moderna)" />
          </div>

          {/* Origin */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-info-100 flex items-center justify-center text-info-600 text-[10px] font-bold">A</span>
              <span className="text-sm font-semibold text-gray-700">Origin</span>
            </div>
            <input name="originAddress" value={form.originAddress} onChange={handleChange} required
              className="input-field" placeholder="Address" />
            <div className="grid grid-cols-2 gap-3">
              <input name="originLat" value={form.originLat} onChange={handleChange} required type="number" step="any"
                className="input-field" placeholder="Latitude" />
              <input name="originLng" value={form.originLng} onChange={handleChange} required type="number" step="any"
                className="input-field" placeholder="Longitude" />
            </div>
          </div>

          {/* Destination */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-primary-100 flex items-center justify-center text-primary-700 text-[10px] font-bold">B</span>
              <span className="text-sm font-semibold text-gray-700">Destination</span>
            </div>
            <input name="destAddress" value={form.destAddress} onChange={handleChange} required
              className="input-field" placeholder="Address" />
            <div className="grid grid-cols-2 gap-3">
              <input name="destLat" value={form.destLat} onChange={handleChange} required type="number" step="any"
                className="input-field" placeholder="Latitude" />
              <input name="destLng" value={form.destLng} onChange={handleChange} required type="number" step="any"
                className="input-field" placeholder="Longitude" />
            </div>
          </div>

          {/* Device + Temp Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tracking Device</label>
              <select name="deviceId" value={form.deviceId} onChange={handleChange}
                className="input-field appearance-none cursor-pointer">
                <option value="">No device</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Temp Range (°C)</label>
              <div className="flex gap-2">
                <input name="tempMin" value={form.tempMin} onChange={handleChange} type="number" step="any"
                  className="input-field" placeholder="Min" />
                <input name="tempMax" value={form.tempMax} onChange={handleChange} type="number" step="any"
                  className="input-field" placeholder="Max" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Discard
            </button>
            <button type="submit" className="btn-primary flex-1">
              Create Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
