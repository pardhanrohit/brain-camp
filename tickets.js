import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    type: { type: String, enum: ["solo", "team", "vip"], required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 }
  },
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
