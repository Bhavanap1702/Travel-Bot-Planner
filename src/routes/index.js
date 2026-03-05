// src/routes/index.js
import { Router } from "express";
import places from "./places.js";
import hotels from "./hotels.js";
import plan from "./plan.js";
import route from "./route.js";
import bookings from "./bookings.js";
import chat from "./chat.js";

const r = Router();
r.use("/places", places);
r.use("/hotels", hotels);
r.use("/plan", plan);
r.use("/route", route);
r.use("/bookings", bookings);
r.use("/chat", chat);

export default r;
