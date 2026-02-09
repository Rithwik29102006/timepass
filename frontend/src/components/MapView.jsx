import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

function createIcon(color, borderColor) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position:relative; width:28px; height:28px;">
        <div style="
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:20px; height:20px; border-radius:50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px ${color}80, 0 1px 3px rgba(0,0,0,0.15);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const greenIcon = createIcon('#22c55e', '#16a34a');
const redIcon = createIcon('#ef4444', '#dc2626');
const yellowIcon = createIcon('#f59e0b', '#d97706');
const blueIcon = createIcon('#3b82f6', '#2563eb');

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [markers, map]);
  return null;
}

// Clean light map tiles
const LIGHT_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const LIGHT_ATTR = '&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>';

export default function MapView({ shipments = [], routePoints = [], singleMode = false }) {
  const defaultCenter = [22.5, 78.0];

  if (singleMode && routePoints.length > 0) {
    const positions = routePoints.map(p => [p.lat, p.lng]);
    const lastPoint = routePoints[routePoints.length - 1];
    return (
      <MapContainer center={[lastPoint.lat, lastPoint.lng]} zoom={6} className="w-full h-full rounded-xl" scrollWheelZoom style={{ background: '#f9fafb' }}>
        <TileLayer attribution={LIGHT_ATTR} url={LIGHT_TILE} />
        <Polyline positions={positions} pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8, dashArray: '8 6' }} />
        <Marker position={[routePoints[0].lat, routePoints[0].lng]} icon={blueIcon}>
          <Popup><div className="text-xs font-semibold text-gray-800">Origin</div></Popup>
        </Marker>
        <Marker position={[lastPoint.lat, lastPoint.lng]} icon={greenIcon}>
          <Popup><div className="text-xs font-semibold text-gray-800">Current Position</div></Popup>
        </Marker>
        <FitBounds markers={routePoints} />
      </MapContainer>
    );
  }

  const markers = shipments.map(s => ({
    lat: s.lastLocation?.lat || s.origin.lat,
    lng: s.lastLocation?.lng || s.origin.lng,
    temp: s.lastTemperature,
    name: s.productName,
    id: s.id,
    status: s.status,
  }));

  return (
    <MapContainer center={defaultCenter} zoom={5} className="w-full h-full rounded-xl" scrollWheelZoom style={{ background: '#f9fafb' }}>
      <TileLayer attribution={LIGHT_ATTR} url={LIGHT_TILE} />
      {markers.map(m => {
        let icon = greenIcon;
        if (m.temp > 10 || m.temp < 0) icon = redIcon;
        else if (m.temp > 8 || m.temp < 2) icon = yellowIcon;

        return (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
            <Popup>
              <div className="text-xs space-y-1 p-1">
                <p className="font-bold text-sm text-gray-900">{m.name}</p>
                <p className="text-gray-500">{m.id} · {m.status}</p>
                {m.temp != null && (
                  <p className="font-mono font-bold text-sm" style={{ color: m.temp > 8 || m.temp < 2 ? '#ef4444' : '#22c55e' }}>
                    {m.temp.toFixed(1)}°C
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      {markers.length > 0 && <FitBounds markers={markers} />}
    </MapContainer>
  );
}
