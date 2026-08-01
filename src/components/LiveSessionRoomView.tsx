import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, 
  MessageSquare, Send, User, Shield, Clock, WifiOff, RefreshCw, 
  Play, ArrowLeft, Sparkles, AlertTriangle, X, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Booking, UserProfile, LiveSession, Review, Skill, LearningOption } from '../types';
import { updateLiveSessionStatus } from '../lib/liveSessions';
import { SessionCompleteSummary } from './SessionCompleteSummary';

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
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
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
                type="button"
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
                type="button"
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
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Green Room • Pre-Join Preview
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-2.5">
                  Pre-Call Device Check
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Adjust camera & microphone settings before connecting to <strong>{booking.skillName}</strong>.
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
                    type="button"
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
                type="button"
                onClick={enterClassroom}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer text-sm transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Confirm & Enter Call</span>
              </button>

              <button
                type="button"
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
      
      {/* Top Session Bar (Google Meet Style Header) */}
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

        {/* Center: Persistent Connection Status & Session Timer (Requirements 1 & 2) */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/90 rounded-full border border-slate-800 shadow-xs">
            {connectionStatus === 'connected' && (
              <>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                <span className="font-bold text-emerald-400 text-xs">Connected</span>
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
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping shrink-0" />
                <span className="font-medium text-blue-300 text-xs">Waiting for peer…</span>
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

          {/* Session Timer (Requirement 2) */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3.5 py-1.5 rounded-full border border-slate-800 text-slate-200 font-mono text-xs shadow-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold">Session: {formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Right: Chat Toggle & Red Leave Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
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

          {/* Red Leave Button with Options (Requirement 4) */}
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transform"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
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
                connectionStatus !== 'connected' || remoteUserLeft || !remoteMediaState.isCameraOn ? 'hidden' : ''
              }`}
            />

            {/* Remote Participant Camera Off Placeholder */}
            {connectionStatus === 'connected' && !remoteUserLeft && !remoteMediaState.isCameraOn && (
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

            {/* Requirement 5: Participant Left State Card */}
            {(remoteUserLeft || connectionStatus === 'disconnected') && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto z-20">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-400 text-3xl font-bold shadow-2xl relative">
                  {otherUser.name.charAt(0)}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-rose-600 rounded-full border-2 border-slate-950 flex items-center justify-center text-xs text-white">
                    ×
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-lg">
                    {otherUser.name} has left the session
                  </h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    They disconnected or exited the classroom. You can wait briefly for them to rejoin, or end the session on your side.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleEndForEveryone}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-2 transform active:scale-95"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Session for Everyone</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLeaveOnly}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 rounded-xl text-xs transition cursor-pointer"
                  >
                    <span>Leave Call</span>
                  </button>
                </div>
              </div>
            )}

            {/* Connecting / Waiting Placeholder overlay when not connected and remote user hasn't explicitly left */}
            {connectionStatus !== 'connected' && !remoteUserLeft && connectionStatus !== 'disconnected' && (
              <div className="flex flex-col items-center justify-center space-y-3 text-slate-400 p-6 text-center max-w-md z-10">
                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-300 text-2xl shadow-inner">
                  {connectionStatus === 'failed' ? (
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                  ) : connectionStatus === 'reconnecting' ? (
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  ) : (
                    <User className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {connectionStatus === 'waiting'
                      ? `Waiting for ${otherUser.name}...`
                      : connectionStatus === 'reconnecting'
                      ? 'Reconnecting WebRTC Stream…'
                      : connectionStatus === 'failed'
                      ? 'Connection Could Not Be Established'
                      : 'Connecting WebRTC Stream...'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    {connectionStatus === 'waiting'
                      ? 'Both participants must join this room to begin the live two-way video call.'
                      : connectionStatus === 'reconnecting'
                      ? 'Network connection temporarily interrupted. Attempting to restore video feed...'
                      : connectionStatus === 'failed'
                      ? 'The direct peer-to-peer connection could not be established. Click Retry.'
                      : 'Negotiating STUN/TURN ICE candidates and media streams...'}
                  </p>
                </div>

                {connectionStatus === 'waiting' && (
                  <div className="px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-amber-400 text-[11px] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Listening for peer presence on private channel</span>
                  </div>
                )}

                {connectionStatus === 'failed' && (
                  <button
                    type="button"
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
            <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 border border-slate-800 shadow-md z-20">
              <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>{otherUser.name} ({isTeacher ? 'Learner' : 'Instructor'})</span>
              
              {/* Remote Mic Indicator */}
              {connectionStatus === 'connected' && !remoteUserLeft && (
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

            {/* Requirement 3: Both Participants Muted Prompt */}
            <AnimatePresence>
              {showBothMutedPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-amber-500/40 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 text-white text-xs z-30"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="font-medium text-amber-200">Looks like you're both muted!</span>
                  <button
                    type="button"
                    onClick={toggleMic}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-full text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Mic className="w-3 h-3" />
                    <span>Unmute Mic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBothMutedPrompt(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Bottom Classroom Controls Toolbar (Requirement 4) */}
          <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 flex flex-wrap items-center justify-center gap-3 shadow-lg">
            
            {/* Microphone Toggle */}
            <button
              type="button"
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
              type="button"
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
              type="button"
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
              type="button"
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

            {/* Distinct Red Leave Button (Requirement 4) */}
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-md transform active:scale-95"
              title="Leave Classroom Session"
            >
              <PhoneOff className="w-5 h-5" />
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-none">Leave Classroom</span>
                <span className="text-[9px] font-normal text-rose-200 mt-0.5">Leave or End Session</span>
              </div>
            </button>

          </div>
        </div>

        {/* Right Desktop Chat Side Panel */}
        {showChat && (
          <div className="hidden lg:flex lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-lg flex-col h-[520px] overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs">Classroom Notes & Chat</h3>
              </div>
              <button
                type="button"
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

      {/* Mobile Chat Slide-over Drawer */}
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
                  type="button"
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

      {/* Requirement 4: Leave Action Options Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl p-6 text-white space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <PhoneOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Leave Classroom</h3>
                    <p className="text-slate-400 text-xs">Choose how you want to exit</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
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
                  className="w-full text-left p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs group-hover:text-indigo-300 transition">
                      Just Leave Call
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
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
                  className="w-full text-left p-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 transition cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-800 shadow-2xl p-6 text-white text-center space-y-4"
            >
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Session Ended by {peerWhoEnded || otherUser.name}
                </h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  {peerWhoEnded || otherUser.name} concluded the classroom session for both participants.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await handleSessionFinish();
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
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
