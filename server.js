import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Inquiry } from "./models/Inquiry.js";
import { Ticket } from "./models/Ticket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const TOTAL_CAPACITY = parseInt(process.env.TOTAL_CAPACITY || "80", 10);

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5500", "http://localhost:3000", "http://127.0.0.1:5500"],
  credentials: false
}));
app.use(express.json());

// DB connection
mongoose
  .connect(process.env.MONGO_URI, { dbName: "brain-upgrade-camp" })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Simple health check
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Contact endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, school, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    const inquiry = await Inquiry.create({ name, email, school, message });
    // Here you could also send an email notification using nodemailer, etc.
    res.status(201).json({ success: true, id: inquiry._id });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Ticket registration endpoint
app.post("/api/tickets", async (req, res) => {
  try {
    const { name, email, type, quantity } = req.body;

    if (!name || !email || !type || !quantity) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number." });
    }

    // Check capacity
    const usedSeats = await Ticket.aggregate([
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    const currentSeats = usedSeats.length ? usedSeats[0].total : 0;

    if (currentSeats + parsedQty > TOTAL_CAPACITY) {
      return res.status(400).json({
        error: "Not enough seats left for this registration."
      });
    }

    const ticket = await Ticket.create({
      name,
      email,
      type,
      quantity: parsedQty
    });

    res.status(201).json({ success: true, id: ticket._id });
  } catch (err) {
    console.error("Ticket error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Ticket stats endpoint
app.get("/api/tickets/stats", async (req, res) => {
  try {
    const usedSeatsAgg = await Ticket.aggregate([
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    const usedSeats = usedSeatsAgg.length ? usedSeatsAgg[0].total : 0;

    res.json({
      totalCapacity: TOTAL_CAPACITY,
      usedSeats
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Brain Upgrade backend running on http://localhost:${PORT}`);
});
