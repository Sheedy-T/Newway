// routes/liveRooms.js
const express = require("express");
const LiveRoom = require("../models/LiveRoom");

module.exports = (rooms) => {
  const router = express.Router(); // ✅ moved inside

  // CREATE
  router.post("/", async (req, res) => {
    try {
      const { title, hostName, isPrivate } = req.body;
      const roomId = Math.random().toString(36).slice(2, 11);

      let existing = await LiveRoom.findOne({ roomId });
      if (existing) return res.status(400).json({ error: "Room already exists" });

      const newRoom = new LiveRoom({
        roomId,
        title: title || "Untitled Room",
        hostName: hostName || "Admin",
        isPrivate: isPrivate || false,
      });
      await newRoom.save();

      rooms[roomId] = { users: {}, screenSharer: null, messages: [] };

      res.status(201).json(newRoom);
    } catch (err) {
      console.error("❌ Error creating room:", err);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // GET all rooms
  router.get("/", async (req, res) => {
    try {
      const mongoRooms = await LiveRoom.find().sort({ createdAt: -1 });
      res.json({
        persisted: mongoRooms,
        active: Object.keys(rooms),
      });
    } catch (err) {
      console.error("❌ Error fetching rooms:", err);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // GET one
  router.get("/:roomId", async (req, res) => {
    try {
      const room = await LiveRoom.findOne({ roomId: req.params.roomId });
      if (!room) return res.status(404).json({ error: "Room not found" });

      res.json({
        persisted: room,
        active: rooms[req.params.roomId] || null,
      });
    } catch (err) {
      console.error("❌ Error fetching room:", err);
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  // DELETE
  router.delete("/:roomId", async (req, res) => {
    try {
      const deleted = await LiveRoom.findOneAndDelete({ roomId: req.params.roomId });
      delete rooms[req.params.roomId];

      if (!deleted) return res.status(404).json({ error: "Room not found" });
      res.json({ success: true, deleted });
    } catch (err) {
      console.error("❌ Error deleting room:", err);
      res.status(500).json({ error: "Failed to delete room" });
    }
  });

  return router;
};
