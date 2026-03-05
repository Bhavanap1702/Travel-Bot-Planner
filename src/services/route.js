// src/services/route.js
function haversine(a, b){
  const R = 6371; // km
  const toRad = v => v * Math.PI/180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  const d = 2 * R * Math.asin(Math.sqrt(h));
  return d; // km
}

export async function computeRoute({ origin, destinations = [], mode = "driving" }){
  // simple leg-by-leg compute
  const legs = [];
  let cur = origin;
  const speedKmph = mode === "walking" ? 5 : 40; // conservative driving speed
  let totalKm = 0;
  for (const d of destinations){
    const km = haversine(cur, d);
    const etaMin = Math.round((km / speedKmph) * 60);
    legs.push({ from: cur, to: d, km, etaMin });
    totalKm += km;
    cur = d;
  }
  return { mode, legs, totalKmKm: totalKm };
}
