import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, 
  MessageSquare, Send, User, Shield, Clock, WifiOff, RefreshCw, 
  Play, ArrowLeft, Sparkles, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Booking, UserProfile, LiveSession } from '../types';
import { updateLiveSessionStatus } from '../lib/liveSessions';

interface LiveSessionRoomViewProps {
  booking: Booking;
  liveSession: LiveSession;
  currentUser: UserProfile;
  otherUser: UserProfile;
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
        'stun:global.stun.twilio.com:3478'
      ]
    },
    {
      urls: 'stun:stun.relay.metered.ca:80'
    },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'b4184efc19a87be504964d84',
      credential: 'Vt2I7OzXS7pIg7rJ'
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: 'b4184efc19a87be504964d84',
      credential: 'Vt2I7OzXS7pIg7rJ'
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'b4184efc19a87be504964d84',
      credential: 'Vt2I7OzXS7pIg7rJ'
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: 'b4184efc19a87be504964d84',
      credential: 'Vt2I7OzXS7pIg7rJ'
    }
  ],
  iceCandidatePoolSize: 10
};

export default function LiveSessionRoomView({
  booking,
  liveSession,
  currentUser,
  otherUser,
  onLeave
}: LiveSessionRoomViewProps) {
  // Room state
  const [inLobby, setInLobby] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'failed'
  >('idle');

  // Media Controls State (Local)
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Device Readiness States
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'ready' | 'off' | 'denied' | 'not_found' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'ready' | 'muted' | 'denied' | 'not_found' | 'error'>('checking');
  const [cameraName, setCameraName] = useState<string>('Standard Camera');
  const [micName, setMicName] = useState<string>('Standard Microphone');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Remote Participant Media State
  const [remoteMediaState, setRemoteMediaState] = useState<{ isMicOn: boolean; isCameraOn: boolean }>({
    isMicOn: true,
    isCameraOn: true
  });

  // In-call UI state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // WebRTC & Media Stream Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const isTeacher = currentUser.id === booking.teacherId;

  // Auto-scroll chat on new message
  useEffect(() => {
    if (showChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // 1. Initialize & Verify Local Devices (Camera & Microphone)
  const getLocalLiveChat = (sessionId: string): ChatMessage[] => {
    try {
      const raw = localStorage.getItem(`live_chat_${sessionId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalLiveChat = (sessionId: string, msg: ChatMessage) => {
    try {
      const existing = getLocalLiveChat(sessionId);
      if (!existing.some(m => m.id === msg.id)) {
        const updated = [...existing, msg];
        localStorage.setItem(`live_chat_${sessionId}`, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to save live chat locally:', e);
    }
  };

  useEffect(() => {
    if (!liveSession?.id) return;
    const initialMsgs = getLocalLiveChat(liveSession.id);
    setChatMessages(initialMsgs);

    // Fetch existing live session chat history from Supabase if stored
    supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', liveSession.id)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped: ChatMessage[] = data.map((d: any) => ({
            id: d.id,
            senderId: d.sender_id,
            senderName: d.sender_id === currentUser.id ? currentUser.name : otherUser.name,
            text: d.text,
            timestamp: d.timestamp ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setChatMessages(mapped);
          mapped.forEach(m => saveLocalLiveChat(liveSession.id, m));
        }
      });
  }, [liveSession.id]);

  const initLobbyMedia = async () => {
    setCameraStatus('checking');
    setMicStatus('checking');
    setDeviceError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;

      if (lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = stream;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Check Video Track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === 'live') {
        setCameraStatus('ready');
        setCameraName(videoTrack.label || 'Default Camera');
        setIsCameraOn(true);
      } else {
        setCameraStatus('not_found');
      }

      // Check Audio Track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && audioTrack.readyState === 'live') {
        setMicStatus('ready');
        setMicName(audioTrack.label || 'Default Microphone');
        setIsMicOn(true);

        // Real Audio Meter measuring
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 64;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkVolume = () => {
              if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
                requestAnimationFrame(checkVolume);
              }
            };
            checkVolume();
          }
        } catch (e) {
          console.log('Audio level meter optional init error:', e);
        }
      } else {
        setMicStatus('not_found');
      }
    } catch (err: any) {
      console.warn('Camera/Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setMicStatus('denied');
        setDeviceError('Permission denied: Your browser is blocking camera and microphone access.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('not_found');
        setMicStatus('not_found');
        setDeviceError('No camera or microphone hardware found on your device.');
      } else {
        setCameraStatus('error');
        setMicStatus('error');
        setDeviceError(err.message || 'Could not connect to media devices.');
      }
    }
  };

  useEffect(() => {
    initLobbyMedia();

    // Component Unmount Cleanup: Stop camera/mic/screen streams, close WebRTC, remove channel
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // 2. Timer Effect
  useEffect(() => {
    if (inLobby) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [inLobby]);

  // Helper to broadcast media status to peer
  const sendMediaStateSignal = (cam: boolean, mic: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          senderId: currentUser.id,
          signalType: 'media-state',
          isCameraOn: cam,
          isMicOn: mic
        }
      });
    }
  };

  // 3. Audio / Video Track Toggles
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !isCameraOn;
        videoTrack.enabled = nextState;
        setIsCameraOn(nextState);
        sendMediaStateSignal(nextState, isMicOn);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !isMicOn;
        audioTrack.enabled = nextState;
        setIsMicOn(nextState);
        sendMediaStateSignal(isCameraOn, nextState);
      }
    }
  };

  // 4. Screen Sharing Toggle & Reversion Logic
  const stopScreenSharing = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    if (peerConnectionRef.current && localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      if (videoSender && videoTrack) {
        await videoSender.replaceTrack(videoTrack);
      }
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
    sendMediaStateSignal(isCameraOn, isMicOn);
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      await stopScreenSharing();
    } else {
      // Start Screen Sharing with native getDisplayMedia
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace outgoing video track in WebRTC connection
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        } else {
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
        }

        // Show screen share preview in local video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Handle native browser "Stop sharing" floating UI button
        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
        sendMediaStateSignal(true, isMicOn);
      } catch (err) {
        console.warn('Screen sharing request declined or error:', err);
      }
    }
  };

  // 5. Enter Classroom & Setup WebRTC
  const enterClassroom = async () => {
    setInLobby(false);
    setConnectionStatus('connecting');

    // Attach stream to in-classroom video element
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    try {
      // Update status in database
      await updateLiveSessionStatus(liveSession.id, 'live');

      // Setup WebRTC and signaling only if database status update succeeded
      setupWebRTCAndSignaling();
    } catch (err) {
      console.error('[LiveSessionRoomView] Failed to update session status to live in database:', err);
      setConnectionStatus('failed');
    }
  };

  // 6. WebRTC Core Setup with Supabase Realtime Channel
  const setupWebRTCAndSignaling = async () => {
    // Safely cleanup existing peer connection and channel to prevent duplicate listeners
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus('connected');
      }
    };

    // Connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionStatus('disconnected');
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionStatus('failed');
      }
    };

    // Broadcast ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            senderId: currentUser.id,
            signalType: 'ice-candidate',
            candidate: event.candidate.toJSON()
          }
        });
      }
    };

    // Initialize Private Supabase Realtime Signaling Channel for this room
    const channelName = `session_signaling_${liveSession.id}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: currentUser.id }
      }
    });

    channelRef.current = channel;

    // Listen to WebRTC signals
    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (payload.senderId === currentUser.id) return; // ignore self

      const { signalType, offer, answer, candidate, isCameraOn: remoteCam, isMicOn: remoteMic } = payload;

      try {
        if (signalType === 'media-state') {
          setRemoteMediaState({
            isCameraOn: remoteCam ?? true,
            isMicOn: remoteMic ?? true
          });
        } else if (signalType === 'offer') {
          console.log('[WebRTC] Received offer from peer');
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          // Process any buffered ICE candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
          }

          const localAnswer = await pc.createAnswer();
          await pc.setLocalDescription(localAnswer);

          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              senderId: currentUser.id,
              signalType: 'answer',
              answer: localAnswer
            }
          });

          // Also share current media state
          sendMediaStateSignal(isCameraOn, isMicOn);

        } else if (signalType === 'answer') {
          console.log('[WebRTC] Received answer from peer');
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
          }

          // Also share current media state
          sendMediaStateSignal(isCameraOn, isMicOn);

        } else if (signalType === 'ice-candidate') {
          if (candidate) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              pendingCandidatesRef.current.push(candidate);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signaling error:', err);
      }
    });

    // Listen for In-Call Text Chat (scoped to this live session)
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === payload.id)) return prev;
        const updated = [...prev, payload];
        saveLocalLiveChat(liveSession.id, payload);
        return updated;
      });
    });

    // Presence tracking & Handshake Initiation
    channel.on('presence', { event: 'sync' }, async () => {
      const presenceState = channel.presenceState();
      const userIds = Object.keys(presenceState);
      console.log('[Realtime] Presence Sync, online users in room:', userIds);

      // If both users are present
      if (userIds.length >= 2) {
        setConnectionStatus('connecting');
        // Initiate offer if teacher or deterministic tie-breaker
        if (isTeacher || currentUser.id < otherUser.id) {
          try {
            console.log('[WebRTC] Creating offer...');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                senderId: currentUser.id,
                signalType: 'offer',
                offer
              }
            });
          } catch (err) {
            console.error('[WebRTC] Error creating offer:', err);
          }
        }
      } else {
        setConnectionStatus('waiting');
      }
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('[Realtime] Remote user left room:', leftPresences);
      setConnectionStatus('disconnected');
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to room channel:', channelName);
        await channel.track({
          userId: currentUser.id,
          name: currentUser.name,
          role: isTeacher ? 'teacher' : 'learner',
          joinedAt: new Date().toISOString()
        });
      }
    });
  };

  // 7. Send In-Call Chat Message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !channelRef.current) return;

    const newMsg: ChatMessage = {
      id: `msg-live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Broadcast in real-time to current channel
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: newMsg
    });

    setChatMessages(prev => [...prev, newMsg]);
    saveLocalLiveChat(liveSession.id, newMsg);
    setChatInput('');

    // Persist to Supabase if backend available
    try {
      await supabase.from('messages').insert([{
        sender_id: currentUser.id,
        receiver_id: liveSession.id,
        text: newMsg.text,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn('Supabase live session chat insert fallback:', err);
    }
  };

  // 8. Clean Up & Leave Session
  const handleEndSession = async () => {
    // Stop local camera/mic
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    // Close WebRTC connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Unsubscribe Supabase channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Update status in database
    try {
      await updateLiveSessionStatus(liveSession.id, 'ended', { endTime: new Date().toISOString() });
    } catch (err) {
      console.warn('[LiveSessionRoomView] Failed to update session status to ended in database:', err);
    } finally {
      onLeave();
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // LOBBY VIEW (Device Preparation Screen)
  if (inLobby) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-xs text-slate-700">
        <button
          onClick={onLeave}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left: Camera Preview & Quick Toggles */}
          <div className="md:col-span-7 bg-slate-950 p-6 flex flex-col justify-between items-center min-h-[420px] relative">
            <div className="w-full flex items-center justify-between text-slate-400 text-xs z-10">
              <span className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Device & Media Setup
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-bold text-[10px] border border-slate-700">
                {isTeacher ? 'Instructor' : 'Learner'} Preview
              </span>
            </div>

            {/* Video Preview Frame */}
            <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl my-auto flex items-center justify-center">
              <video
                ref={lobbyVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraOn || cameraStatus === 'denied' || cameraStatus === 'error' ? 'hidden' : ''}`}
              />

              {(!isCameraOn || cameraStatus === 'denied' || cameraStatus === 'error' || cameraStatus === 'off') && (
                <div className="flex flex-col items-center gap-2.5 text-slate-400 p-6 text-center">
                  <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-700">
                    <VideoOff className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">
                      {cameraStatus === 'denied' ? 'Camera Access Blocked' : 'Camera is Turned Off'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      {cameraStatus === 'denied'
                        ? 'Grant browser camera permissions to enable video'
                        : 'Click the camera button below to test your video preview'}
                    </p>
                  </div>
                </div>
              )}

              {/* User watermark badge */}
              <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white font-medium text-[11px] flex items-center gap-2 border border-slate-800 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isCameraOn && cameraStatus === 'ready' ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
                <span>{currentUser.name} (You)</span>
              </div>
            </div>

            {/* Preview Control Toggle Bar */}
            <div className="flex items-center gap-3 z-10 pt-2">
              <button
                onClick={toggleMic}
                className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-xs ${
                  isMicOn 
                    ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700' 
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{isMicOn ? 'Mic Active' : 'Muted'}</span>
              </button>

              <button
                onClick={toggleCamera}
                className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-xs ${
                  isCameraOn 
                    ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700' 
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
                title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span>{isCameraOn ? 'Camera Active' : 'Camera Off'}</span>
              </button>
            </div>
          </div>

          {/* Right: Device Readiness Health Check & Join Session CTA */}
          <div className="md:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-slate-50/50">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Step 1 of 2 • Readiness Check
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  Device Preparation
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Test your video & audio before entering <strong>{booking.skillName}</strong>.
                </p>
              </div>

              {/* Hardware Status Breakdown */}
              <div className="space-y-2.5">
                
                {/* Camera Status Row */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${cameraStatus === 'ready' && isCameraOn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Camera</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{cameraName}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                    cameraStatus === 'ready' && isCameraOn
                      ? 'bg-emerald-100 text-emerald-800'
                      : cameraStatus === 'denied'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {cameraStatus === 'ready' && isCameraOn
                      ? 'Camera: Ready'
                      : cameraStatus === 'denied'
                      ? 'Blocked'
                      : !isCameraOn
                      ? 'Camera: Off'
                      : 'Checking...'}
                  </span>
                </div>

                {/* Microphone Status Row with Live Audio Meter */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${micStatus === 'ready' && isMicOn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Microphone</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{micName}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      micStatus === 'ready' && isMicOn
                        ? 'bg-emerald-100 text-emerald-800'
                        : micStatus === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {micStatus === 'ready' && isMicOn
                        ? 'Microphone: Ready'
                        : micStatus === 'denied'
                        ? 'Blocked'
                        : !isMicOn
                        ? 'Muted'
                        : 'Checking...'}
                    </span>
                  </div>

                  {/* Audio Level Visualizer Bar */}
                  {micStatus === 'ready' && isMicOn && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium">Mic Input Test:</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex items-center">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                          style={{ width: `${Math.max(8, audioLevel)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-600 font-bold">{audioLevel}%</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Permission Denied Troubleshooting Alert */}
              {deviceError && (
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-2 text-rose-900 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Hardware Permission Required</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-700">
                    Your browser blocked access to your camera or microphone.
                  </p>
                  <div className="bg-white/80 p-2.5 rounded-lg text-[10px] space-y-1 text-slate-700 border border-rose-100">
                    <p className="font-bold text-slate-900">How to fix permissions:</p>
                    <p>1. Click the lock/camera icon next to the URL bar.</p>
                    <p>2. Set Camera & Microphone permissions to <strong>Allow</strong>.</p>
                    <p>3. Click the button below to retry.</p>
                  </div>
                  <button
                    onClick={initLobbyMedia}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Device Check</span>
                  </button>
                </div>
              )}

              {/* Session Context Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 text-[11px] text-slate-600 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Classroom:</span>
                  <span className="font-bold text-slate-800">{booking.skillName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Instructor:</span>
                  <span className="font-bold text-slate-800">{booking.teacherName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Learner:</span>
                  <span className="font-bold text-slate-800">{booking.learnerName}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-slate-200">
              <button
                onClick={enterClassroom}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Join Session</span>
              </button>

              <button
                onClick={onLeave}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl transition cursor-pointer text-xs"
              >
                Cancel & Exit
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // CLASSROOM VIEW
  return (
    <div className="max-w-6xl mx-auto space-y-4 text-xs text-slate-700">
      
      {/* Top Session Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        
        {/* Left: Skill & Participants */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm border border-emerald-500/30">
            🎥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">{booking.skillName}</h2>
              <span className="px-2 py-0.5 bg-indigo-950/80 text-indigo-300 rounded text-[10px] font-semibold border border-indigo-800/60">
                1-on-1 Classroom
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
              <span>Instructor: <strong className="text-slate-200">{booking.teacherName}</strong></span>
              <span>•</span>
              <span>Learner: <strong className="text-slate-200">{booking.learnerName}</strong></span>
            </p>
          </div>
        </div>

        {/* Center: Status & Session Timer */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800">
            {connectionStatus === 'connected' && (
              <>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-bold text-emerald-400">Connected</span>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="font-medium text-amber-400">Connecting...</span>
              </>
            )}
            {connectionStatus === 'waiting' && (
              <>
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                <span className="font-medium text-amber-300">Waiting for participant...</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium text-rose-400">Participant disconnected</span>
              </>
            )}
            {connectionStatus === 'failed' && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium text-rose-400">Connection failed</span>
              </>
            )}
          </div>

          {/* Session Timer */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Right: Chat Toggle & Leave Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold ${
              showChat 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {chatMessages.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-400 text-slate-950 rounded-full text-[10px] font-extrabold">
                {chatMessages.length}
              </span>
            )}
          </button>

          <button
            onClick={handleEndSession}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave Session</span>
            <span className="sm:hidden">Leave</span>
          </button>
        </div>
      </div>

      {/* Main Classroom Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px] relative">
        
        {/* Left/Main Area: Main Video Stage */}
        <div className={`${showChat ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all space-y-3`}>
          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative shadow-xl border border-slate-800 flex items-center justify-center">
            
            {/* Remote Video Stream (Main Participant View) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                connectionStatus !== 'connected' || !remoteMediaState.isCameraOn ? 'hidden' : ''
              }`}
            />

            {/* Remote Participant Camera Off Placeholder */}
            {connectionStatus === 'connected' && !remoteMediaState.isCameraOn && (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-300 text-3xl font-bold shadow-inner">
                  {otherUser.name.charAt(0)}
                </div>
                <p className="font-semibold text-white text-sm">{otherUser.name}</p>
                <div className="px-2.5 py-1 bg-slate-900 rounded-full border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <VideoOff className="w-3 h-3 text-rose-400" />
                  <span>Participant camera is off</span>
                </div>
              </div>
            )}

            {/* Placeholder overlay when not fully connected */}
            {connectionStatus !== 'connected' && (
              <div className="flex flex-col items-center justify-center space-y-3 text-slate-400 p-6 text-center max-w-md z-10">
                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-300 text-2xl shadow-inner">
                  {connectionStatus === 'failed' ? (
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                  ) : connectionStatus === 'disconnected' ? (
                    <WifiOff className="w-8 h-8 text-amber-500" />
                  ) : (
                    <User className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {connectionStatus === 'waiting'
                      ? `Waiting for ${otherUser.name}...`
                      : connectionStatus === 'disconnected'
                      ? `${otherUser.name} disconnected or left`
                      : connectionStatus === 'failed'
                      ? 'Connection Could Not Be Established'
                      : 'Connecting WebRTC Stream...'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    {connectionStatus === 'waiting'
                      ? 'Both participants must join this room to begin the live two-way video call.'
                      : connectionStatus === 'disconnected'
                      ? 'The other user left or experienced a temporary network drop. Waiting to reconnect...'
                      : connectionStatus === 'failed'
                      ? 'The direct peer-to-peer connection could not be established. Check your network or firewall settings and click Retry.'
                      : 'Negotiating STUN/TURN ICE candidates and media streams...'}
                  </p>
                </div>

                {connectionStatus === 'waiting' && (
                  <div className="px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-amber-400 text-[11px] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Listening for peer presence on private channel</span>
                  </div>
                )}

                {(connectionStatus === 'failed' || connectionStatus === 'disconnected') && (
                  <button
                    onClick={() => {
                      enterClassroom();
                    }}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Connection</span>
                  </button>
                )}
              </div>
            )}

            {/* Remote User Label & Media Status Overlay */}
            <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 border border-slate-800 shadow-md">
              <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>{otherUser.name} ({isTeacher ? 'Learner' : 'Instructor'})</span>
              
              {/* Remote Mic Indicator */}
              {connectionStatus === 'connected' && (
                <span className={`p-1 rounded ${remoteMediaState.isMicOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {remoteMediaState.isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                </span>
              )}
            </div>

            {/* Local Video Stream Preview (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-40 sm:w-52 aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl z-20 group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
              />

              {!isCameraOn && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                  <VideoOff className="w-6 h-6 text-slate-600" />
                  <span className="text-[10px] font-semibold mt-1">Camera Off</span>
                </div>
              )}

              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between bg-slate-950/85 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white font-medium border border-slate-800/80">
                <span className="truncate">You ({currentUser.name})</span>
                <span className={`p-0.5 rounded ${isMicOn ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Classroom Controls Toolbar */}
          <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 flex flex-wrap items-center justify-center gap-3 shadow-lg">
            
            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                isMicOn 
                  ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' 
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">{isMicOn ? 'Mic On' : 'Muted'}</span>
                <span className="text-[9px] font-normal text-slate-400 mt-0.5">{isMicOn ? 'Click to Mute' : 'Click to Unmute'}</span>
              </div>
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                isCameraOn 
                  ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' 
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
              title={isCameraOn ? 'Stop Camera' : 'Start Camera'}
            >
              {isCameraOn ? <Video className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5" />}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">{isCameraOn ? 'Camera On' : 'Camera Off'}</span>
                <span className="text-[9px] font-normal text-slate-400 mt-0.5">{isCameraOn ? 'Click to Stop' : 'Click to Start'}</span>
              </div>
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                isScreenSharing 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">{isScreenSharing ? 'Sharing Screen' : 'Share Screen'}</span>
                <span className="text-[9px] font-normal text-slate-400 mt-0.5">{isScreenSharing ? 'Click to Stop' : 'Code / Slides'}</span>
              </div>
            </button>

            {/* Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
                showChat 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
              title="Toggle Classroom Chat"
            >
              <MessageSquare className="w-5 h-5" />
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">Classroom Chat</span>
                <span className="text-[9px] font-normal text-slate-400 mt-0.5">{chatMessages.length} messages</span>
              </div>
            </button>

            {/* Leave Session */}
            <button
              onClick={handleEndSession}
              className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-md"
              title="Leave Classroom Session"
            >
              <PhoneOff className="w-5 h-5" />
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">Leave Classroom</span>
                <span className="text-[9px] font-normal text-rose-200 mt-0.5">End connection</span>
              </div>
            </button>

          </div>
        </div>

        {/* Right Desktop Chat Side Panel (Hidden on mobile, shown as sidebar on lg+) */}
        {showChat && (
          <div className="hidden lg:flex lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-lg flex-col h-[520px] overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs">Classroom Notes & Chat</h3>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-600">No chat messages yet</p>
                  <p className="text-[11px]">Send code snippets, documentation links, or notes to your peer.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isSelf = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold text-slate-700">{isSelf ? 'You' : msg.senderName}</span>
                        <span>• {msg.timestamp}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[88%] text-xs leading-relaxed break-words ${
                          isSelf
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message or paste a link..."
                className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Mobile Chat Slide-over Drawer (Shows when showChat is true on mobile) */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex flex-col justify-end"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Classroom Notes & Chat</h3>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1.5 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50 min-h-[250px]">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                    <p className="font-semibold text-slate-600">No chat messages yet</p>
                    <p>Send messages, code snippets, or links during your call.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold text-slate-700">{isSelf ? 'You' : msg.senderName}</span>
                          <span>• {msg.timestamp}</span>
                        </div>
                        <div
                          className={`p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words ${
                            isSelf
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

