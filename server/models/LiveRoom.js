// server/models/LiveRoom.js
const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    socketId: String,
    displayName: String,
    role: { type: String, enum: ["admin", "student"], default: "student" },
    approved: { type: Boolean, default: false },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    sender: String,
    text: String,
    time: { type: Date, default: Date.now },
  },
  { _id: false }
);
const LiveRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    title: { type: String, default: "Untitled Room" },
    hostName: { type: String, default: "Admin" },
    isPrivate: { type: Boolean, default: false },
    participants: [ParticipantSchema],
    messages: [MessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveRoom", LiveRoomSchema);
