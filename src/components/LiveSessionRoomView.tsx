import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, 
  MessageSquare, Send, User, Shield, Clock, WifiOff, RefreshCw, 
  Play, ArrowLeft, Sparkles, AlertTriangle, X, CheckCircle,
  Maximize, Minimize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Booking, UserProfile, LiveSession, Review, Skill, LearningOption } from '../types';
import { updateLiveSessionStatus } from '../lib/liveSessions';
import { SessionCompleteSummary } from './SessionCompleteSummary';
import { useFullscreen } from '../lib/useFullscreen';

interface LiveSessionRoomViewProps {
  booking: Booking;
  liveSession: LiveSession;
  currentUser: UserProfile;
  otherUser: UserProfile;
  allUsers?: UserProfile[];
  allReviews?: Review[];
  onLeave: () => void;
  onLeaveReview?: (reviewData: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  onBookAnotherSession?: (teacher: UserProfile, skill: Skill, option: LearningOption, date: string, slot: 'Morning' | 'Afternoon' | 'Evening', notes: string) => void;
  onMarkSessionCompleted?: (bookingId: string) => Promise<void>;
  onMarkSessionNoShow?: (bookingId: string) => Promise<void>;
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
  allUsers = [],
  allReviews = [],
  onLeave,
  onLeaveReview = async () => {},
  onBookAnotherSession,
  onMarkSessionCompleted,
  onMarkSessionNoShow
}: LiveSessionRoomViewProps) {
  // Room state
  const [inLobby, setInLobby] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'waiting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed'
  >('idle');

  // Summary & Join Tracking
  const [showCompleteSummary, setShowCompleteSummary] = useState(false);
  const [hasBothJoinedState, setHasBothJoinedState] = useState(liveSession?.hasBothJoined || false);
  const [finalDurationSeconds, setFinalDurationSeconds] = useState(0);

  // Participant status tracking
  const [remoteUserLeft, setRemoteUserLeft] = useState(false);
  const [sessionEndedByPeer, setSessionEndedByPeer] = useState(false);
  const [peerWhoEnded, setPeerWhoEnded] = useState<string | null>(null);

  // Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Both Muted Prompt State
  const [showBothMutedPrompt, setShowBothMutedPrompt] = useState(false);

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
  
  // Timer tracking
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasEverConnected, setHasEverConnected] = useState(false);

  // WebRTC & Media Stream Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const videoStageRef = useRef<HTMLDivElement | null>(null);

  // Fullscreen hook integration
  const { isFullscreen, isFallback, toggleFullscreen } = useFullscreen(videoStageRef);

  const isFallbackFullscreen = isFullscreen && (isFallback || (typeof document !== 'undefined' && !document.fullscreenElement && !(document as any).webkitFullscreenElement));

  useEffect(() => {
    console.log('[LiveSession] isFullscreen:', isFullscreen, 'isFallback:', isFallback);
  }, [isFullscreen, isFallback]);

  const isTeacher = currentUser.id === booking.teacherId;

  // Auto-scroll chat on new message
  useEffect(() => {
    if (showChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Local Chat Persistence
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

  // Sync remote stream to video element when entering classroom or when stream is ready
  useEffect(() => {
    if (!inLobby && remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(e => console.warn('[LiveSessionRoomView] Remote video play warning:', e));
    }
  }, [inLobby]);

  // 1. Initialize & Verify Local Devices (Camera & Microphone)
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
        setCameraName(videoTrack.label || 'Standard Camera');
        setIsCameraOn(true);
      } else {
        setCameraStatus('not_found');
      }

      // Check Audio Track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && audioTrack.readyState === 'live') {
        setMicStatus('ready');
        setMicName(audioTrack.label || 'Standard Microphone');
        setIsMicOn(true);

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

    return () => {
      cleanupMediaAndConnections();
    };
  }, []);

  const cleanupMediaAndConnections = () => {
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

  // 2. Timer Effect - Starts once connected
  useEffect(() => {
    if (inLobby) return;
    if (connectionStatus === 'connected' && !hasEverConnected) {
      setHasEverConnected(true);
    }
  }, [inLobby, connectionStatus, hasEverConnected]);

  useEffect(() => {
    if (inLobby || !hasEverConnected) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [inLobby, hasEverConnected]);

  // 3. Both Muted Simultaneous Detection (5-10 second prompt)
  useEffect(() => {
    let timer: any;
    if (!inLobby && connectionStatus === 'connected' && !isMicOn && !remoteMediaState.isMicOn) {
      timer = setTimeout(() => {
        setShowBothMutedPrompt(true);
      }, 6000); // 6 seconds threshold
    } else {
      setShowBothMutedPrompt(false);
    }
    return () => clearTimeout(timer);
  }, [inLobby, connectionStatus, isMicOn, remoteMediaState.isMicOn]);

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

  // Audio / Video Track Toggles
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

  // Screen Sharing Toggle
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
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        } else {
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

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

  // Enter Classroom & Setup WebRTC
  const enterClassroom = async () => {
    setInLobby(false);
    setConnectionStatus('connecting');

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    try {
      await updateLiveSessionStatus(liveSession.id, 'live');
      setupWebRTCAndSignaling();
    } catch (err) {
      console.error('[LiveSessionRoomView] Failed to update session status to live:', err);
      setConnectionStatus('failed');
    }
  };

  // WebRTC Core Setup with Supabase Realtime Channel
  const setupWebRTCAndSignaling = async () => {
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(e => console.warn('[WebRTC] Remote play error:', e));
        }
        setConnectionStatus('connected');
        setRemoteUserLeft(false);
        setHasBothJoinedState(true);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
        setRemoteUserLeft(false);
        setHasBothJoinedState(true);
      } else if (pc.iceConnectionState === 'checking') {
        setConnectionStatus(prev => (prev === 'connected' ? 'reconnecting' : 'connecting'));
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionStatus('failed');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
        setRemoteUserLeft(false);
        setHasBothJoinedState(true);
      } else if (pc.connectionState === 'connecting') {
        setConnectionStatus(prev => (prev === 'connected' ? 'reconnecting' : 'connecting'));
      } else if (pc.connectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
      } else if (pc.connectionState === 'failed') {
        setConnectionStatus('failed');
      }
    };

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

    const channelName = `session_signaling_${liveSession.id}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: currentUser.id }
      }
    });

    channelRef.current = channel;

    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (payload.senderId === currentUser.id) return;

      const { signalType, offer, answer, candidate, isCameraOn: remoteCam, isMicOn: remoteMic, userName } = payload;

      try {
        if (signalType === 'user-left') {
          console.log('[WebRTC] Remote user explicitly left call:', userName);
          setRemoteUserLeft(true);
          setConnectionStatus('disconnected');
        } else if (signalType === 'session-ended-for-all') {
          console.log('[WebRTC] Remote user ended session for everyone:', userName);
          setSessionEndedByPeer(true);
          setPeerWhoEnded(userName || otherUser.name);
        } else if (signalType === 'media-state') {
          setRemoteMediaState({
            isCameraOn: remoteCam ?? true,
            isMicOn: remoteMic ?? true
          });
        } else if (signalType === 'request-offer') {
          if (isTeacher && pc) {
            console.log('[WebRTC] Received request-offer from peer. Creating offer...');
            try {
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
              console.error('[WebRTC] Error creating offer on request-offer:', err);
            }
          }
        } else if (signalType === 'offer') {
          console.log('[WebRTC] Received offer from peer');
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

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

          sendMediaStateSignal(isCameraOn, isMicOn);

        } else if (signalType === 'answer') {
          console.log('[WebRTC] Received answer from peer');
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
          }

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

    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === payload.id)) return prev;
        const updated = [...prev, payload];
        saveLocalLiveChat(liveSession.id, payload);
        return updated;
      });
    });

    channel.on('presence', { event: 'sync' }, async () => {
      const presenceState = channel.presenceState();
      const userIds = Object.keys(presenceState);
      console.log('[Realtime] Presence Sync, online users in room:', userIds);

      if (userIds.length >= 2) {
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connecting');
        }
        setRemoteUserLeft(false);
        setHasBothJoinedState(true);

        try {
          await updateLiveSessionStatus(liveSession.id, 'live', {
            hasBothJoined: true,
            teacherJoined: true,
            learnerJoined: true
          });
        } catch (e) {
          console.warn('[LiveSessions] Failed to update hasBothJoined:', e);
        }

        if (isTeacher) {
          try {
            console.log('[WebRTC] Teacher creating offer...');
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
        } else {
          // Learner requests offer if connection is not connected after 1s
          setTimeout(() => {
            if (pc.connectionState !== 'connected' && channelRef.current) {
              console.log('[WebRTC] Learner requesting offer from teacher...');
              channelRef.current.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  senderId: currentUser.id,
                  signalType: 'request-offer'
                }
              });
            }
          }, 1000);
        }
      } else {
        if (connectionStatus === 'connected') {
          setRemoteUserLeft(true);
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('waiting');
        }
      }
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('[Realtime] Remote user left room presence:', leftPresences);
      setRemoteUserLeft(true);
      setConnectionStatus('disconnected');
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to room channel:', channelName);
        await channel.track({
          userId: currentUser.id,
          name: currentUser.name,
          role: isTeacher ? 'teacher' : 'learner',
          joinedAt: new Date().toISOString()
        });

        // Track single user join status in live_sessions
        try {
          await updateLiveSessionStatus(liveSession.id, 'live', {
            teacherJoined: isTeacher ? true : undefined,
            learnerJoined: !isTeacher ? true : undefined
          });
        } catch (e) {
          console.warn('[LiveSessions] Failed to track single join:', e);
        }
      }
    });
  };

  // Send In-Call Chat Message
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

    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: newMsg
    });

    setChatMessages(prev => [...prev, newMsg]);
    saveLocalLiveChat(liveSession.id, newMsg);
    setChatInput('');

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

  // Centralized Session Completion and Cleanup
  const handleSessionFinish = async () => {
    cleanupMediaAndConnections();
    const secs = elapsedSeconds;
    setFinalDurationSeconds(secs);

    if (hasBothJoinedState) {
      if (onMarkSessionCompleted) {
        await onMarkSessionCompleted(booking.id);
      }
    } else {
      if (onMarkSessionNoShow) {
        await onMarkSessionNoShow(booking.id);
      }
    }

    try {
      await updateLiveSessionStatus(liveSession.id, 'ended', { endTime: new Date().toISOString() });
    } catch (err) {
      console.warn('[LiveSessionRoomView] Failed to update session status to ended:', err);
    }

    setShowCompleteSummary(true);
  };

  // Leave Actions:
  // Action A: Just leave room (other participant can stay or wait)
  const handleLeaveOnly = async () => {
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            senderId: currentUser.id,
            signalType: 'user-left',
            userName: currentUser.name
          }
        });
      } catch (e) {
        console.warn('Error broadcasting user-left:', e);
      }
    }

    await handleSessionFinish();
  };

  // Action B: End Session for Everyone (Closes session for both)
  const handleEndForEveryone = async () => {
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            senderId: currentUser.id,
            signalType: 'session-ended-for-all',
            userName: currentUser.name
          }
        });
      } catch (e) {
        console.warn('Error broadcasting session-ended-for-all:', e);
      }
    }

    await handleSessionFinish();
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

  // Show Session Complete Summary screen when session concludes
  if (showCompleteSummary) {
    return (
      <SessionCompleteSummary
        booking={booking}
        liveSession={liveSession}
        currentUser={currentUser}
        otherUser={otherUser}
        allUsers={allUsers}
        allReviews={allReviews}
        durationSeconds={finalDurationSeconds}
        onLeaveReview={onLeaveReview}
        onBookAnotherSession={onBookAnotherSession}
        onClose={onLeave}
      />
    );
  }

  // LOBBY VIEW (Device Preparation Screen)
  if (inLobby) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-xs text-text-sub">
        <button
          onClick={onLeave}
          className="inline-flex items-center gap-1.5 text-text-dim hover:text-white transition font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-surface-raised rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 backdrop-blur-xl">
          
          {/* Left: Camera Preview & Quick Toggles */}
          <div className="md:col-span-7 bg-surface-base p-6 flex flex-col justify-between items-center min-h-[420px] relative border-b md:border-b-0 md:border-r border-white/10">
            {/* Violet ambient backlight in studio */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full flex items-center justify-between text-text-dim text-xs z-10">
              <span className="font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Green Room Preview
              </span>
              <span className="px-2.5 py-1 bg-surface-raised text-lavender-300 rounded-full font-bold text-[10px] border border-white/10">
                {isTeacher ? 'Instructor' : 'Learner'} Setup
              </span>
            </div>

            {/* Video Preview Frame */}
            <div className="w-full aspect-video bg-surface-raised rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl my-auto flex items-center justify-center">
              <video
                ref={lobbyVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraOn || cameraStatus === 'denied' || cameraStatus === 'error' ? 'hidden' : ''}`}
              />

              {(!isCameraOn || cameraStatus === 'denied' || cameraStatus === 'error' || cameraStatus === 'off') && (
                <div className="flex flex-col items-center gap-2.5 text-text-dim p-6 text-center">
                  <div className="w-14 h-14 bg-surface-base rounded-2xl flex items-center justify-center text-text-dim border border-white/10 shadow-inner">
                    <VideoOff className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">
                      {cameraStatus === 'denied' ? 'Camera Access Blocked' : 'Camera is Turned Off'}
                    </p>
                    <p className="text-[11px] text-text-dim mt-1 max-w-xs">
                      {cameraStatus === 'denied'
                        ? 'Grant browser camera permissions to enable video'
                        : 'Click the camera button below to test your video preview'}
                    </p>
                  </div>
                </div>
              )}

              {/* User watermark badge */}
              <div className="absolute bottom-3 left-3 bg-surface-base/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-white font-semibold text-[11px] flex items-center gap-2 border border-white/10 shadow-md">
                <div className={`w-2 h-2 rounded-full ${isCameraOn && cameraStatus === 'ready' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{currentUser.name} (You)</span>
              </div>
            </div>

            {/* Preview Control Toggle Bar */}
            <div className="flex items-center gap-3 z-10 pt-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-xs border ${
                  isMicOn 
                    ? 'bg-surface-raised text-emerald-400 hover:bg-white/10 border-white/10' 
                    : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{isMicOn ? 'Mic Active' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-xs border ${
                  isCameraOn 
                    ? 'bg-surface-raised text-emerald-400 hover:bg-white/10 border-white/10' 
                    : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500'
                }`}
                title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span>{isCameraOn ? 'Camera Active' : 'Camera Off'}</span>
              </button>
            </div>
          </div>

          {/* Right: Device Readiness Health Check & Join Session CTA */}
          <div className="md:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-surface-raised/40">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-lavender-300 uppercase tracking-widest bg-violet-500/15 px-3 py-1 rounded-full border border-violet-500/30 inline-flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  Live Room Check
                </span>
                <h2 className="text-xl font-black text-white mt-2.5 font-display">
                  Hardware Readiness
                </h2>
                <p className="text-text-dim text-xs mt-1">
                  Verify camera & microphone before connecting to <strong>{booking.skillName}</strong>.
                </p>
              </div>

              {/* Hardware Status Breakdown */}
              <div className="space-y-2.5">
                
                {/* Camera Status Row */}
                <div className="bg-surface-base border border-white/5 rounded-2xl p-3 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${cameraStatus === 'ready' && isCameraOn ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-surface-raised border-white/10 text-text-dim'}`}>
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">Camera</p>
                      <p className="text-[10px] text-text-dim truncate max-w-[150px]">{cameraName}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    cameraStatus === 'ready' && isCameraOn
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : cameraStatus === 'denied'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-surface-raised text-text-dim border border-white/10'
                  }`}>
                    {cameraStatus === 'ready' && isCameraOn
                      ? 'Camera Ready'
                      : cameraStatus === 'denied'
                      ? 'Blocked'
                      : !isCameraOn
                      ? 'Camera Off'
                      : 'Checking...'}
                  </span>
                </div>

                {/* Microphone Status Row with Live Audio Meter */}
                <div className="bg-surface-base border border-white/5 rounded-2xl p-3 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${micStatus === 'ready' && isMicOn ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-surface-raised border-white/10 text-text-dim'}`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">Microphone</p>
                        <p className="text-[10px] text-text-dim truncate max-w-[150px]">{micName}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      micStatus === 'ready' && isMicOn
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : micStatus === 'denied'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-surface-raised text-text-dim border border-white/10'
                    }`}>
                      {micStatus === 'ready' && isMicOn
                        ? 'Mic Ready'
                        : micStatus === 'denied'
                        ? 'Blocked'
                        : !isMicOn
                        ? 'Muted'
                        : 'Checking...'}
                    </span>
                  </div>

                  {micStatus === 'ready' && isMicOn && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-[10px] text-text-dim font-medium">Input Meter:</span>
                      <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden flex items-center">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                          style={{ width: `${Math.max(8, audioLevel)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold">{audioLevel}%</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Troubleshooting Alert */}
              {deviceError && (
                <div className="bg-rose-500/15 border border-rose-500/30 p-3.5 rounded-2xl space-y-2 text-rose-300 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Hardware Permission Required</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-300">
                    Browser blocked device access. Click below to retry.
                  </p>
                  <button
                    type="button"
                    onClick={initLobbyMedia}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Device Check</span>
                  </button>
                </div>
              )}

              {/* Session Context Card */}
              <div className="bg-surface-base border border-white/5 rounded-2xl p-3.5 space-y-2 text-[11px] text-text-sub shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-text-dim">Classroom:</span>
                  <span className="font-bold text-white">{booking.skillName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-dim">Instructor:</span>
                  <span className="font-bold text-lavender-200">{booking.teacherName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-dim">Learner:</span>
                  <span className="font-bold text-lavender-200">{booking.learnerName}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={enterClassroom}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 cursor-pointer text-sm transform active:scale-95 border-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Live Classroom</span>
              </button>

              <button
                type="button"
                onClick={onLeave}
                className="w-full py-2.5 bg-surface-interactive hover:bg-white/15 text-text-sub font-semibold border border-white/10 rounded-2xl transition cursor-pointer text-xs"
              >
                Cancel & Exit
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // CLASSROOM VIEW (Immersive Live Session Studio)
  return (
    <div className="max-w-6xl mx-auto space-y-4 text-xs text-text-sub">
      
      {/* Top Session Bar (Studio Header) */}
      <div className="bg-surface-raised text-white rounded-3xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10 backdrop-blur-xl">
        
        {/* Left: Skill & Participants */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/20 text-lavender-300 rounded-2xl flex items-center justify-center font-bold text-sm border border-violet-500/30 shadow-inner">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">{booking.skillName}</h2>
              <span className="px-2.5 py-0.5 bg-violet-900/40 text-lavender-300 rounded-full text-[10px] font-bold border border-violet-500/30">
                1-on-1 Studio
              </span>
            </div>
            <p className="text-text-dim text-[11px] mt-0.5 flex items-center gap-2">
              <span>Instructor: <strong className="text-white">{booking.teacherName}</strong></span>
              <span>•</span>
              <span>Learner: <strong className="text-white">{booking.learnerName}</strong></span>
            </p>
          </div>
        </div>

        {/* Center: Persistent Connection Status & Session Timer */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-surface-base rounded-full border border-white/10 shadow-md">
            {connectionStatus === 'connected' && (
              <>
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                <span className="font-bold text-emerald-400 text-xs">Live Connected</span>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                <span className="font-medium text-amber-400 text-xs">Connecting…</span>
              </>
            )}
            {connectionStatus === 'reconnecting' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                <span className="font-bold text-amber-300 text-xs">Reconnecting…</span>
              </>
            )}
            {connectionStatus === 'waiting' && (
              <>
                <span className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-ping shrink-0" />
                <span className="font-medium text-lavender-300 text-xs">Waiting for peer…</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-medium text-rose-300 text-xs">{otherUser.name} disconnected</span>
              </>
            )}
            {connectionStatus === 'failed' && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-medium text-rose-400 text-xs">Connection failed</span>
              </>
            )}
          </div>

          {/* Session Timer */}
          <div className="flex items-center gap-1.5 bg-surface-base px-3.5 py-1.5 rounded-full border border-white/10 text-white font-mono text-xs shadow-md">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-bold">Session: {formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Right: Chat Toggle & Leave Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className={`p-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5 font-bold border ${
              showChat 
                ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20' 
                : 'bg-surface-interactive text-text-sub hover:text-white border-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Notes & Chat</span>
            {chatMessages.length > 0 && (
              <span className="px-1.5 py-0.2 bg-violet-400 text-slate-950 rounded-full text-[10px] font-black">
                {chatMessages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/25 active:scale-95 transform border-0"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Studio Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px] relative">
        
        {/* Left/Main Area: Main Video Stage */}
        <div className={`${showChat ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all space-y-3`}>
          <div 
            ref={videoStageRef} 
            className={`overflow-hidden flex items-center justify-center transition-all duration-300 motion-reduce:transition-none ${
              isFallbackFullscreen
                ? 'fixed inset-0 z-[200] w-screen h-screen bg-black rounded-none border-0'
                : isFullscreen
                ? 'w-full h-full aspect-auto bg-black rounded-none border-0'
                : 'aspect-video bg-surface-base rounded-3xl relative shadow-2xl border border-white/10'
            }`}
          >
            
            {/* Subtle violet stage backlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                connectionStatus !== 'connected' || remoteUserLeft || !remoteMediaState.isCameraOn ? 'hidden' : ''
              }`}
            />

            {/* Remote Participant Camera Off Placeholder */}
            {connectionStatus === 'connected' && !remoteUserLeft && !remoteMediaState.isCameraOn && (
              <div className="flex flex-col items-center justify-center text-text-dim space-y-2 z-10">
                <div className="w-20 h-20 bg-surface-raised border border-white/10 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl font-display">
                  {otherUser.name.charAt(0)}
                </div>
                <p className="font-bold text-white text-sm">{otherUser.name}</p>
                <div className="px-3 py-1 bg-surface-raised rounded-full border border-white/10 text-[10px] text-text-dim flex items-center gap-1.5">
                  <VideoOff className="w-3 h-3 text-rose-400" />
                  <span>Participant camera is off</span>
                </div>
              </div>
            )}

            {/* Participant Left State Card */}
            {(remoteUserLeft || connectionStatus === 'disconnected') && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto z-20">
                <div className="w-20 h-20 bg-surface-raised border border-white/10 rounded-3xl flex items-center justify-center text-text-dim text-3xl font-bold shadow-2xl relative font-display">
                  {otherUser.name.charAt(0)}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-rose-600 rounded-full border-2 border-surface-base flex items-center justify-center text-xs text-white">
                    ×
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-white text-lg font-display">
                    {otherUser.name} has left the session
                  </h3>
                  <p className="text-text-dim text-xs mt-1.5 leading-relaxed">
                    They disconnected or exited the classroom. You can wait briefly for them to rejoin, or conclude the session.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleEndForEveryone}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-rose-600/20 flex items-center gap-2 transform active:scale-95 border-0"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Session for Everyone</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLeaveOnly}
                    className="px-4 py-2.5 bg-surface-interactive hover:bg-white/15 text-text-sub font-semibold border border-white/10 rounded-2xl text-xs transition cursor-pointer"
                  >
                    <span>Leave Call</span>
                  </button>
                </div>
              </div>
            )}

            {/* Connecting / Waiting Placeholder */}
            {connectionStatus !== 'connected' && !remoteUserLeft && connectionStatus !== 'disconnected' && (
              <div className="flex flex-col items-center justify-center space-y-3 text-text-dim p-6 text-center max-w-md z-10">
                <div className="w-16 h-16 bg-surface-raised border border-white/10 rounded-3xl flex items-center justify-center text-lavender-300 text-2xl shadow-2xl">
                  {connectionStatus === 'failed' ? (
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                  ) : connectionStatus === 'reconnecting' ? (
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  ) : (
                    <User className="w-8 h-8 text-violet-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-white text-base font-display">
                    {connectionStatus === 'waiting'
                      ? `Waiting for ${otherUser.name}...`
                      : connectionStatus === 'reconnecting'
                      ? 'Reconnecting Live Stream…'
                      : connectionStatus === 'failed'
                      ? 'Connection Interrupted'
                      : 'Connecting WebRTC Peer Stream...'}
                  </h3>
                  <p className="text-text-dim text-xs mt-1.5 leading-relaxed">
                    {connectionStatus === 'waiting'
                      ? 'Both participants must join this room to begin the live two-way video exchange.'
                      : connectionStatus === 'reconnecting'
                      ? 'Network connection temporarily interrupted. Attempting to restore video feed...'
                      : connectionStatus === 'failed'
                      ? 'The direct peer-to-peer connection could not be established. Click Retry.'
                      : 'Negotiating STUN/TURN ICE candidates and media streams...'}
                  </p>
                </div>

                {connectionStatus === 'waiting' && (
                  <div className="px-3.5 py-2 bg-surface-raised/90 border border-white/10 rounded-2xl text-lavender-300 text-[11px] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    <span>Listening for peer presence on private barter channel</span>
                  </div>
                )}

                {connectionStatus === 'failed' && (
                  <button
                    type="button"
                    onClick={() => {
                      enterClassroom();
                    }}
                    className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-violet-500/20 border-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Connection</span>
                  </button>
                )}
              </div>
            )}

            {/* Remote User Label & Media Status Overlay */}
            <div className="absolute top-4 left-4 bg-surface-base/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white font-semibold text-xs flex items-center gap-2 border border-white/10 shadow-lg z-20">
              <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{otherUser.name} ({isTeacher ? 'Learner' : 'Instructor'})</span>
              
              {connectionStatus === 'connected' && !remoteUserLeft && (
                <span className={`p-1 rounded-lg ${remoteMediaState.isMicOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {remoteMediaState.isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                </span>
              )}
            </div>

            {/* Fullscreen Toggle / Exit Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className={`absolute top-4 right-4 backdrop-blur-md p-2.5 rounded-2xl text-white flex items-center gap-1.5 border shadow-xl z-30 transition cursor-pointer motion-reduce:transition-none ${
                isFallbackFullscreen
                  ? 'bg-surface-raised/95 hover:bg-rose-600/90 text-white border-white/20 ring-1 ring-white/10'
                  : 'bg-surface-base/90 hover:bg-surface-interactive text-white hover:text-lavender-200 border-white/10'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4 text-lavender-300" />
                  {isFallbackFullscreen && (
                    <span className="text-xs font-bold px-1 text-white">Exit</span>
                  )}
                </>
              ) : (
                <Maximize className="w-4 h-4 text-lavender-300" />
              )}
            </button>

            {/* Local Video Stream Preview (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-40 sm:w-52 aspect-video bg-surface-base rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-20 group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
              />

              {!isCameraOn && (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-dim bg-surface-base">
                  <VideoOff className="w-6 h-6 text-text-dim" />
                  <span className="text-[10px] font-semibold mt-1">Camera Off</span>
                </div>
              )}

              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between bg-surface-raised/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] text-white font-medium border border-white/10">
                <span className="truncate">You ({currentUser.name})</span>
                <span className={`p-0.5 rounded ${isMicOn ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                </span>
              </div>
            </div>

            {/* Floating Quick Control Bar (Visible in Fullscreen Mode) */}
            {isFullscreen && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-base/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-2.5 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Microphone Toggle */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-xl font-bold transition flex items-center justify-center cursor-pointer shadow-md border ${
                    isMicOn 
                      ? 'bg-surface-raised text-white hover:bg-white/15 border-white/10' 
                      : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500'
                  }`}
                  title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Camera Toggle */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-3 rounded-xl font-bold transition flex items-center justify-center cursor-pointer shadow-md border ${
                    isCameraOn 
                      ? 'bg-surface-raised text-white hover:bg-white/15 border-white/10' 
                      : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500'
                  }`}
                  title={isCameraOn ? 'Stop Camera' : 'Start Camera'}
                >
                  {isCameraOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4" />}
                </button>

                {/* Screen Share Toggle */}
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-xl font-bold transition flex items-center justify-center cursor-pointer shadow-md border ${
                    isScreenSharing 
                      ? 'bg-violet-600 text-white hover:bg-violet-500 border-violet-500 shadow-md shadow-violet-500/20' 
                      : 'bg-surface-raised text-text-sub hover:text-white border-white/10'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                >
                  {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>

                <div className="w-px h-6 bg-white/15 mx-1" />

                {/* Fullscreen Exit */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-3 rounded-xl bg-surface-raised hover:bg-white/15 text-lavender-300 font-bold border border-white/10 transition flex items-center justify-center cursor-pointer shadow-md"
                  title="Exit Fullscreen"
                >
                  <Minimize className="w-4 h-4" />
                </button>

                {/* Leave Session */}
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20 border-0"
                  title="Leave Call"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Leave</span>
                </button>
              </div>
            )}

            {/* Both Participants Muted Alert */}
            <AnimatePresence>
              {showBothMutedPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-raised/95 border border-amber-500/40 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 text-white text-xs z-30"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="font-medium text-amber-200">Looks like you're both muted!</span>
                  <button
                    type="button"
                    onClick={toggleMic}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-full text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs border-0"
                  >
                    <Mic className="w-3 h-3" />
                    <span>Unmute</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBothMutedPrompt(false)}
                    className="text-text-dim hover:text-white p-1 rounded-full cursor-pointer ml-1 bg-transparent border-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Bottom Controls Toolbar */}
          <div className="bg-surface-raised rounded-3xl p-3 border border-white/10 flex flex-wrap items-center justify-center gap-3 shadow-2xl backdrop-blur-xl">
            
            {/* Microphone Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2.5 cursor-pointer shadow-md border ${
                isMicOn 
                  ? 'bg-surface-base text-white hover:bg-white/10 border-white/10' 
                  : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">{isMicOn ? 'Mic On' : 'Muted'}</span>
                <span className="text-[9px] font-normal text-text-dim mt-0.5">{isMicOn ? 'Click to Mute' : 'Click to Unmute'}</span>
              </div>
            </button>

            {/* Camera Toggle */}
            <button
              type="button"
              onClick={toggleCamera}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2.5 cursor-pointer shadow-md border ${
                isCameraOn 
                  ? 'bg-surface-base text-white hover:bg-white/10 border-white/10' 
                  : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500'
              }`}
              title={isCameraOn ? 'Stop Camera' : 'Start Camera'}
            >
              {isCameraOn ? <Video className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5" />}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">{isCameraOn ? 'Camera On' : 'Camera Off'}</span>
                <span className="text-[9px] font-normal text-text-dim mt-0.5">{isCameraOn ? 'Click to Stop' : 'Click to Start'}</span>
              </div>
            </button>

            {/* Screen Share Toggle */}
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2.5 cursor-pointer shadow-md border ${
                isScreenSharing 
                  ? 'bg-violet-600 text-white hover:bg-violet-500 border-violet-500 shadow-md shadow-violet-500/20' 
                  : 'bg-surface-base text-text-sub hover:text-white border-white/10'
              }`}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
                <span className="text-[9px] font-normal text-text-dim mt-0.5">{isScreenSharing ? 'Click to Stop' : 'Code / Workspace'}</span>
              </div>
            </button>

            {/* Notes & Chat Toggle */}
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className={`p-3.5 rounded-2xl font-bold transition flex items-center gap-2.5 cursor-pointer shadow-md border ${
                showChat 
                  ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20' 
                  : 'bg-surface-base text-text-sub hover:text-white border-white/10'
              }`}
              title="Toggle Classroom Chat"
            >
              <MessageSquare className="w-5 h-5" />
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">Classroom Notes</span>
                <span className="text-[9px] font-normal text-text-dim mt-0.5">{chatMessages.length} messages</span>
              </div>
            </button>

            {/* Leave Room Button */}
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="p-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition flex items-center gap-2.5 cursor-pointer shadow-lg shadow-rose-600/20 transform active:scale-95 border-0"
              title="Leave Classroom Session"
            >
              <PhoneOff className="w-5 h-5" />
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">Leave Studio</span>
                <span className="text-[9px] font-normal text-rose-200 mt-0.5">Exit or Conclude</span>
              </div>
            </button>

          </div>
        </div>

        {/* Right Desktop Chat Side Panel */}
        {showChat && (
          <div className="hidden lg:flex lg:col-span-4 bg-surface-raised rounded-3xl border border-white/10 shadow-2xl flex-col h-[520px] overflow-hidden backdrop-blur-xl">
            <div className="p-3.5 bg-surface-base border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-white text-xs">Classroom Notes & Links</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="text-text-dim hover:text-white font-bold text-xs p-1 cursor-pointer bg-transparent border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-surface-raised/40">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-text-dim text-xs space-y-1">
                  <div className="w-10 h-10 bg-surface-base rounded-2xl flex items-center justify-center mx-auto mb-2 text-text-dim border border-white/10">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-white">No notes yet</p>
                  <p className="text-[11px] text-text-dim">Send code snippets, documentation links, or notes to your partner.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isSelf = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-text-dim mb-0.5">
                        <span className="font-bold text-white">{isSelf ? 'You' : msg.senderName}</span>
                        <span>• {msg.timestamp}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[88%] text-xs leading-relaxed break-words ${
                          isSelf
                            ? 'bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-500/20'
                            : 'bg-surface-base border border-white/10 text-white rounded-tl-none shadow-md'
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
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/10 bg-surface-base flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type notes or paste code links..."
                className="flex-1 px-3.5 py-2 bg-surface-raised border border-white/10 rounded-xl text-xs text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-md border-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Mobile Chat Drawer */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-surface-base/80 backdrop-blur-md z-50 flex flex-col justify-end"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-surface-raised border-t border-white/10 rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-surface-base border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  <h3 className="font-bold text-white text-sm">Classroom Notes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChat(false)}
                  className="p-1.5 rounded-full bg-surface-raised text-text-dim hover:text-white font-bold text-xs border-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-surface-raised/50 min-h-[250px]">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-text-dim text-xs space-y-1">
                    <p className="font-bold text-white">No messages yet</p>
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
                        <div className="flex items-center gap-1.5 text-[10px] text-text-dim mb-0.5">
                          <span className="font-bold text-white">{isSelf ? 'You' : msg.senderName}</span>
                          <span>• {msg.timestamp}</span>
                        </div>
                        <div
                          className={`p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words ${
                            isSelf
                              ? 'bg-violet-600 text-white rounded-tr-none'
                              : 'bg-surface-base border border-white/10 text-white rounded-tl-none shadow-md'
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
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/10 bg-surface-base flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type notes or paste code..."
                  className="flex-1 px-3.5 py-2.5 bg-surface-raised border border-white/10 rounded-xl text-xs text-white placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer border-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Action Options Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-raised rounded-3xl max-w-md w-full border border-white/10 shadow-2xl p-6 text-white space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <PhoneOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base font-display">Leave Classroom</h3>
                    <p className="text-text-dim text-xs">Choose how you want to exit</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="text-text-dim hover:text-white p-1 rounded-xl transition cursor-pointer bg-transparent border-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Option 1: Just Leave Call */}
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    handleLeaveOnly();
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-surface-base hover:bg-white/5 border border-white/5 hover:border-white/10 transition cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-lavender-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs group-hover:text-lavender-300 transition">
                      Just Leave Call
                    </div>
                    <p className="text-text-dim text-[11px] mt-0.5 leading-snug">
                      Leave the room for yourself. {otherUser.name} can stay or wait briefly for you to rejoin.
                    </p>
                  </div>
                </button>

                {/* Option 2: End Session for Everyone */}
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    handleEndForEveryone();
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                    <PhoneOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-rose-300 text-xs group-hover:text-rose-200 transition">
                      End Session for Everyone
                    </div>
                    <p className="text-rose-200/70 text-[11px] mt-0.5 leading-snug">
                      Conclude and close the classroom for both you and {otherUser.name} immediately.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-surface-interactive hover:bg-white/15 text-text-sub font-semibold rounded-xl text-xs transition cursor-pointer border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Peer Ended Session Modal */}
      <AnimatePresence>
        {sessionEndedByPeer && (
          <div className="fixed inset-0 bg-surface-base/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-raised rounded-3xl max-w-sm w-full border border-white/10 shadow-2xl p-6 text-white text-center space-y-4"
            >
              <div className="w-14 h-14 bg-violet-500/20 text-lavender-300 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-base text-white font-display">
                  Session Ended by {peerWhoEnded || otherUser.name}
                </h3>
                <p className="text-text-dim text-xs mt-1.5 leading-relaxed">
                  {peerWhoEnded || otherUser.name} concluded the classroom session for both participants.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await handleSessionFinish();
                }}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-violet-500/20 border-0"
              >
                View Session Summary
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
