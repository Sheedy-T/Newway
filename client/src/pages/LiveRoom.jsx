// client/src/pages/LiveRoom.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";
import * as mediasoupClient from "mediasoup-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  XCircle,
  RefreshCcw,
  Send,
  PhoneOff,
  Power,
  Camera,
  CameraOff,
  VolumeX,
  Volume2,
  MoreVertical,
  X,
} from "lucide-react";

// IMPORTANT: match your server CORS origins (localhost not 127.0.0.1)
const socket = io("https://newway-2bho.onrender.com", { withCredentials: true });

export default function LiveRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);

  const role = query.get("role") || "student";
  const displayName = query.get("name") || "Guest";
  const MODE = (query.get("mode") || "mesh").toLowerCase(); // "mesh" or "sfu"
  const { roomId } = useParams();

  // peersRef stores simple-peer instances keyed by peerId (mesh mode)
  const peersRef = useRef({});
  const [peerStreams, setPeerStreams] = useState({});
  const [peerMeta, setPeerMeta] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approved, setApproved] = useState(role === "admin");

  // chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  // media / UI state
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [mirror, setMirror] = useState(true); // default mirrored

  // leave/end state
  const [liveEnded, setLiveEnded] = useState(false);

  // Admin action menu state
  const [actionMenu, setActionMenu] = useState({
    open: false,
    peerId: null,
    anchor: { x: 0, y: 0 },
  });

  // Streams (local)
  const camStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Local video DOM ref
  const localVideoRef = useRef(null);

  // ---- SFU state/refs ----
  const sfuRef = useRef({
    device: null,
    sendTransport: null,
    recvTransport: null,
    producers: { audio: null, video: null }, // mediasoup Producers
    consumers: {}, // { consumerId: mediasoupConsumer }
    // combine remote tracks by peerId into a single MediaStream for UI
    remoteStreamsByPeer: {}, // { peerId: MediaStream }
  });

  // attach stream to element safely
  const attachStream = useCallback((el, stream) => {
    if (!el) return;
    if (!stream) {
      try {
        el.srcObject = null;
      } catch {}
      return;
    }
    if (el.srcObject !== stream) el.srcObject = stream;
    const p = el.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  // Replace outgoing cam track for all peers (mesh) OR replace SFU producer track
  const replaceVideoTrackForAllPeers = useCallback(
    async (newTrack) => {
      if (!newTrack) return;
      if (MODE === "mesh") {
        Object.values(peersRef.current).forEach((peer) => {
          try {
            const pc = peer?._pc;
            if (pc?.getSenders) {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video");
              if (sender) sender.replaceTrack(newTrack);
            }
          } catch (err) {
            console.warn("replaceVideoTrackForAllPeers error", err);
          }
        });
      } else {
        try {
          const vp = sfuRef.current.producers.video;
          if (vp?.replaceTrack) {
            await vp.replaceTrack({ track: newTrack });
          }
        } catch (err) {
          console.warn("SFU replaceTrack error:", err);
        }
      }
    },
    [MODE]
  );

  // Ensure a peer exists and is wired (mesh)
  const ensurePeer = useCallback((peerId, initiator) => {
    let peer = peersRef.current[peerId];
    if (peer) return peer;

    peer = new Peer({
      initiator,
      trickle: false,
      stream: camStreamRef.current || undefined,
    });

    peer.on("signal", (signal) => {
      socket.emit("signal", { to: peerId, from: socket.id, signal });
    });

    peer.on("stream", (remoteStream) => {
      setPeerStreams((prev) => ({ ...prev, [peerId]: remoteStream }));
    });

    peer.on("close", () => {
      setPeerStreams((prev) => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
      setPeerMeta((prev) => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
      delete peersRef.current[peerId];
    });

    peer.on("error", (err) => {
      console.warn("peer error", peerId, err?.message || err);
    });

    peersRef.current[peerId] = peer;
    return peer;
  }, []);

  // ---------- FIX: explicit setters for camera/mic (used everywhere, incl. forced actions) ----------
  const setCameraState = useCallback(
    async (enable) => {
      setCamOn(enable);

      // Ensure a video track exists if we are enabling camera
      if (enable) {
        if (!camStreamRef.current || camStreamRef.current.getVideoTracks().length === 0) {
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const track = newStream.getVideoTracks()[0];
            if (track) {
              if (camStreamRef.current) {
                camStreamRef.current.addTrack(track);
              } else {
                camStreamRef.current = new MediaStream([track]);
              }
              await replaceVideoTrackForAllPeers(track);
              if (localVideoRef.current) attachStream(localVideoRef.current, camStreamRef.current);
            }
          } catch (err) {
            console.error("Failed to reacquire camera:", err);
          }
        }
      }

      if (MODE === "mesh") {
        if (camStreamRef.current) {
          camStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = enable));
        }
        socket.emit("media-state", { roomId, camOn: enable, micOn });
      } else {
        const vp = sfuRef.current.producers.video;
        if (vp) {
          try {
            if (enable) await vp.resume();
            else await vp.pause();
          } catch (e) {
            console.warn("video producer set state failed:", e);
          }
        }
        socket.emit("media-state", { roomId, camOn: enable, micOn });
      }
    },
    [MODE, micOn, roomId, attachStream, replaceVideoTrackForAllPeers]
  );

  const setMicState = useCallback(
    async (enable) => {
      setMicOn(enable);

      if (MODE === "mesh") {
        if (camStreamRef.current) {
          camStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = enable));
        }
        socket.emit("media-state", { roomId, camOn, micOn: enable });
      } else {
        const ap = sfuRef.current.producers.audio;
        if (ap) {
          try {
            if (enable) await ap.resume();
            else await ap.pause();
          } catch (e) {
            console.warn("audio producer set state failed:", e);
          }
        }
        socket.emit("media-state", { roomId, camOn, micOn: enable });
      }
    },
    [MODE, camOn, roomId]
  );

  // Local UI toggles call the explicit setters
  const toggleCamera = useCallback(() => setCameraState(!camOn), [camOn, setCameraState]);
  const toggleMic = useCallback(() => setMicState(!micOn), [micOn, setMicState]);

  // Screen share flow
  const startShare = useCallback(() => socket.emit("request-screen", { roomId }), [roomId]);
  const stopShare = useCallback(() => socket.emit("stop-screen", { roomId }), [roomId]);

  // ---- Leave / End Live ----
  const hardCleanupAndExit = useCallback(() => {
    try {
      if (camStreamRef.current) {
        camStreamRef.current.getTracks().forEach((t) => t.stop());
        camStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      Object.values(peersRef.current).forEach((p) => p.destroy?.());
      peersRef.current = {};
      // Close SFU transports/producers if any
      try {
        sfuRef.current.producers.video?.close?.();
        sfuRef.current.producers.audio?.close?.();
        sfuRef.current.sendTransport?.close?.();
        sfuRef.current.recvTransport?.close?.();
      } catch {}
    } catch {}
    try {
      socket.off(); // remove all listeners bound to this socket
      socket.disconnect();
    } catch {}
    setLiveEnded(true);
  }, []);

  const leaveLive = useCallback(() => {
    socket.emit("leave-room", { roomId });
    hardCleanupAndExit();
  }, [hardCleanupAndExit, roomId]);

  const endLiveForAll = useCallback(() => {
    if (role !== "admin") return;
    socket.emit("end-live", { roomId });
    hardCleanupAndExit();
  }, [hardCleanupAndExit, roomId, role]);

  // ---- SFU helpers ----
  const ensureRemoteStream = useCallback((peerId) => {
    if (!sfuRef.current.remoteStreamsByPeer[peerId]) {
      sfuRef.current.remoteStreamsByPeer[peerId] = new MediaStream();
    }
    return sfuRef.current.remoteStreamsByPeer[peerId];
  }, []);

  const pushRemoteStreamToUI = useCallback((peerId) => {
    const ms = sfuRef.current.remoteStreamsByPeer[peerId];
    if (!ms) return;
    setPeerStreams((prev) => ({ ...prev, [peerId]: ms }));
  }, []);

  // Start SFU publishing/consuming after approval
  const startSFU = useCallback(async () => {
    try {
      const device = new mediasoupClient.Device();

      // Router RTP caps
      await new Promise((resolve) => {
        socket.emit("sfu-join", { roomId });
        socket.once("sfu-rtp-capabilities", async (routerRtpCapabilities) => {
          await device.load({ routerRtpCapabilities });
          resolve();
        });
      });
      sfuRef.current.device = device;

      // Send transport
      const sendParams = await new Promise((resolve) => {
        socket.emit("sfu-create-transport", { direction: "send", roomId }, resolve);
      });
      const sendTransport = device.createSendTransport(sendParams);
      sendTransport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit("sfu-connect-transport", { transportId: sendTransport.id, dtlsParameters }, () => callback());
      });
      sendTransport.on("produce", ({ kind, rtpParameters, appData }, callback) => {
        socket.emit(
          "sfu-produce",
          {
            transportId: sendTransport.id,
            kind,
            rtpParameters,
            appData: { ...(appData || {}), type: kind === "video" ? "camera" : "mic" },
            roomId,
          },
          ({ id }) => callback({ id })
        );
      });
      sfuRef.current.sendTransport = sendTransport;

      // Produce local tracks (start paused to mirror UI)
      if (camStreamRef.current) {
        const vTrack = camStreamRef.current.getVideoTracks()[0];
        const aTrack = camStreamRef.current.getAudioTracks()[0];
        if (vTrack) {
          const vp = await sendTransport.produce({ track: vTrack, appData: { type: "camera" } });
          sfuRef.current.producers.video = vp;
          await vp.pause();
        }
        if (aTrack) {
          const ap = await sendTransport.produce({ track: aTrack, appData: { type: "mic" } });
          sfuRef.current.producers.audio = ap;
          await ap.pause();
        }
      }

      // Recv transport
      const recvParams = await new Promise((resolve) => {
        socket.emit("sfu-create-transport", { direction: "recv", roomId }, resolve);
      });
      const recvTransport = device.createRecvTransport(recvParams);
      recvTransport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit("sfu-connect-transport", { transportId: recvTransport.id, dtlsParameters }, () => callback());
      });
      sfuRef.current.recvTransport = recvTransport;

      // Existing producers
      const existing = await new Promise((resolve) => {
        socket.emit("sfu-get-producers", { roomId }, resolve);
      });

      const consumeProducer = async ({ producerId, peerId }) => {
        const params = await new Promise((resolve) => {
          socket.emit(
            "sfu-consume",
            { roomId, producerId, rtpCapabilities: device.rtpCapabilities, transportId: recvTransport.id },
            resolve
          );
        });
        if (!params || params.error) return;
        const consumer = await recvTransport.consume(params);
        sfuRef.current.consumers[consumer.id] = consumer;
        const stream = ensureRemoteStream(peerId);
        stream.addTrack(consumer.track);
        pushRemoteStreamToUI(peerId);
      };

      for (const p of existing || []) {
        if (p.peerId !== socket.id) {
          await consumeProducer(p);
        }
      }

      // New producers
      socket.on("sfu-new-producer", async (p) => {
        if (p.peerId === socket.id) return;
        await consumeProducer(p);
      });
    } catch (err) {
      console.error("startSFU error:", err);
    }
  }, [ensureRemoteStream, pushRemoteStreamToUI, roomId]);

  // Boot / socket handlers
  useEffect(() => {
    let alive = true;

    (async () => {
      // 1) Get camera & mic (disabled by default)
      try {
        camStreamRef.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.error("getUserMedia failed:", err);
        camStreamRef.current = null;
      }

      if (camStreamRef.current) {
        camStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = false));
        camStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
      }

      // Attach local preview early
      if (localVideoRef.current && camStreamRef.current) {
        attachStream(localVideoRef.current, camStreamRef.current);
      }

      // 2) Join room (roster/approval/chat/screen-share)
      socket.emit("join-room", { roomId, displayName, role });
      socket.emit("media-state", { roomId, camOn: false, micOn: false });

      // If admin (auto-approved), kick off SFU immediately when in SFU mode
      if (MODE === "sfu" && role === "admin") {
        await startSFU();
      }
    })();

    // ---- Server events ----
    const onHistory = (history = []) => {
      if (!alive) return;
      setMessages(history);
    };
    socket.on("room-history", onHistory);

    const onApproved = async ({ approved: ok }) => {
      setApproved(!!ok);
      if (MODE === "sfu" && ok) {
        await startSFU();
      }
    };
    socket.on("approved", onApproved);

    if (role === "admin") {
      socket.on("pending-users", (initialUsers) => setPendingUsers(initialUsers || []));
      socket.on("join-request", ({ peerId, displayName }) => {
        setPendingUsers((prev) =>
          prev.some((u) => u.peerId === peerId) ? prev : [...prev, { peerId, displayName }]
        );
      });
    }

    // Mesh-only WebRTC wiring
    if (MODE === "mesh") {
      socket.on("start-webrtc", ({ otherId, initiator, otherName }) => {
        ensurePeer(otherId, initiator);
        setPeerMeta((prev) => ({
          ...prev,
          [otherId]: { ...(prev[otherId] || {}), name: otherName },
        }));
      });

      socket.on("signal", ({ from, signal }) => {
        const p = ensurePeer(from, false);
        if (p && signal) p.signal(signal);
      });
    }

    socket.on("roster", ({ users, screenSharer }) => {
      setPeerMeta((prev) => {
        const next = { ...prev };
        (users || []).forEach((u) => {
          if (u.peerId === socket.id) return;
          next[u.peerId] = {
            ...(next[u.peerId] || {}),
            name: u.displayName,
            camOn: !!u.camOn,
            micOn: !!u.micOn,
            role: u.role,
          };
        });
        return next;
      });
      setIsSharing(screenSharer === socket.id);
    });

    socket.on("media-state", ({ peerId, camOn: pCam, micOn: pMic }) => {
      setPeerMeta((prev) => ({
        ...prev,
        [peerId]: { ...(prev[peerId] || {}), camOn: pCam, micOn: pMic },
      }));
    });

    socket.on("chat-message", ({ message, displayName: sender, ts }) => {
      setMessages((prev) => [...prev, { message, displayName: sender, ts }]);
    });

    socket.on("peer-left", ({ peerId }) => {
      if (MODE === "mesh") {
        const peer = peersRef.current[peerId];
        if (peer) peer.destroy();
      }
      setPeerStreams((prev) => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
      setPeerMeta((prev) => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
    });

    // Screen share coordination
    socket.on("screen-started", async ({ peerId }) => {
      try {
        if (peerId === socket.id) {
          try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = screenStream;
            setIsSharing(true);
            const screenTrack = screenStream.getVideoTracks()[0];
            if (screenTrack) await replaceVideoTrackForAllPeers(screenTrack);
            if (localVideoRef.current) attachStream(localVideoRef.current, screenStream);
            screenTrack.onended = () => {
              socket.emit("stop-screen", { roomId });
            };
          } catch (err) {
            console.error("getDisplayMedia failed:", err);
            socket.emit("stop-screen", { roomId });
          }
        } else {
          setIsSharing(true);
        }
      } catch (err) {
        console.error("screen-started handler error", err);
      }
    });

    socket.on("screen-stopped", async ({ peerId }) => {
      try {
        if (peerId === socket.id) {
          if (screenStreamRef.current) {
            const oldScreenTrack = screenStreamRef.current.getVideoTracks()[0];
            if (oldScreenTrack) oldScreenTrack.stop();
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
          }
          setIsSharing(false);
          const camTrack = camStreamRef.current?.getVideoTracks()[0];
          if (camTrack) await replaceVideoTrackForAllPeers(camTrack);
          if (localVideoRef.current && camStreamRef.current)
            attachStream(localVideoRef.current, camStreamRef.current);
        } else {
          setIsSharing(false);
        }
      } catch (err) {
        console.error("screen-stopped handler error", err);
      }
    });

    socket.on("screen-denied", ({ reason }) => {
      console.warn("screen denied:", reason);
    });

    // ---- Admin control events received by target user (EXPLICIT setters) ----
    socket.on("force-mute", async () => setMicState(false));
    socket.on("force-unmute", async () => setMicState(true));
    socket.on("force-cam-off", async () => setCameraState(false));
    socket.on("force-cam-on", async () => setCameraState(true));
    socket.on("forced-disconnect", () => {
      hardCleanupAndExit();
    });

    // ---- Live ended by admin ----
    socket.on("live-ended", () => {
      setLiveEnded(true);
      hardCleanupAndExit();
    });

    // cleanup
    return () => {
      alive = false;

      socket.off("room-history", onHistory);
      socket.off("approved", onApproved);
      socket.off("pending-users");
      socket.off("join-request");
      socket.off("start-webrtc");
      socket.off("signal");
      socket.off("roster");
      socket.off("media-state");
      socket.off("chat-message");
      socket.off("peer-left");
      socket.off("screen-started");
      socket.off("screen-stopped");
      socket.off("screen-denied");
      socket.off("sfu-rtp-capabilities");
      socket.off("sfu-new-producer");
      socket.off("force-mute");
      socket.off("force-unmute");
      socket.off("force-cam-off");
      socket.off("force-cam-on");
      socket.off("forced-disconnect");
      socket.off("live-ended");

      try {
        if (camStreamRef.current) {
          camStreamRef.current.getTracks().forEach((t) => t.stop());
          camStreamRef.current = null;
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }
        Object.values(peersRef.current).forEach((p) => p.destroy());
        peersRef.current = {};
        try {
          sfuRef.current.producers.video?.close?.();
          sfuRef.current.producers.audio?.close?.();
          sfuRef.current.sendTransport?.close?.();
          sfuRef.current.recvTransport?.close?.();
        } catch {}
      } catch {}

      setPeerStreams({});
      setPeerMeta({});
    };
  }, [
    // FIX: Removed setMicState and setCameraState to prevent disconnection cycle.
    MODE,
    displayName,
    role,
    roomId,
    attachStream,
    ensurePeer,
    replaceVideoTrackForAllPeers,
    hardCleanupAndExit,
    startSFU,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  // approve / reject handlers (admin)
  const approveUser = (peerId) => {
    socket.emit("approve-user", { roomId, peerId });
    setPendingUsers((prev) => prev.filter((u) => u.peerId !== peerId));
  };
  const rejectUser = (peerId) => {
    socket.emit("reject-user", { roomId, peerId });
    setPendingUsers((prev) => prev.filter((u) => u.peerId !== peerId));
  };

  // send chat (server persists and broadcasts)
  const sendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    socket.emit("chat-message", { roomId, message: trimmed, displayName });
    setChatInput("");
  };

  // auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // ---- Admin actions on a student ----
  const openActionMenu = (e, peerId) => {
    if (role !== "admin") return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenu({
      open: true,
      peerId,
      anchor: { x: rect.left + rect.width / 2, y: rect.top },
    });
  };

  const closeActionMenu = () => {
    setActionMenu({ open: false, peerId: null, anchor: { x: 0, y: 0 } });
  };

  const adminAction = (action) => {
    if (!actionMenu.peerId) return;
    socket.emit("admin-control", {
      roomId,
      targetId: actionMenu.peerId,
      action, // 'kick' | 'mute' | 'unmute' | 'camOff' | 'camOn'
    });
    closeActionMenu();
  };

  // ---- UI tiles ----
  const LocalTile = () => {
    const [refEl, setRefEl] = useState(null);
    // Attach either screen or cam stream depending on isSharing
    useEffect(() => {
      const streamToAttach =
        isSharing && screenStreamRef.current
          ? screenStreamRef.current
          : camStreamRef.current;
      if (refEl && streamToAttach) {
        attachStream(refEl, streamToAttach);
      } else if (refEl && !streamToAttach) {
        try {
          refEl.srcObject = null;
        } catch (e) {}
      }
    }, [refEl, isSharing, attachStream]);

    return (
      <div className="relative w-72 h-52 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
        {/* Keep the element mounted; track.enabled controls visibility */}
        <video
          ref={(el) => {
            setRefEl(el);
            localVideoRef.current = el;
          }}
          autoPlay
          playsInline
          muted
          className={`w-72 h-52 rounded-lg object-cover ${
            mirror && !isSharing ? "scale-x-[-1]" : ""
          } ${!(camOn || isSharing) ? "opacity-0" : "opacity-100"}`}
        />
        {!(camOn || isSharing) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl font-bold">{displayName}</div>
          </div>
        )}

        <div className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
          You
        </div>

        {/* Controls */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          <button
            onClick={toggleMic}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80"
            title={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleCamera}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80"
            title={camOn ? "Turn camera off" : "Turn camera on"}
          >
            {camOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {!isSharing ? (
            <button
              onClick={startShare}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80"
              title="Start screen share"
            >
              <ScreenShare size={20} />
            </button>
          ) : (
            <button
              onClick={stopShare}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700"
              title="Stop screen share"
            >
              <XCircle size={20} />
            </button>
          )}

          <button
            onClick={() => setMirror((m) => !m)}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80"
            title={mirror ? "Mirror Off" : "Mirror On"}
          >
            <RefreshCcw size={18} />
          </button>

          {/* Leave / End Live */}
          {role === "admin" ? (
            <button
              onClick={endLiveForAll}
              className="p-2 rounded-full bg-red-700 hover:bg-red-800"
              title="End Live for everyone"
            >
              <Power size={18} />
            </button>
          ) : (
            <button
              onClick={leaveLive}
              className="p-2 rounded-full bg-red-700 hover:bg-red-800"
              title="Leave Live"
            >
              <PhoneOff size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const RemoteTile = ({ peerId, stream }) => {
    const meta = peerMeta[peerId] || {};
    const [refEl, setRefEl] = useState(null);

    useEffect(() => {
      attachStream(refEl, stream);
    }, [refEl, stream, attachStream]);

    return (
      <div
        className="relative w-72 h-52 rounded-lg bg-neutral-900 text-white flex items-center justify-center group"
        onClick={(e) => openActionMenu(e, peerId)}
        title={role === "admin" ? "Click for admin actions" : undefined}
      >
        {(meta.camOn || stream) ? (
          <video
            ref={setRefEl}
            autoPlay
            playsInline
            className="w-72 h-52 rounded-lg object-cover"
          />
        ) : (
          <div className="text-2xl font-bold">{meta.name || "User"}</div>
        )}

        <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 rounded text-xs">
          {meta.name || "User"}
        </div>

        {role === "admin" && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <MoreVertical />
          </div>
        )}
      </div>
    );
  };

  if (!approved && role !== "admin") {
    return <h2 className="text-center text-xl">⏳ Waiting for host approval…</h2>;
  }

  if (liveEnded) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Live ended</h2>
        <p className="text-neutral-400 mt-2">
          The session has ended. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4 h-screen">
      <h2 className="font-bold text-xl">
        🎥 Live Room: {roomId}{" "}
        <span className="text-xs text-neutral-500">({MODE.toUpperCase()})</span>
      </h2>

      <div className="flex flex-wrap gap-3">
        <LocalTile />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(peerStreams).map(([peerId, stream]) => (
            <RemoteTile key={peerId} peerId={peerId} stream={stream} />
          ))}
        </div>
      </div>

      {/* Admin join requests */}
      {role === "admin" && (
        <div className="mt-2 border p-2 rounded">
          <h3 className="font-bold">👥 Join Requests</h3>
          {pendingUsers.length === 0 ? (
            <p>No pending users</p>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.peerId} className="flex gap-2 items-center py-1">
                <span className="font-medium">{u.displayName}</span>
                <button
                  onClick={() => approveUser(u.peerId)}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => rejectUser(u.peerId)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat */}
      <div className="mt-2 border-t pt-2 flex flex-col h-64">
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {messages.map((m, i) => (
            <div
              key={m.ts ?? i}
              className={`p-2 rounded max-w-[80%] ${
                m.displayName === displayName
                  ? "bg-blue-600 ml-auto text-right"
                  : "bg-neutral-700"
              }`}
            >
              <div className="text-xs opacity-75 font-semibold">
                {m.displayName}
              </div>
              <div>{m.message}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-800 rounded px-3 py-2 outline-none text-white"
          />
          <button
            onClick={sendChat}
            className="bg-blue-600 px-4 rounded flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Admin Action Menu (floating) */}
      {role === "admin" && actionMenu.open && (
        <div
          className="fixed inset-0"
          onClick={closeActionMenu}
          style={{ zIndex: 50 }}
        >
          <div
            className="absolute bg-neutral-900 text-white rounded-xl shadow-lg p-3 w-64 border border-neutral-800"
            style={{
              top: actionMenu.anchor.y + 10,
              left: actionMenu.anchor.x - 128,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">Admin Controls</div>
              <button
                onClick={closeActionMenu}
                className="p-1 rounded hover:bg-neutral-800"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => adminAction("kick")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-800"
              >
                <PhoneOff size={16} />
                <span>Disconnect student</span>
              </button>
              <button
                onClick={() => adminAction("mute")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-800"
              >
                <VolumeX size={16} />
                <span>Mute mic</span>
              </button>
              <button
                onClick={() => adminAction("unmute")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-800"
              >
                <Volume2 size={16} />
                <span>Unmute mic</span>
              </button>
              <button
                onClick={() => adminAction("camOff")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-800"
              >
                <CameraOff size={16} />
                <span>Turn camera off</span>
              </button>
              <button
                onClick={() => adminAction("camOn")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-800"
              >
                <Camera size={16} />
                <span>Turn camera on</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}