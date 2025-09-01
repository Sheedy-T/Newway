// Minimal mediasoup SFU wiring over Socket.IO.
// Install: npm i mediasoup
// Optional env: MEDIASOUP_ANNOUNCED_IP=<public-ip-or-127.0.0.1>

const mediasoup = require("mediasoup");

let worker;
const sfuRooms = new Map(); // roomId -> { router, transports: Map, producers: Map, peers: Set<socketId> }
const transportsById = new Map(); // transportId -> { transport, roomId, socketId, direction }
const producersById = new Map();  // producerId  -> { producer, roomId, socketId }
const consumersById = new Map();  // consumerId  -> { consumer, roomId, socketId }

async function createWorker() {
  if (worker) return worker;
  worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: "warn",
    logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
  });
  worker.on("died", () => {
    console.error("Mediasoup worker died, exiting...");
    process.exit(1);
  });
  return worker;
}

async function createRouter() {
  const w = await createWorker();
  const router = await w.createRouter({
    mediaCodecs: [
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: { "x-google-start-bitrate": 1000 },
      },
      {
        kind: "video",
        mimeType: "video/H264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
          "level-asymmetry-allowed": 1,
        },
      },
      { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
    ],
  });
  return router;
}

function ensureSfuRoom(roomId) {
  if (!sfuRooms.has(roomId)) {
    sfuRooms.set(roomId, {
      router: null,
      transports: new Map(),
      producers: new Map(),
      peers: new Set(),
    });
  }
  return sfuRooms.get(roomId);
}

async function getOrCreateRouterForRoom(roomId) {
  const room = ensureSfuRoom(roomId);
  if (!room.router) {
    room.router = await createRouter();
  }
  return room.router;
}

async function createWebRtcTransport(router) {
  const listenIps = [
    { ip: "0.0.0.0", announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1" },
  ];
  const transport = await router.createWebRtcTransport({
    listenIps,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    },
  };
}

module.exports = function setupSFU(io, roomsStore) {
  io.on("connection", (socket) => {
    // Client asks to join SFU room; reply with router RTP capabilities
    socket.on("sfu-join", async ({ roomId }) => {
      try {
        const router = await getOrCreateRouterForRoom(roomId);
        ensureSfuRoom(roomId).peers.add(socket.id);
        socket.join(roomId);
        socket.emit("sfu-rtp-capabilities", router.rtpCapabilities);
      } catch (err) {
        console.error("sfu-join error:", err);
      }
    });

    // Create a WebRTC transport (send/recv)
    socket.on("sfu-create-transport", async ({ direction, roomId }, cb = () => {}) => {
      try {
        const room = ensureSfuRoom(roomId);
        const router = await getOrCreateRouterForRoom(roomId);
        const { transport, params } = await createWebRtcTransport(router);

        room.transports.set(transport.id, transport);
        transportsById.set(transport.id, { transport, roomId, socketId: socket.id, direction });

        cb(params);
      } catch (err) {
        console.error("sfu-create-transport error:", err);
        cb({ error: err?.message || "create-transport failed" });
      }
    });

    // Connect transport (DTLS)
    socket.on("sfu-connect-transport", async ({ transportId, dtlsParameters }, cb = () => {}) => {
      try {
        const rec = transportsById.get(transportId);
        if (!rec) return cb({ error: "transport not found" });
        await rec.transport.connect({ dtlsParameters });
        cb({ ok: true });
      } catch (err) {
        console.error("sfu-connect-transport error:", err);
        cb({ error: err?.message || "connect-transport failed" });
      }
    });

    // Produce media
    socket.on("sfu-produce", async ({ transportId, kind, rtpParameters, appData = {}, roomId }, cb = () => {}) => {
      try {
        const rec = transportsById.get(transportId);
        if (!rec) return cb({ error: "transport not found" });

        const producer = await rec.transport.produce({
          kind,
          rtpParameters,
          appData: { ...appData, peerId: socket.id },
        });

        // Track producer
        producersById.set(producer.id, { producer, roomId, socketId: socket.id });
        ensureSfuRoom(roomId).producers.set(producer.id, producer);

        // Inform others in room that a new producer is available
        const displayName =
          roomsStore?.[roomId]?.users?.[socket.id]?.displayName || "User";
        socket.to(roomId).emit("sfu-new-producer", {
          producerId: producer.id,
          peerId: socket.id,
          displayName,
        });

        // Clean up
        producer.on("transportclose", () => {
          producer.close();
          producersById.delete(producer.id);
          ensureSfuRoom(roomId).producers.delete(producer.id);
        });
        producer.on("close", () => {
          producersById.delete(producer.id);
          ensureSfuRoom(roomId).producers.delete(producer.id);
        });

        cb({ id: producer.id });
      } catch (err) {
        console.error("sfu-produce error:", err);
        cb({ error: err?.message || "produce failed" });
      }
    });

    // Get existing producers in the room
    socket.on("sfu-get-producers", ({ roomId }, cb = () => {}) => {
      try {
        const room = ensureSfuRoom(roomId);
        const arr = [];
        for (const [producerId, producer] of room.producers.entries()) {
          const meta = producersById.get(producerId);
          if (!meta) continue;
          arr.push({
            producerId,
            peerId: meta.socketId,
          });
        }
        cb(arr);
      } catch (err) {
        console.error("sfu-get-producers error:", err);
        cb([]);
      }
    });

    // Consume a given producer
    socket.on(
      "sfu-consume",
      async ({ roomId, producerId, rtpCapabilities, transportId }, cb = () => {}) => {
        try {
          const room = ensureSfuRoom(roomId);
          const router = await getOrCreateRouterForRoom(roomId);
          if (!router.canConsume({ producerId, rtpCapabilities })) {
            return cb({ error: "cannot consume" });
          }

          const rec = transportsById.get(transportId);
          if (!rec) return cb({ error: "recv transport not found" });

          const consumer = await rec.transport.consume({
            producerId,
            rtpCapabilities,
            paused: false,
          });

          consumersById.set(consumer.id, { consumer, roomId, socketId: socket.id });

          consumer.on("transportclose", () => {
            consumer.close();
            consumersById.delete(consumer.id);
          });
          consumer.on("producerclose", () => {
            consumer.close();
            consumersById.delete(consumer.id);
          });

          cb({
            id: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused,
          });
        } catch (err) {
          console.error("sfu-consume error:", err);
          cb({ error: err?.message || "consume failed" });
        }
      }
    );

    // Disconnect cleanup
    socket.on("disconnect", () => {
      try {
        // Close producers
        for (const [producerId, meta] of producersById.entries()) {
          if (meta.socketId === socket.id) {
            try {
              meta.producer.close();
            } catch {}
            producersById.delete(producerId);
            const room = ensureSfuRoom(meta.roomId);
            room.producers.delete(producerId);
          }
        }

        // Close transports
        for (const [tid, rec] of transportsById.entries()) {
          if (rec.socketId === socket.id) {
            try {
              rec.transport.close();
            } catch {}
            transportsById.delete(tid);
            const room = ensureSfuRoom(rec.roomId);
            room.transports.delete(tid);
          }
        }

        // Close consumers
        for (const [cid, rec] of consumersById.entries()) {
          if (rec.socketId === socket.id) {
            try {
              rec.consumer.close();
            } catch {}
            consumersById.delete(cid);
          }
        }

        // Remove from SFU room peers
        for (const [rid, r] of sfuRooms.entries()) {
          r.peers.delete(socket.id);
        }
      } catch (err) {
        console.error("SFU disconnect cleanup error:", err);
      }
    });
  });
};
