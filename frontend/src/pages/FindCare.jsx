import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Clock, Phone, ShieldCheck, Loader2, AlertCircle,
  Navigation, Building2, Stethoscope, Search, Route
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for User, Verified, and External
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const verifiedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const externalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map Updater Component to auto-fit bounds
const MapUpdater = ({ facilities, userLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (!facilities || facilities.length === 0) {
      if (userLocation) map.setView(userLocation, 13);
      return;
    }

    const bounds = L.latLngBounds();
    if (userLocation) bounds.extend(userLocation);
    
    let hasValidPoints = false;
    facilities.forEach(fac => {
      if (fac.latitude && fac.longitude) {
        bounds.extend([fac.latitude, fac.longitude]);
        hasValidPoints = true;
      }
    });

    if (hasValidPoints || userLocation) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [facilities, userLocation, map]);
  
  return null;
};

const FindCare = () => {
  const [facilities, setFacilities] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('facilities');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Try geolocation first
        if (navigator.geolocation) {
          setGeoStatus('Detecting your location...');
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation([latitude, longitude]);
              setGeoStatus(`Location found`);
              try {
                const res = await api.get('/facilities/nearby', {
                  params: { latitude, longitude, radius: 25 },
                });
                setFacilities(res.data);
              } catch (err) {
                // Fallback to all facilities
                const res = await api.get('/facilities/');
                setFacilities(res.data);
              }
              setLoading(false);
            },
            async () => {
              // Geolocation denied — load all facilities
              setGeoStatus('Location access denied — showing all facilities');
              try {
                const res = await api.get('/facilities/');
                setFacilities(res.data);
              } catch (err) {
                setError('Failed to load facilities');
              }
              setLoading(false);
            },
            { timeout: 5000 }
          );
        } else {
          const res = await api.get('/facilities/');
          setFacilities(res.data);
          setLoading(false);
        }

        // Also fetch doctors
        try {
          const docRes = await api.get('/doctors');
          setDoctors(docRes.data);
        } catch (err) {
          console.error('Doctor fetch error:', err);
        }
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.address && f.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 gap-3">
        <Loader2 className="h-8 w-8 text-slate-900 animate-spin" />
        <p className="text-slate-500 text-[13px] font-medium">{geoStatus || t('common.loading')}</p>
      </div>
    );
  }

  const defaultCenter = userLocation || [20.5937, 78.9629]; // Default to India if no location

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight mb-1">{t('find_care.title')}</h1>
          {geoStatus && (
            <p className="text-[13px] text-slate-500 flex items-center gap-1 font-medium">
              <Navigation className="h-3.5 w-3.5" /> {geoStatus}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('find_care.search_placeholder')}
          className="w-full pl-11 pr-4 py-2.5 rounded-[30px] border border-slate-200 text-[13px] focus:ring-3 focus:ring-slate-100 focus:border-slate-300 outline-none transition"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'facilities' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            
            {/* Left: Scrollable List View */}
            <div className="w-full lg:w-5/12 xl:w-1/3 overflow-y-auto space-y-4 pr-2 pb-4">
              {filteredFacilities.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                  <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-[13px]">{t('find_care.no_results')}</p>
                </div>
              ) : (
                filteredFacilities.map((facility) => (
                  <div key={facility.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition">
                    <div className="flex flex-col justify-between items-start gap-4">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-900 text-[16px]">{facility.name}</h3>
                          {facility.source === 'sehatsetu' ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" title="Verified SehatSetu Partner"><ShieldCheck className="h-3 w-3" /> Verified</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full" title="Live External Data">External API</span>
                          )}
                        </div>
                        
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mb-2">{facility.type}</p>
                        
                        <p className="text-[13px] text-slate-600 mt-1 flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                          <span>{facility.address}{facility.city ? `, ${facility.city}` : ''}</span>
                        </p>
                        
                        {facility.phone && (
                          <p className="text-sm text-gray-600 mt-1.5 flex items-center gap-1.5">
                            <Phone className="h-4 w-4" /> {facility.phone}
                          </p>
                        )}
                        
                        {facility.opening_hours && (
                          <p className="text-[13px] text-slate-600 mt-1.5 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 opacity-70" /> {facility.opening_hours}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between w-full gap-3 pt-3 border-t border-slate-100">
                        <div className="flex gap-1.5">
                          {facility.distance != null && (
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                              {facility.distance} km
                            </span>
                          )}
                          {facility.is_24_7 && <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">24/7</span>}
                          {facility.has_emergency && <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> ER</span>}
                        </div>

                        {facility.latitude && facility.longitude && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[13px] text-slate-700 font-semibold hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-[30px] transition"
                          >
                            <Route className="h-4 w-4" /> Directions
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Map View */}
            <div className="w-full lg:w-7/12 xl:w-2/3 h-[400px] lg:h-full rounded-2xl overflow-hidden border border-slate-200 relative z-0 shrink-0 lg:shrink">
              <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater facilities={filteredFacilities} userLocation={userLocation} />
                
                {/* Distinct Red Marker for User Location */}
                {userLocation && (
                  <Marker position={userLocation} icon={userIcon}>
                    <Popup><strong>📍 You are here</strong></Popup>
                  </Marker>
                )}

                {/* Facilities Markers */}
                {filteredFacilities.map(facility => {
                  if (!facility.latitude || !facility.longitude) return null;
                  const isVerified = facility.source === 'sehatsetu';
                  
                  return (
                    <Marker 
                      key={facility.id} 
                      position={[facility.latitude, facility.longitude]}
                      icon={isVerified ? verifiedIcon : externalIcon}
                    >
                      <Popup>
                        <div className="p-1 min-w-[200px]">
                          <div className="flex items-center gap-1 mb-1">
                            <strong className="text-base leading-tight block text-slate-900">{facility.name}</strong>
                            {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline" title="Verified" />}
                          </div>
                          <p className="text-xs text-slate-400 uppercase font-bold mb-2 tracking-widest">{facility.type}</p>
                          <p className="text-[13px] text-slate-600 mb-1">{facility.address}</p>
                          {facility.distance && <p className="text-xs font-bold text-slate-700">{facility.distance} km away</p>}
                          
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                            target="_blank" rel="noopener noreferrer"
                            className="mt-2 text-xs block text-center bg-slate-900 text-white font-semibold py-2 rounded-[30px] transition hover:bg-slate-800"
                          >
                            Get Directions
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              
              {/* Map Legend */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm z-[1000] text-sm">
                <h4 className="font-bold text-slate-900 mb-2 text-[11px] uppercase tracking-widest">Map Legend</h4>
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={userIcon.options.iconUrl} alt="red marker" className="h-4" />
                  <span className="font-medium text-slate-600 text-[12px]">Your Location</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={verifiedIcon.options.iconUrl} alt="black marker" className="h-4" />
                  <span className="font-medium text-slate-600 text-[12px]">Verified Partner</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={externalIcon.options.iconUrl} alt="grey marker" className="h-4" />
                  <span className="font-medium text-slate-600 text-[12px]">External Provider</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default FindCare;
