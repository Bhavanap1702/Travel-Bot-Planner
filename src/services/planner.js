// src/services/planner.js
import Place from "../models/place.js";
import Hotel from "../models/hotel.js";
import { computeRoute } from "./route.js";

export async function planItinerary({ origin = null, city, days = 1, budgetTier = "mid", interests = [] }){
  city = (city || "").toLowerCase();
  // fetch top places
  const places = await Place.find({ city }).sort({ popularity: -1 }).limit(days * 6);
  const hotels = await Hotel.find({ city }).sort({ priceNight: 1 }).limit(10);

  const itinerary = [];
  const pins = [];
  for (let d = 0; d < days; d++){
    const items = [];
    const slice = places.slice(d*3, d*3 + 3);
    let timeSlotStart = 9*60; // minutes from midnight
    for (const p of slice){
      items.push({
        time: `${Math.floor(timeSlotStart/60).toString().padStart(2,"0")}:${(timeSlotStart%60).toString().padStart(2,"0")}`,
        title: p.title,
        lat: p.geo.lat,
        lng: p.geo.lng,
        durationMin: 90,
        cost: p.fee || "0"
      });
      timeSlotStart += 120;
      pins.push({ title: p.title, lat: p.geo.lat, lng: p.geo.lng });
    }
    itinerary.push({ day: d+1, items });
  }

  // compute simple route from origin (or first hotel) through day 1 pins
  const originCoord = origin || (hotels[0] ? hotels[0].geo : (places[0] ? places[0].geo : { lat:0,lng:0 }));
  const destinations = pins.map(p => ({ lat: p.lat, lng: p.lng, name: p.title }));
  const route = await computeRoute({ origin: originCoord, destinations, mode: "driving" });

  const costs = {
    hotelPerNight: hotels[0] ? hotels[0].priceNight : 2000,
    transport: Math.round(route.totalKmKm * 5),
    tickets: 500 * days,
    foodPerDay: 600
  };

  return { itinerary, routes: [route], costs, pins, sources: [] };
}
