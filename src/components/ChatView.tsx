import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Phone, Paperclip, Mic, MicOff, 
  X, PhoneOff, Circle, Check, CheckCheck, Smile, HelpCircle, FileText, Image, Globe, ArrowLeft
} from 'lucide-react';
import { UserProfile, Message, Booking } from '../types';
import { supabase, mapSupabaseToMessage, mapMessageToSupabase } from '../lib/supabase';
import { EmptyState } from './ui';

interface ChatViewProps {
  currentUser: UserProfile;
  contacts: UserProfile[];
  initialActiveContactId?: string | null;
  bookings: Booking[];
}

export default function ChatView({ currentUser, contacts, initialActiveContactId, bookings }: ChatViewProps) {
  const DEFAULT_USER_IDS = [
    'user-alex', 'user-sofia', 'user-marcus', 'user-elena', 'user-david',
    'user-maya', 'user-liam', 'user-yuki', 'user-zara', 'user-tyler'
  ];
  const isCreatedAccount = !DEFAULT_USER_IDS.includes(currentUser.id);

  const hasConfirmedBookingWith = (otherUserId: string) =>
    bookings.some(b =>
      (b.status === 'confirmed' || b.status === 'rescheduled') &&
      ((b.teacherId === currentUser.id && b.learnerId === otherUserId) ||
       (b.learnerId === currentUser.id && b.teacherId === otherUserId))
    );

  const [activeContactId, setActiveContactId] = useState<string | null>(initialActiveContactId || (contacts[0]?.id || null));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Real WebRTC Voice Call States
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<{
    from: string;
    offer: any;
    callerName: string;
    callerAvatar: string;
  } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Stream and WebRTC Connection references
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const socketRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // File Sharing simulation states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Supabase Realtime subscription for signaling & presence (replacing Socket.IO)
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase.channel('global-signaling');
    socketRef.current = channel;

    channel
      .on('broadcast', { event: 'signaling' }, ({ payload }) => {
        if (payload.to !== currentUser.id) return;

        const { type, ...data } = payload;
        if (type === 'incoming-call') {
          const { from, offer, callerName, callerAvatar } = data;
          console.log('Incoming call offer received from:', from);
          setIncomingCallData({ from, offer, callerName, callerAvatar });
          setCallState('ringing');
        } else if (type === 'call-answered') {
          const { answer } = data;
          console.log('Call answered by recipient');
          if (peerConnectionRef.current) {
            try {
              peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
              setCallState('connected');
            } catch (err: any) {
              console.error('Error setting remote description:', err);
              setMediaError('Could not establish reliable WebRTC audio link.');
            }
          }
        } else if (type === 'call-rejected') {
          console.log('Call was rejected');
          cleanupCall();
          setMediaError('Call was rejected by the user.');
          setCallState('ended');
          setTimeout(() => setCallState('idle'), 3000);
        } else if (type === 'ice-candidate') {
          const { candidate } = data;
          if (peerConnectionRef.current) {
            try {
              peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
        } else if (type === 'call-ended') {
          console.log('Call was ended by remote partner');
          cleanupCall();
          setCallState('ended');
          setTimeout(() => setCallState('idle'), 3000);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const onlineMap: Record<string, boolean> = {};
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.userId) {
              onlineMap[p.userId] = true;
            }
          });
        });
        setOnlineUsers(onlineMap);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: currentUser.id, onlineAt: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]);

  // Supabase Realtime subscription for messages
  useEffect(() => {
    if (!currentUser?.id || !activeContactId) return;

    const channel = supabase
      .channel(`realtime-messages-${currentUser.id}-${activeContactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = mapSupabaseToMessage(payload.new);
          // Only append if it belongs to the current open chat
          if (
            (newMsg.senderId === currentUser.id && newMsg.receiverId === activeContactId) ||
            (newMsg.senderId === activeContactId && newMsg.receiverId === currentUser.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, activeContactId]);

  // Synchronize mute state with physical localStream tracks
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Clean up media resources on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [localStream]);

  const activeContact = contacts.find(c => c.id === activeContactId);

  // Load message logs from API
  useEffect(() => {
    if (initialActiveContactId) {
      setActiveContactId(initialActiveContactId);
    }
  }, [initialActiveContactId]);

  useEffect(() => {
    if (!activeContactId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeContactId}),and(sender_id.eq.${activeContactId},receiver_id.eq.${currentUser.id})`)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        if (data) {
          setMessages(data.map(mapSupabaseToMessage));
        }
      } catch (err) {
        console.error('Error fetching chat log from Supabase:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeContactId, currentUser.id]);

  // Scroll to bottom when messages load/change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call timer effect
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      callIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [callState]);

  const handleSendMessage = async (text: string, fileInfo?: { name: string; url: string }) => {
    if (!text.trim() && !fileInfo) return;
    if (!activeContactId) return;

    const newMessageTemp: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: currentUser.id,
      receiverId: activeContactId,
      text: text,
      fileName: fileInfo?.name,
      fileUrl: fileInfo?.url,
      timestamp: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(mapMessageToSupabase(newMessageTemp))
        .select()
        .single();

      if (error) throw error;

      // Ensure we insert a notification for the receiver as well!
      await supabase.from('notifications').insert({
        user_id: activeContactId,
        title: 'New Message',
        message: `You received a message: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        type: 'message',
        read: false,
        timestamp: new Date().toISOString()
      });

      const savedMsg = data ? mapSupabaseToMessage(data) : newMessageTemp;

      // Update state locally
      setMessages(prev => {
        if (prev.some(m => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
      setInputText('');

      // Auto reply simulation after 2 seconds for rich interactivity!
      simulateAutoReply();
    } catch (err) {
      console.error('Error sending message to Supabase:', err);
    }
  };

  const simulateAutoReply = () => {
    if (isCreatedAccount) {
      console.log('Auto-chat simulation is disabled for custom created accounts.');
      return;
    }

    if (!activeContact) return;
    setIsTyping(true);

    setTimeout(async () => {
      setIsTyping(false);
      const responses = [
        `Thanks for reaching out! I'd love to swap skills with you. Let me check my schedule for a session!`,
        `That sounds perfect! Let's arrange a Live 1-on-1 Swap. Does morning or evening work better for you?`,
        `Nice message! Let's definitely coordinate. I can help you with that and we can work on our exchange goals.`,
        `I just checked your profile and I would definitely love to learn what you offer! Let's book a session.`,
        `Great details! I've uploaded the resources we need for our exchange project. Let me know what you think.`
      ];
      const randomText = responses[Math.floor(Math.random() * responses.length)];

      const replyMsgTemp: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        senderId: activeContact.id,
        receiverId: currentUser.id,
        text: randomText,
        timestamp: new Date().toISOString()
      };

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert(mapMessageToSupabase(replyMsgTemp))
          .select()
          .single();

        if (error) throw error;

        // Create a notification for the currentUser as well
        await supabase.from('notifications').insert({
          user_id: currentUser.id,
          title: 'New Message',
          message: `You received a message: "${randomText.substring(0, 30)}${randomText.length > 30 ? '...' : ''}"`,
          type: 'message',
          read: false,
          timestamp: new Date().toISOString()
        });

        const savedReply = data ? mapSupabaseToMessage(data) : replyMsgTemp;

        // Append if activeContactId is still activeContact.id
        setMessages(prev => {
          if (prev.some(m => m.id === savedReply.id)) return prev;
          return [...prev, savedReply];
        });
      } catch (err) {
        console.error('Error receiving auto reply in Supabase:', err);
      }
    }, 2000);
  };

  // Simulating File upload selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Send mock document structure
    handleSendMessage(`Shared a file: ${file.name}`, {
      name: file.name,
      url: '#'
    });
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      requestAnimationFrame(draw);

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Draw responsive neon glowing wave
      ctx.fillStyle = '#0f172a'; // slate-900 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#6366f1'; // indigo-500 line
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const triggerCall = async () => {
    if (!activeContactId) return;
    if (!hasConfirmedBookingWith(activeContactId)) {
      alert('A confirmed swap booking is required before calling this person.');
      return;
    }
    setMediaError(null);
    setCallState('calling');
    
    try {
      // 1. Request microphone permission using getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      // Set up Audio Context for live microphone visualizer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          audioContextRef.current = ctx;
          
          setTimeout(() => {
            if (canvasRef.current) {
              drawVisualizer();
            }
          }, 400);
        } catch (audioErr) {
          console.warn('Web Audio API initialized with warning:', audioErr);
        }
      }

      // 2. Initialize Peer Connection using STUN
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // 3. Add track
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. Send ICE candidate
      pc.onicecandidate = (event) => {
        if (event.candidate && activeContactId) {
          socketRef.current?.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
              type: 'ice-candidate',
              to: activeContactId,
              candidate: event.candidate
            }
          });
        }
      };

      // 5. Connect track to remote audio element
      pc.ontrack = (event) => {
        console.log('Received remote audio stream track');
        const [remoteStream] = event.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio:", e));
        }
      };

      // 6. Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Emit to peer
      socketRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'incoming-call',
          to: activeContactId,
          offer,
          from: currentUser.id,
          callerName: currentUser.name,
          callerAvatar: currentUser.avatar
        }
      });
    } catch (err: any) {
      console.error('Real microphone unavailable or permission denied:', err);
      setMediaError(
        err.name === 'NotAllowedError' 
          ? 'Microphone permission denied. Cannot start voice call.' 
          : `Audio hardware not found or busy (${err.name}).`
      );
      cleanupCall();
      setCallState('ended');
      setTimeout(() => setCallState('idle'), 3000);
    }
  };

  const acceptCall = async () => {
    if (!incomingCallData) return;
    setMediaError(null);
    setCallState('connected');

    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      // Set up Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          audioContextRef.current = ctx;
          
          setTimeout(() => {
            if (canvasRef.current) {
              drawVisualizer();
            }
          }, 400);
        } catch (audioErr) {
          console.warn('Audio Context warning:', audioErr);
        }
      }

      // 2. Initialize Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // 3. Bind tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
              type: 'ice-candidate',
              to: incomingCallData.from,
              candidate: event.candidate
            }
          });
        }
      };

      // 5. Connect tracks
      pc.ontrack = (event) => {
        console.log('Received remote track from caller');
        const [remoteStream] = event.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio:", e));
        }
      };

      // 6. Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));

      // 7. Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 8. Send answer back to caller
      socketRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'call-answered',
          to: incomingCallData.from,
          answer
        }
      });
    } catch (err: any) {
      console.error('Error accepting WebRTC call:', err);
      setMediaError(
        err.name === 'NotAllowedError' 
          ? 'Microphone permission denied. Unable to accept call.' 
          : 'Audio setup failed.'
      );
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (incomingCallData) {
      socketRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'call-rejected',
          to: incomingCallData.from
        }
      });
      setIncomingCallData(null);
    }
    cleanupCall();
    setCallState('ended');
    setTimeout(() => setCallState('idle'), 2000);
  };

  const endActiveCall = () => {
    const targetId = incomingCallData?.from || activeContactId;
    if (targetId) {
      socketRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'call-ended',
          to: targetId
        }
      });
    }
    cleanupCall();
    setIncomingCallData(null);
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
    }, 2000);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="chat-view-root" className="bg-zinc-900/90 rounded-[28px] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[500px] max-h-[680px] md:h-[620px] text-xs text-zinc-300">
      
      {/* Sidebar Contacts List */}
      <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col bg-zinc-950/80 shrink-0 h-full ${activeContactId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-800">
          <h3 className="font-bold text-white text-sm">Direct Contacts</h3>
          <p className="text-zinc-400 text-[10px] mt-0.5">Click a contact to exchange messages</p>
          
          {isCreatedAccount ? (
            <div className="mt-2.5 px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20 font-mono text-[9px] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Auto-Chat Simulator: Disabled
            </div>
          ) : (
            <div className="mt-2.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg border border-indigo-500/20 font-mono text-[9px] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Auto-Chat Simulator: Active
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
          {contacts.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">
              <p className="text-xs font-semibold text-zinc-400">No contacts yet</p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Book a skill swap or click <span className="font-semibold text-zinc-300">"Chat First"</span> on a profile in Explore to start messaging.
              </p>
            </div>
          ) : (
            contacts.map((contact) => {
              const isContactOnline = onlineUsers[contact.id] || DEFAULT_USER_IDS.includes(contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveContactId(contact.id);
                    cleanupCall();
                  }}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition ${
                    activeContactId === contact.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-zinc-800/60'
                  }`}
                >
                  <img 
                    src={contact.avatar} 
                    alt={contact.name} 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate">{contact.name}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isContactOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} title={isContactOnline ? 'Online' : 'Offline'}></span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{contact.skillsOffered[0]?.name || 'Explorer'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Primary Conversation Screen */}
      <div className={`flex-1 flex flex-col bg-zinc-900/90 relative h-full min-h-0 ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Conversation Header */}
            <div className="p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setActiveContactId(null)}
                  className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition shrink-0 cursor-pointer border-0 bg-transparent flex items-center justify-center min-w-[36px] min-h-[36px]"
                  title="Back to swappers list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <img 
                  src={activeContact.avatar} 
                  alt={activeContact.name} 
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate">{activeContact.name}</h4>
                  {(() => {
                    const isContactOnline = onlineUsers[activeContact.id] || DEFAULT_USER_IDS.includes(activeContact.id);
                    return (
                      <p className={`text-[10px] flex items-center gap-1 ${isContactOnline ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                        <Circle className={`w-1.5 h-1.5 fill-current ${isContactOnline ? 'text-emerald-400 animate-ping' : 'text-zinc-500'}`} /> {isContactOnline ? 'Online' : 'Offline'}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Call Control Triggers */}
              <div className="flex items-center gap-1.5 shrink-0">
                {(() => {
                  const canCall = hasConfirmedBookingWith(activeContact.id);
                  return (
                    <button
                      onClick={() => {
                        if (!canCall) {
                          alert(`Voice calling requires a confirmed swap booking with ${activeContact.name}.`);
                          return;
                        }
                        triggerCall();
                      }}
                      className={`p-2 rounded-xl transition ${
                        canCall 
                          ? 'text-zinc-300 hover:text-indigo-400 hover:bg-zinc-800 cursor-pointer' 
                          : 'text-zinc-600 cursor-not-allowed opacity-50'
                      }`}
                      title={canCall ? "Voice Call" : "Book a confirmed swap with this person to enable calling"}
                    >
                      <Phone className={`w-4 h-4 ${canCall ? 'animate-bounce' : ''}`} />
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 bg-zinc-950/40 min-h-0">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  <span>Loading chat history...</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isCurrentUser = m.senderId === currentUser.id;
                  return (
                    <div 
                      key={m.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl shadow-lg space-y-1 min-w-0 break-words overflow-hidden ${
                        isCurrentUser 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                          : 'bg-zinc-800/90 border border-zinc-700/60 text-zinc-100 rounded-bl-none'
                      }`}>
                        
                        {/* File asset layout */}
                        {m.fileName && (
                          <div className={`p-2 rounded-xl border flex items-center gap-2 mb-1.5 min-w-0 ${
                            isCurrentUser ? 'bg-white/10 border-white/15 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                          }`}>
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[10px] truncate leading-tight">{m.fileName}</p>
                              <span className="text-[9px] opacity-75 block truncate">Simulated resource attachment</span>
                            </div>
                          </div>
                        )}

                        <p className="leading-relaxed text-xs break-words whitespace-pre-wrap max-w-full">{m.text}</p>
                        
                        <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 shrink-0">
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isCurrentUser && (
                            <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Text Input Footer */}
            <div className="p-2.5 sm:p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-2 sticky bottom-0 z-10 shrink-0">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border-0 bg-transparent"
                title="Share simulated file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-600"
              />

              <button
                onClick={() => handleSendMessage(inputText)}
                className="p-2.5 sm:p-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950/50">
            <EmptyState
              preset="chats"
              title="Welcome to Skill Barter Chat"
              description={
                contacts.length === 0
                  ? "You don't have active chat threads yet. Pick a partner from the explore view to start exchanging!"
                  : "Select a partner from the left sidebar to coordinate barter sessions or launch a voice call."
              }
            />
          </div>
        )}

        {/* Real-time WebRTC Voice Call Overlay View */}
        <AnimatePresence>
          {callState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950 text-white z-25 flex flex-col items-center justify-between p-6 animate-fade-in"
            >
              {/* Remote audio stream player */}
              <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

              {/* Call state header */}
              <div className="w-full flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                  P2P Secure Voice Call
                </span>
                {callState === 'connected' && (
                  <span className="font-mono text-sm bg-white/5 px-2.5 py-1 rounded-md">{formatDuration(callDuration)}</span>
                )}
              </div>

              {mediaError && (
                <div className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/40 px-3 py-1.5 rounded-lg max-w-sm text-center">
                  ⚠️ {mediaError}
                </div>
              )}

              {/* Call State Content */}
              <div className="flex-1 w-full flex items-center justify-center py-4">
                {callState === 'calling' && activeContact && (
                  <div className="text-center space-y-6 flex flex-col items-center">
                    <div className="relative mx-auto w-24 h-24 rounded-full flex items-center justify-center">
                      <img 
                        src={activeContact.avatar} 
                        alt={activeContact.name} 
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-md relative z-10"
                      />
                      <span className="absolute inset-0 bg-indigo-500/35 rounded-full animate-ping"></span>
                      <span className="absolute inset-2 bg-indigo-500/20 rounded-full animate-pulse"></span>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">{activeContact.name}</h3>
                      <p className="text-xs text-indigo-300 animate-pulse font-medium tracking-wide">
                        Calling... Ringing...
                      </p>
                    </div>
                  </div>
                )}

                {callState === 'ringing' && (
                  <div className="text-center space-y-6 flex flex-col items-center">
                    <div className="relative mx-auto w-24 h-24 rounded-full flex items-center justify-center">
                      <img 
                        src={incomingCallData?.callerAvatar || activeContact?.avatar} 
                        alt={incomingCallData?.callerName || "Unknown"} 
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-md relative z-10"
                      />
                      <span className="absolute inset-0 bg-emerald-500/35 rounded-full animate-ping"></span>
                      <span className="absolute inset-2 bg-emerald-500/20 rounded-full animate-pulse"></span>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">{incomingCallData?.callerName || "Incoming Call"}</h3>
                      <p className="text-xs text-emerald-400 font-medium tracking-wide animate-bounce">
                        Incoming Voice Call...
                      </p>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={acceptCall}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full transition flex items-center gap-2 text-xs cursor-pointer shadow-lg shadow-emerald-950/40"
                      >
                        <Phone className="w-4 h-4 fill-current animate-bounce" /> Accept
                      </button>
                      <button
                        onClick={rejectCall}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-full transition flex items-center gap-2 text-xs cursor-pointer shadow-lg shadow-rose-950/40"
                      >
                        <PhoneOff className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {callState === 'connected' && activeContact && (
                  <div className="text-center space-y-6 flex flex-col items-center">
                    <div className="relative mx-auto w-24 h-24 rounded-full flex items-center justify-center">
                      <img 
                        src={incomingCallData?.callerAvatar || activeContact.avatar} 
                        alt={incomingCallData?.callerName || activeContact.name} 
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-md relative z-10"
                      />
                      <span className="absolute inset-0 bg-indigo-500/25 rounded-full animate-ping"></span>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">
                        {incomingCallData?.callerName || activeContact.name}
                      </h3>
                      <p className="text-xs text-emerald-400 flex items-center gap-1 justify-center font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Connected
                      </p>
                    </div>

                    {/* Microphone frequency oscilloscope display */}
                    <div className="w-64 h-16 bg-slate-900/60 rounded-xl overflow-hidden border border-white/5 relative shadow-inner">
                      <canvas 
                        ref={canvasRef} 
                        width={256} 
                        height={64} 
                        className="w-full h-full opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] text-indigo-300 font-mono tracking-wider uppercase bg-slate-950/45 px-2 py-0.5 rounded">
                          {isMuted ? 'Microphone Muted' : 'Live Voice Waveform'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {callState === 'ended' && (
                  <div className="text-center space-y-4 flex flex-col items-center">
                    <div className="p-4 bg-rose-950/40 rounded-full border border-rose-900/50">
                      <PhoneOff className="w-8 h-8 text-rose-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base text-rose-500">Call Ended</h3>
                      <p className="text-xs text-slate-400">Connection closed gracefully</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating controls toolbar for Caller / Connected */}
              {callState !== 'ringing' && callState !== 'ended' && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-lg">
                  {callState === 'connected' && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3 rounded-full transition cursor-pointer ${
                        isMuted ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
                      }`}
                      title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}

                  <button
                    onClick={endActiveCall}
                    className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition cursor-pointer"
                    title="Hang Up Call"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
