import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// ── Fix webpack breaking leaflet's default icon paths ────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

// ── Custom SVG marker factories ───────────────────────────────────────────────
function makeStationIcon(bikeCount, selected) {
  const color   = selected ? '#00e5a0' : bikeCount > 0 ? '#3b82f6' : '#4a6080';
  const outline = selected ? 'white'   : 'rgba(0,0,0,0.4)';
  const txt     = selected ? '#000a06' : '#ffffff';
  return L.divIcon({
    className: '',
    iconSize:   [34, 42],
    iconAnchor: [17, 42],
    popupAnchor:[0, -44],
    html: `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 11.3 17 25 17 25S34 28.3 34 17C34 7.6 26.4 0 17 0z"
            fill="${color}" stroke="${outline}" stroke-width="1.5"/>
      <circle cx="17" cy="17" r="8" fill="rgba(0,0,0,0.18)"/>
      <text x="17" y="21" text-anchor="middle" font-size="10" font-weight="700"
            font-family="'Space Grotesk',sans-serif" fill="${txt}">${bikeCount}</text>
    </svg>`,
  });
}

function makeUserIcon() {
  return L.divIcon({
    className: '',
    iconSize:   [22, 22],
    iconAnchor: [11, 11],
    popupAnchor:[0, -14],
    html: `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="9" fill="#00e5a0" stroke="#000a06" stroke-width="2" opacity="0.95"/>
      <circle cx="11" cy="11" r="3.5" fill="#000a06"/>
    </svg>`,
  });
}

function makePickupIcon() {
  return L.divIcon({
    className: '',
    iconSize:   [34, 42],
    iconAnchor: [17, 42],
    popupAnchor:[0, -44],
    html: `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 11.3 17 25 17 25S34 28.3 34 17C34 7.6 26.4 0 17 0z"
            fill="#3b82f6" stroke="white" stroke-width="2"/>
      <text x="17" y="22" text-anchor="middle" font-size="12" font-weight="700"
            font-family="sans-serif" fill="white">P</text>
    </svg>`,
  });
}

function makeDropIcon() {
  return L.divIcon({
    className: '',
    iconSize:   [34, 42],
    iconAnchor: [17, 42],
    popupAnchor:[0, -44],
    html: `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 11.3 17 25 17 25S34 28.3 34 17C34 7.6 26.4 0 17 0z"
            fill="#00e5a0" stroke="white" stroke-width="2"/>
      <text x="17" y="22" text-anchor="middle" font-size="12" font-weight="700"
            font-family="sans-serif" fill="#000a06">D</text>
    </svg>`,
  });
}

// ── Sub-component: fly to user location once it arrives ───────────────────────
function FlyToUser({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.4 });
    }
  }, [userLocation]); // eslint-disable-line
  return null;
}

// ── Sub-component: fit bounds to show both pickup and drop ────────────────────
function FitRoute({ pickup, drop }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && drop) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [drop.lat,   drop.lng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [pickup, drop]); // eslint-disable-line
  return null;
}

// ── Main MapView component ────────────────────────────────────────────────────
/**
 * Props:
 *   stations       – array of { id, name, city, lat, lng, bikeCount }
 *   selectedId     – highlighted station id
 *   onStationClick – (station) => void
 *   userLocation   – { lat, lng, accuracy } | null
 *   pickupStation  – station object
 *   dropStation    – station object
 *   showRoute      – bool
 *   center         – { lat, lng }
 *   zoom           – number (default 13)
 *   height         – CSS string (default '420px')
 *   activeRide     – bool (hides unlock button in popup)
 */
export default function MapView({
  stations    = [],
  selectedId,
  onStationClick,
  userLocation,
  pickupStation,
  dropStation,
  showRoute   = false,
  center,
  zoom        = 13,
  height      = '420px',
  activeRide  = false,
}) {
  const defaultCenter = center
    || (stations.length > 0 ? { lat: stations[0].lat, lng: stations[0].lng } : { lat: 12.9716, lng: 77.5946 });

  return (
    <div className="map-wrapper" style={{ height }}>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={zoom}
        className="map-container"
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark OSM tile layer — no API key needed */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Fly to user on GPS fix */}
        {userLocation && <FlyToUser userLocation={userLocation} />}

        {/* Fit map to route */}
        {showRoute && pickupStation && dropStation && (
          <FitRoute pickup={pickupStation} drop={dropStation} />
        )}

        {/* Station markers */}
        {stations.map(s => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={makeStationIcon(s.bikeCount, s.id === selectedId)}
            eventHandlers={{ click: () => onStationClick && onStationClick(s) }}
          >
            <Popup className="zuno-popup-wrap">
              <div className="zuno-popup">
                <div className="zp-name">{s.name}</div>
                <div className="zp-city">{s.city}</div>
                <div className={`zp-bikes ${s.bikeCount > 0 ? 'ok' : 'empty'}`}>
                  {s.bikeCount > 0 ? `${s.bikeCount} bikes available` : 'No bikes right now'}
                </div>
                {!activeRide && s.bikeCount > 0 && onStationClick && (
                  <button className="zp-btn" onClick={() => onStationClick(s)}>
                    Select This Station
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User location dot */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={makeUserIcon()}
            zIndexOffset={1000}
          >
            <Popup className="zuno-popup-wrap">
              <div className="zuno-popup">
                <div className="zp-name">Your location</div>
                {userLocation.accuracy && (
                  <div className="zp-city">Accuracy: ±{Math.round(userLocation.accuracy)}m</div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup marker (P) */}
        {pickupStation && (
          <Marker
            position={[pickupStation.lat, pickupStation.lng]}
            icon={makePickupIcon()}
            zIndexOffset={900}
          >
            <Popup className="zuno-popup-wrap">
              <div className="zuno-popup">
                <div className="zp-name">Pickup point</div>
                <div className="zp-city">{pickupStation.name}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drop marker (D) */}
        {dropStation && (
          <Marker
            position={[dropStation.lat, dropStation.lng]}
            icon={makeDropIcon()}
            zIndexOffset={900}
          >
            <Popup className="zuno-popup-wrap">
              <div className="zuno-popup">
                <div className="zp-name">Drop-off point</div>
                <div className="zp-city">{dropStation.name}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        {showRoute && pickupStation && dropStation && (
          <Polyline
            positions={[
              [pickupStation.lat, pickupStation.lng],
              [dropStation.lat,   dropStation.lng],
            ]}
            pathOptions={{ color: '#00e5a0', weight: 3, opacity: 0.85, dashArray: '10 8' }}
          />
        )}
      </MapContainer>
    </div>
  );
}
