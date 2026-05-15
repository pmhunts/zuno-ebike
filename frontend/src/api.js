const BASE = '/api';

const headers = () => {
  const token = localStorage.getItem('zuno_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

export const api = {
  // Auth
  register: (body)       => fetch(`${BASE}/auth/register`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  login:    (body)       => fetch(`${BASE}/auth/login`,    { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
  me:       ()           => fetch(`${BASE}/auth/me`,       { headers: headers() }).then(handle),

  // Wallet
  topup: (amount)        => fetch(`${BASE}/wallet/topup`,  { method: 'POST', headers: headers(), body: JSON.stringify({ amount }) }).then(handle),

  // Stations & cities
  getCities:  ()         => fetch(`${BASE}/cities`,        { headers: headers() }).then(handle),
  getStations: (city)    => fetch(`${BASE}/stations${city ? `?city=${encodeURIComponent(city)}` : ''}`, { headers: headers() }).then(handle),
  getStation:  (id)      => fetch(`${BASE}/stations/${id}`, { headers: headers() }).then(handle),

  // Fare estimate
  estimate: (fromId, toId) => fetch(`${BASE}/fare/estimate?fromId=${fromId}&toId=${toId}`, { headers: headers() }).then(handle),

  // Rides
  startRide:   (pickupStationId) => fetch(`${BASE}/rides/start`, { method: 'POST', headers: headers(), body: JSON.stringify({ pickupStationId }) }).then(handle),
  endRide:     (rideId, dropStationId) => fetch(`${BASE}/rides/${rideId}/end`, { method: 'POST', headers: headers(), body: JSON.stringify({ dropStationId }) }).then(handle),
  getActiveRide: ()      => fetch(`${BASE}/rides/active`,  { headers: headers() }).then(handle),
  getRides:    ()        => fetch(`${BASE}/rides`,         { headers: headers() }).then(handle),
  getRide:     (id)      => fetch(`${BASE}/rides/${id}`,   { headers: headers() }).then(handle),



  // Pricing
  getPricing:  ()        => fetch(`${BASE}/pricing`,       { headers: headers() }).then(handle),

  // Newsletter
  newsletter: (email)    => fetch(`${BASE}/newsletter`, { method: 'POST', headers: headers(), body: JSON.stringify({ email }) }).then(handle),
};
