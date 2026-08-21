import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Paperclip, 
  X, Circle, Check, CheckCheck, Smile, HelpCircle, FileText, Image, Globe, ArrowLeft, CornerUpLeft, Trash2, Ban,
  Download, Loader2, Mic, Play, Pause, Search, ChevronUp, ChevronDown, Forward
} from 'lucide-react';
import { UserProfile, Message, Booking } from '../types';
import { supabase, mapSupabaseToMessage, mapMessageToSupabase } from '../lib/supabase';
import { EmptyState } from './ui';

function isDifferentDay(ts1: string, ts2: string): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
}

function formatDateSeparator(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, now)) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatLastSeen(lastActiveStr?: string): string {
  if (!lastActiveStr) return 'Offline';
  const date = new Date(lastActiveStr);
  if (isNaN(date.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `Last seen ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays} days ago`;
  return `Last seen on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function VoiceMessagePlayer({ url, isCurrentUser }: { url: string; isCurrentUser: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => console.error('Audio play error:', err));
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  return (
    <div className={`p-2.5 rounded-2xl flex items-center gap-3 my-1 border min-w-[210px] sm:min-w-[250px] max-w-[280px] ${
      isCurrentUser 
        ? 'bg-black/20 border-white/20 text-white' 
        : 'bg-zinc-900 border-zinc-700/80 text-zinc-100'
    }`}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
          isCurrentUser 
            ? 'bg-white text-indigo-600 hover:bg-zinc-200 shadow-md' 
            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
        }`}
        title={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-0.5 h-3 overflow-hidden select-none">
          {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70, 85, 40, 65].map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full transition-all duration-150 ${
                (currentTime / (duration || 1)) > (i / 15)
                  ? (isCurrentUser ? 'bg-white' : 'bg-indigo-400')
                  : (isCurrentUser ? 'bg-white/30' : 'bg-zinc-700')
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
        />

        <div className="flex justify-between items-center text-[9px] opacity-80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

interface ChatViewProps {
  currentUser: UserProfile;
  contacts: UserProfile[];
  initialActiveContactId?: string | null;
  bookings: Booking[];
}

const ChatView = React.memo(function ChatView({ currentUser, contacts, initialActiveContactId, bookings }: ChatViewProps) {
  const DEFAULT_USER_IDS = [
    'user-alex', 'user-sofia', 'user-marcus', 'user-elena', 'user-david',
    'user-maya', 'user-liam', 'user-yuki', 'user-zara', 'user-tyler'
  ];

  const [activeContactId, setActiveContactId] = useState<string | null>(initialActiveContactId || (contacts[0]?.id || null));
  const activeContactIdRef = useRef<string | null>(activeContactId);
  useEffect(() => {
    activeContactIdRef.current = activeContactId;
  }, [activeContactId]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [latestMessageTimes, setLatestMessageTimes] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [deleteModalMsg, setDeleteModalMsg] = useState<Message | null>(null);

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // File Upload & Preview States
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; name: string } | null>(null);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);

  // Voice Recording States
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Message Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Forwarding States
  const [forwardModalMsg, setForwardModalMsg] = useState<Message | null>(null);
  const [selectedForwardContactIds, setSelectedForwardContactIds] = useState<string[]>([]);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [isSendingForward, setIsSendingForward] = useState(false);

  // Hidden Chats States (Delete Chat functionality)
  const [hiddenChats, setHiddenChats] = useState<Record<string, string>>(() => {
    try {
      const local = localStorage.getItem(`chat_hidden_${currentUser.id}`);
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });
  const [deleteChatModalContact, setDeleteChatModalContact] = useState<UserProfile | null>(null);

  // Load hidden chats from Supabase
  useEffect(() => {
    if (!currentUser?.id) return;
    const loadHiddenChats = async () => {
      try {
        const { data, error } = await supabase
          .from('hidden_chats')
          .select('contact_id, hidden_at')
          .eq('user_id', currentUser.id);

        if (data && !error && data.length > 0) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => {
            if (row.contact_id && row.hidden_at) {
              map[row.contact_id] = row.hidden_at;
            }
          });
          setHiddenChats((prev) => {
            const merged = { ...prev, ...map };
            try {
              localStorage.setItem(`chat_hidden_${currentUser.id}`, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (e) {
        // Fallback to localStorage state if hidden_chats table is not created in DB yet
      }
    };
    loadHiddenChats();
  }, [currentUser?.id]);

  const handleDeleteChat = async (contactId: string) => {
    const now = new Date().toISOString();

    // 1. Update local state
    setHiddenChats((prev) => {
      const updated = { ...prev, [contactId]: now };
      try {
        localStorage.setItem(`chat_hidden_${currentUser.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Clear active contact if currently selected
    if (activeContactId === contactId) {
      setActiveContactId(null);
    }

    // 3. Close modal
    setDeleteChatModalContact(null);

    // 4. Save to Supabase hidden_chats table
    try {
      await supabase.from('hidden_chats').upsert(
        {
          user_id: currentUser.id,
          contact_id: contactId,
          hidden_at: now,
        },
        { onConflict: 'user_id,contact_id' }
      );
    } catch (err) {
      console.error('Error saving hidden chat to Supabase:', err);
    }
  };

  const handleExecuteForward = async () => {
    if (!forwardModalMsg || selectedForwardContactIds.length === 0) return;

    setIsSendingForward(true);

    try {
      const textToSend = forwardModalMsg.text || (forwardModalMsg.fileName ? `📎 ${forwardModalMsg.fileName}` : '🎤 Voice Note');
      const timestamp = new Date().toISOString();

      for (const contactId of selectedForwardContactIds) {
        const newMsg: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderId: currentUser.id,
          receiverId: contactId,
          text: textToSend,
          fileUrl: forwardModalMsg.fileUrl,
          fileName: forwardModalMsg.fileName,
          fileSize: forwardModalMsg.fileSize,
          fileType: forwardModalMsg.fileType,
          timestamp,
          status: 'sent',
          isForwarded: true
        };

        const { data, error } = await supabase
          .from('messages')
          .insert(mapMessageToSupabase(newMsg))
          .select()
          .single();

        const finalMsg = (data && mapSupabaseToMessage(data)) || newMsg;

        if (activeContactId === contactId) {
          setMessages((prev) => [...prev, finalMsg]);
        }

        setLatestMessageTimes((prev) => ({
          ...prev,
          [contactId]: timestamp
        }));
      }

      setForwardModalMsg(null);
      setSelectedForwardContactIds([]);
      setForwardSearchQuery('');
    } catch (err: any) {
      console.error('Error forwarding message:', err);
    } finally {
      setIsSendingForward(false);
    }
  };

  const MAX_RECORDING_SECONDS = 120;

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, [activeContactId]);

  const matchedMessages = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return messages.filter(
      (m) =>
        !m.deletedForEveryone &&
        ((m.text && m.text.toLowerCase().includes(query)) ||
          (m.fileName && m.fileName.toLowerCase().includes(query)))
    );
  }, [messages, searchQuery]);

  const matchCount = matchedMessages.length;

  useEffect(() => {
    if (isSearchOpen && matchCount > 0 && matchedMessages[currentMatchIndex]) {
      const targetMsgId = matchedMessages[currentMatchIndex].id;
      const el = document.getElementById(`msg-${targetMsgId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMsgId(targetMsgId);
      }
    }
  }, [currentMatchIndex, matchedMessages, isSearchOpen, matchCount]);

  const renderHighlightedText = (text: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === trimmed.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-zinc-950 font-bold px-0.5 rounded-sm">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startAudioRecording = async () => {
    setFileUploadError(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg')
            ? 'audio/ogg'
            : ''
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecordingAudio(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= MAX_RECORDING_SECONDS - 1) {
            stopAndSendAudioRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setFileUploadError('Microphone access denied or unavailable. Please check microphone permissions.');
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingDuration(0);
  };

  const stopAndSendAudioRecording = async () => {
    if (!mediaRecorderRef.current || !isRecordingAudio) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const durationSecs = recordingDuration;

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];

      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      setIsRecordingAudio(false);
      setRecordingDuration(0);

      if (audioBlob.size === 0) {
        setFileUploadError("Voice recording was empty. Please try again.");
        return;
      }

      if (!activeContactId) {
        setFileUploadError("Please select a recipient before sending a voice note.");
        return;
      }

      setIsUploadingFile(true);
      setUploadProgressText("Uploading voice note...");

      try {
        const extension = mimeType.includes('ogg') ? 'ogg' : 'webm';
        const fileName = `Voice Note (${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s).${extension}`;
        const filePath = `${currentUser.id}/${Date.now()}-voice-note.${extension}`;

        const { data, error } = await supabase.storage
          .from('chat-files')
          .upload(filePath, audioBlob, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(error.message || 'Failed to upload voice note to storage.');
        }

        const { data: publicUrlData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        await handleSendMessage("🎤 Voice Note", {
          name: fileName,
          url: publicUrl,
          size: audioBlob.size,
          type: mimeType
        });
      } catch (err: any) {
        console.error('Voice note upload error:', err);
        setFileUploadError(err.message || 'Failed to send voice note.');
      } finally {
        setIsUploadingFile(false);
        setUploadProgressText(null);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser?.id) return;

    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const currentReactions: Record<string, string[]> = msg.reactions ? { ...msg.reactions } : {};
    const existingUserIds = Array.isArray(currentReactions[emoji]) ? [...currentReactions[emoji]] : [];

    const userIndex = existingUserIds.indexOf(currentUser.id);
    if (userIndex > -1) {
      existingUserIds.splice(userIndex, 1);
    } else {
      existingUserIds.push(currentUser.id);
    }

    if (existingUserIds.length > 0) {
      currentReactions[emoji] = existingUserIds;
    } else {
      delete currentReactions[emoji];
    }

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactions: currentReactions } : m))
    );

    setActiveReactionPickerMsgId(null);

    try {
      const { error } = await supabase
        .from('messages')
        .update({ reactions: currentReactions })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating reaction in Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  const handleDeleteForMe = async (msg: Message) => {
    const isSender = msg.senderId === currentUser.id;
    const updateField = isSender ? 'deleted_for_sender' : 'deleted_for_receiver';

    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setDeleteModalMsg(null);

    try {
      await supabase
        .from('messages')
        .update({ [updateField]: true })
        .eq('id', msg.id);
    } catch (err) {
      console.error('Error deleting message for me:', err);
    }
  };

  const handleDeleteForEveryone = async (msg: Message) => {
    const diffMs = Date.now() - new Date(msg.timestamp).getTime();
    if (diffMs > 3600 * 1000) {
      alert('You can only delete messages for everyone within 1 hour of sending.');
      return;
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? { ...m, deletedForEveryone: true }
          : m
      )
    );
    setDeleteModalMsg(null);

    try {
      await supabase
        .from('messages')
        .update({ deleted_for_everyone: true })
        .eq('id', msg.id);
    } catch (err) {
      console.error('Error deleting message for everyone:', err);
    }
  };

  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socketRef = useRef<any>(null);

  // File Sharing simulation states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Supabase Realtime subscription for typing & presence
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase.channel('global-signaling');
    socketRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.to !== currentUser.id) return;
        const { from, isTyping } = payload;
        if (isTyping) {
          setTypingUsers((prev) => ({ ...prev, [from]: Date.now() }));
        } else {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            delete copy[from];
            return copy;
          });
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

  // Initial metadata loader for unread counts and latest message timestamps
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchConversationsMeta = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        if (data) {
          const allMsgs = data.map(mapSupabaseToMessage);
          const counts: Record<string, number> = {};
          const times: Record<string, string> = {};

          allMsgs.forEach((msg) => {
            if (msg.senderId === currentUser.id && msg.deletedForSender) return;
            if (msg.receiverId === currentUser.id && msg.deletedForReceiver) return;

            const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;

            // Track latest message timestamp
            if (!times[otherId] || new Date(msg.timestamp) > new Date(times[otherId])) {
              times[otherId] = msg.timestamp;
            }

            // Track unread messages sent to current user
            if (msg.receiverId === currentUser.id && msg.status !== 'read' && !msg.deletedForEveryone) {
              counts[otherId] = (counts[otherId] || 0) + 1;
            }
          });

          // If active chat is currently open, reset its unread count
          if (activeContactIdRef.current) {
            counts[activeContactIdRef.current] = 0;
          }

          setUnreadCounts(counts);
          setLatestMessageTimes(times);
        }
      } catch (err) {
        console.error('Error fetching conversation activity metadata:', err);
      }
    };

    fetchConversationsMeta();
  }, [currentUser?.id]);

  // Supabase Realtime subscription for messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`realtime-messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = mapSupabaseToMessage(payload.new);
          const otherId = newMsg.senderId === currentUser.id ? newMsg.receiverId : newMsg.senderId;

          // Update latest message timestamp for this contact
          setLatestMessageTimes((prev) => ({
            ...prev,
            [otherId]: newMsg.timestamp,
          }));

          // If this message is received by current user
          if (newMsg.receiverId === currentUser.id) {
            if (activeContactIdRef.current === newMsg.senderId) {
              // Active chat open -> mark as read
              newMsg.status = 'read';
              supabase.from('messages').update({ status: 'read' }).eq('id', newMsg.id).then();
              setUnreadCounts((prev) => ({ ...prev, [otherId]: 0 }));
            } else {
              // Received in background -> mark as delivered if sent & increment unread count
              if (newMsg.status === 'sent') {
                newMsg.status = 'delivered';
                supabase.from('messages').update({ status: 'delivered' }).eq('id', newMsg.id).then();
              }
              setUnreadCounts((prev) => ({
                ...prev,
                [otherId]: (prev[otherId] || 0) + 1,
              }));
            }
          }

          // Only append if it belongs to the current open chat
          if (
            (newMsg.senderId === currentUser.id && newMsg.receiverId === activeContactIdRef.current) ||
            (newMsg.senderId === activeContactIdRef.current && newMsg.receiverId === currentUser.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
              }
              return [...prev, newMsg];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMsg = mapSupabaseToMessage(payload.new);
          const otherId = updatedMsg.senderId === currentUser.id ? updatedMsg.receiverId : updatedMsg.senderId;

          if (updatedMsg.receiverId === currentUser.id && updatedMsg.status === 'read') {
            setUnreadCounts((prev) => {
              if (!prev[otherId]) return prev;
              return { ...prev, [otherId]: Math.max(0, prev[otherId] - 1) };
            });
          }

          if (
            (updatedMsg.senderId === currentUser.id && updatedMsg.receiverId === activeContactIdRef.current) ||
            (updatedMsg.senderId === activeContactIdRef.current && updatedMsg.receiverId === currentUser.id)
          ) {
            setMessages((prev) =>
              prev
                .map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
                .filter((m) => {
                  if (m.senderId === currentUser.id && m.deletedForSender) return false;
                  if (m.receiverId === currentUser.id && m.deletedForReceiver) return false;
                  return true;
                })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);



  const activeContact = contacts.find(c => c.id === activeContactId);

  // Load message logs from API
  useEffect(() => {
    if (initialActiveContactId) {
      setActiveContactId(initialActiveContactId);
    } else if (!activeContactId && contacts.length > 0) {
      setActiveContactId(contacts[0].id);
    }
  }, [initialActiveContactId, contacts]);

  useEffect(() => {
    if (!activeContactId) return;
    setReplyingTo(null);

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
          const mapped = data
            .map(mapSupabaseToMessage)
            .filter((m) => {
              if (m.senderId === currentUser.id && m.deletedForSender) return false;
              if (m.receiverId === currentUser.id && m.deletedForReceiver) return false;
              return true;
            });
          
          // Clear unread count badge for this active contact
          setUnreadCounts((prev) => ({
            ...prev,
            [activeContactId]: 0,
          }));

          // Check if there are unread messages sent to current user
          const hasUnread = mapped.some(m => m.receiverId === currentUser.id && m.status !== 'read');
          if (hasUnread) {
            supabase
              .from('messages')
              .update({ status: 'read' })
              .eq('sender_id', activeContactId)
              .eq('receiver_id', currentUser.id)
              .neq('status', 'read')
              .then(({ error: markErr }) => {
                if (markErr) console.error('Error marking messages as read:', markErr);
              });
          }

          const updatedMapped = mapped.map(m => {
            if (m.receiverId === currentUser.id && m.status !== 'read') {
              return { ...m, status: 'read' as const };
            }
            return m;
          });

          setMessages(updatedMapped);
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



  const handleInputChange = (val: string) => {
    setInputText(val);

    if (!activeContactId) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500 && val.trim().length > 0) {
      lastTypingSentRef.current = now;
      socketRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { from: currentUser.id, to: activeContactId, isTyping: true }
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (val.trim().length === 0) {
      socketRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { from: currentUser.id, to: activeContactId, isTyping: false }
      });
    } else {
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.send({
          type: 'broadcast',
          event: 'typing',
          payload: { from: currentUser.id, to: activeContactId, isTyping: false }
        });
      }, 2500);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageMessage = (msg: Message) => {
    if (msg.fileType && msg.fileType.startsWith('image/')) return true;
    const urlOrName = msg.fileUrl || msg.fileName || '';
    return /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(urlOrName);
  };

  const isAudioMessage = (msg: Message) => {
    if (msg.fileType && msg.fileType.startsWith('audio/')) return true;
    const urlOrName = (msg.fileUrl || '') + (msg.fileName || '');
    return /\.(webm|ogg|mp3|wav|m4a|aac)($|\?)/i.test(urlOrName);
  };

  const handleSendMessage = async (text: string, fileInfo?: { name: string; url: string; size?: number; type?: string }) => {
    if (!text.trim() && !fileInfo) return;
    if (!activeContactId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { from: currentUser.id, to: activeContactId, isTyping: false }
    });

    const currentReplyId = replyingTo?.id;
    setReplyingTo(null);

    const newMessageTemp: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: currentUser.id,
      receiverId: activeContactId,
      text: text,
      fileName: fileInfo?.name,
      fileUrl: fileInfo?.url,
      fileSize: fileInfo?.size,
      fileType: fileInfo?.type,
      timestamp: new Date().toISOString(),
      status: 'sent',
      replyToMessageId: currentReplyId
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(mapMessageToSupabase(newMessageTemp))
        .select()
        .single();

      if (error) throw error;

      // Insert notification for receiver
      const notificationMsg = fileInfo 
        ? `Shared a file: ${fileInfo.name}` 
        : `You received a message: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`;

      await supabase.from('notifications').insert({
        user_id: activeContactId,
        title: 'New Message',
        message: notificationMsg,
        type: 'message',
        read: false,
        timestamp: new Date().toISOString()
      });

      const savedMsg = data ? mapSupabaseToMessage(data) : newMessageTemp;

      // Update latest message timestamp for activity sorting
      setLatestMessageTimes((prev) => ({
        ...prev,
        [activeContactId]: savedMsg.timestamp,
      }));

      // Update state locally
      setMessages(prev => {
        if (prev.some(m => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
      setInputText('');
    } catch (err) {
      console.error('Error sending message to Supabase:', err);
    }
  };

  // Functional File upload to Supabase Storage bucket 'chat-files'
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting same file again if needed
    e.target.value = '';
    setFileUploadError(null);

    // 10MB limit (10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setFileUploadError(`File "${file.name}" (${formatFileSize(file.size)}) exceeds the 10MB size limit. Please select a smaller file.`);
      return;
    }

    if (!activeContactId) {
      setFileUploadError("Please select a recipient from the contact list first.");
      return;
    }

    setIsUploadingFile(true);
    setUploadProgressText(`Uploading ${file.name}...`);

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${currentUser.id}/${Date.now()}-${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase Storage upload error:', error);
        throw new Error(error.message || 'Failed to upload file to storage bucket.');
      }

      const { data: publicUrlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const defaultText = inputText.trim() 
        ? inputText.trim() 
        : (file.type.startsWith('image/') ? 'Shared an image' : `Shared a file: ${file.name}`);

      await handleSendMessage(defaultText, {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type || 'application/octet-stream'
      });
    } catch (err: any) {
      console.error('File upload failed:', err);
      setFileUploadError(err.message || 'File upload failed. Please verify storage permissions or try again.');
    } finally {
      setIsUploadingFile(false);
      setUploadProgressText(null);
    }
  };



  const sortedContacts = React.useMemo(() => {
    return [...contacts]
      .filter((c) => {
        if (c.id === currentUser.id) return false;
        const hiddenAt = hiddenChats[c.id];
        if (!hiddenAt) return true;
        const lastMsgTime = latestMessageTimes[c.id];
        if (!lastMsgTime) return false;
        return new Date(lastMsgTime).getTime() > new Date(hiddenAt).getTime();
      })
      .sort((a, b) => {
        const timeA = latestMessageTimes[a.id] ? new Date(latestMessageTimes[a.id]).getTime() : 0;
        const timeB = latestMessageTimes[b.id] ? new Date(latestMessageTimes[b.id]).getTime() : 0;
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        return a.name.localeCompare(b.name);
      });
  }, [contacts, latestMessageTimes, hiddenChats, currentUser.id]);

  return (
    <div id="chat-view-root" className="bg-surface-base rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[500px] max-h-[680px] md:h-[620px] text-xs text-text-sub">
      
      {/* Sidebar Contacts List */}
      <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 flex flex-col bg-surface-raised/80 shrink-0 h-full ${activeContactId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5 bg-surface-base">
          <h3 className="font-bold text-white text-sm">Direct Contacts</h3>
          <p className="text-text-dim text-[10px] mt-0.5">Click a contact to exchange messages</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {sortedContacts.length === 0 ? (
            <div className="p-6 text-center text-text-dim">
              <p className="text-xs font-semibold text-text-muted">No contacts yet</p>
              <p className="text-[11px] text-text-dim mt-1 leading-relaxed">
                Book a skill swap or click <span className="font-semibold text-white">"Chat First"</span> on a profile in Explore to start messaging.
              </p>
            </div>
          ) : (
            sortedContacts.map((contact) => {
              const isContactOnline = onlineUsers[contact.id] || DEFAULT_USER_IDS.includes(contact.id);
              const isContactTyping = Boolean(typingUsers[contact.id] && Date.now() - (typingUsers[contact.id] || 0) < 4000);
              const unreadCount = unreadCounts[contact.id] || 0;
              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveContactId(contact.id);
                  }}
                  className={`group relative p-3.5 flex items-center gap-3 cursor-pointer transition ${
                    activeContactId === contact.id ? 'bg-violet-600/15 border-l-4 border-violet-500' : 'hover:bg-surface-interactive'
                  }`}
                >
                  <img 
                    src={contact.avatar} 
                    alt={contact.name} 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white truncate">{contact.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-violet-600 text-white rounded-full min-w-[18px] text-center leading-none shadow-sm shadow-violet-600/30">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isContactOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} title={isContactOnline ? 'Online' : 'Offline'}></span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteChatModalContact(contact);
                          }}
                          className="p-1 text-text-dim hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shrink-0 ml-0.5"
                          title={`Delete chat with ${contact.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-text-dim truncate mt-0.5">
                      {isContactTyping ? (
                        <span className="text-violet-400 font-semibold animate-pulse">typing...</span>
                      ) : isContactOnline ? (
                        contact.skillsOffered[0]?.name || 'Explorer'
                      ) : (
                        formatLastSeen(contact.lastActive)
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Primary Conversation Screen */}
      <div className={`flex-1 flex flex-col bg-surface-base relative h-full min-h-0 ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Conversation Header */}
            <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between bg-surface-raised shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setActiveContactId(null)}
                  className="md:hidden p-1.5 -ml-1 text-text-dim hover:text-white hover:bg-surface-interactive rounded-lg transition shrink-0 cursor-pointer border-0 bg-transparent flex items-center justify-center min-w-[36px] min-h-[36px]"
                  title="Back to swappers list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <img 
                  src={activeContact.avatar} 
                  alt={activeContact.name} 
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate">{activeContact.name}</h4>
                  {(() => {
                    const isContactOnline = onlineUsers[activeContact.id] || DEFAULT_USER_IDS.includes(activeContact.id);
                    const isContactTyping = Boolean(typingUsers[activeContact.id] && Date.now() - (typingUsers[activeContact.id] || 0) < 4000);

                    if (isContactTyping) {
                      return (
                        <p className="text-[10px] text-violet-400 font-semibold animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping shrink-0" />
                          {activeContact.name} is typing...
                        </p>
                      );
                    }
                    if (isContactOnline) {
                      return (
                        <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Circle className="w-1.5 h-1.5 fill-current text-emerald-400 animate-ping shrink-0" /> Online
                        </p>
                      );
                    }
                    return (
                      <p className="text-[10px] text-text-dim font-medium flex items-center gap-1">
                        <Circle className="w-1.5 h-1.5 fill-current text-text-muted shrink-0" /> {formatLastSeen(activeContact.lastActive)}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Action buttons (Search) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isSearchOpen;
                    setIsSearchOpen(nextState);
                    if (nextState) {
                      setTimeout(() => searchInputRef.current?.focus(), 60);
                    } else {
                      setSearchQuery('');
                      setHighlightedMsgId(null);
                    }
                  }}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center border-0 min-w-[36px] min-h-[36px] ${
                    isSearchOpen 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                      : 'text-text-dim hover:text-white hover:bg-surface-interactive'
                  }`}
                  title={isSearchOpen ? "Close search" : "Search in conversation"}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Linked Upcoming / Active Exchange Session Banner */}
            {(() => {
              const linkedBooking = bookings?.find(b => 
                (b.status === 'confirmed' || b.status === 'rescheduled' || b.status === 'pending') &&
                ((b.teacherId === currentUser.id && b.learnerId === activeContact.id) ||
                 (b.learnerId === currentUser.id && b.teacherId === activeContact.id))
              );

              if (!linkedBooking) return null;

              const isTeaching = linkedBooking.teacherId === currentUser.id;

              return (
                <div className="px-4 py-2.5 bg-violet-950/40 border-b border-violet-500/20 flex items-center justify-between gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-lavender-300 block truncate">
                        {isTeaching ? `Teaching ${linkedBooking.skillName}` : `Learning ${linkedBooking.skillName}`}
                      </span>
                      <span className="text-white font-medium truncate block text-[11px]">
                        📅 {linkedBooking.date} • ⏰ {linkedBooking.timeSlot}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      linkedBooking.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : linkedBooking.status === 'rescheduled'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-violet-500/20 text-lavender-200 border-violet-500/30'
                    }`}>
                      {linkedBooking.status === 'confirmed' ? 'Confirmed Session' : linkedBooking.status}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Search Bar Overlay */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0 z-10 shadow-md"
                >
                  <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition">
                    <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentMatchIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setHighlightedMsgId(null);
                        } else if (e.key === 'Enter') {
                          if (matchCount > 0) {
                            if (e.shiftKey) {
                              setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : matchCount - 1));
                            } else {
                              setCurrentMatchIndex((prev) => (prev < matchCount - 1 ? prev + 1 : 0));
                            }
                          }
                        }
                      }}
                      className="w-full bg-transparent text-white text-xs focus:outline-none placeholder:text-zinc-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentMatchIndex(0);
                          setHighlightedMsgId(null);
                          searchInputRef.current?.focus();
                        }}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer shrink-0"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs text-zinc-400 select-none">
                    <span className="text-[11px] font-mono px-1 min-w-[60px] text-right text-zinc-300">
                      {searchQuery.trim()
                        ? matchCount > 0
                          ? `${currentMatchIndex + 1} of ${matchCount}`
                          : '0 results'
                        : 'Search'}
                    </span>

                    <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        disabled={matchCount === 0}
                        onClick={() => setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : matchCount - 1))}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                        title="Previous result (Shift+Enter)"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={matchCount === 0}
                        onClick={() => setCurrentMatchIndex((prev) => (prev < matchCount - 1 ? prev + 1 : 0))}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                        title="Next result (Enter)"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        setHighlightedMsgId(null);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      title="Close search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-zinc-950/40 min-h-0">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  <span>Loading chat history...</span>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isCurrentUser = m.senderId === currentUser.id;

                  // Date separator check
                  const prevMsg = i > 0 ? messages[i - 1] : null;
                  const showDateSeparator = i === 0 || (prevMsg ? isDifferentDay(prevMsg.timestamp, m.timestamp) : false);

                  // Grouping check with next message
                  const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
                  const isSameSenderAsNext = nextMsg ? nextMsg.senderId === m.senderId : false;
                  const isSameDayAsNext = nextMsg ? !isDifferentDay(m.timestamp, nextMsg.timestamp) : false;
                  const isWithin2MinNext = nextMsg ? Math.abs(new Date(nextMsg.timestamp).getTime() - new Date(m.timestamp).getTime()) < 120000 : false;

                  const isLastInGroup = !(isSameSenderAsNext && isSameDayAsNext && isWithin2MinNext);

                  return (
                    <React.Fragment key={m.id}>
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-3.5">
                          <div className="px-3 py-1 bg-surface-raised border border-white/10 rounded-full text-[10px] font-semibold text-text-dim shadow-sm select-none">
                            {formatDateSeparator(m.timestamp)}
                          </div>
                        </div>
                      )}

                      <div 
                        id={`msg-${m.id}`}
                        className={`flex items-center gap-1 group ${isCurrentUser ? 'flex-row-reverse justify-start' : 'justify-start'} w-full ${isLastInGroup ? 'mb-3' : 'mb-1'}`}
                      >
                        <div className="flex flex-col max-w-[85%] sm:max-w-[75%] min-w-0">
                          <div className={`p-3 rounded-2xl shadow-md min-w-0 break-words overflow-hidden transition-all duration-300 ${
                            highlightedMsgId === m.id
                              ? 'ring-2 ring-amber-400 scale-[1.01] shadow-amber-500/40'
                              : isSearchOpen && searchQuery.trim() && matchedMessages.some((msg) => msg.id === m.id)
                                ? 'ring-1 ring-amber-400/80'
                                : ''
                          } ${
                            isCurrentUser 
                              ? `bg-violet-600 text-white shadow-md shadow-violet-600/20 ${isLastInGroup ? 'rounded-br-none' : ''}` 
                              : `bg-surface-raised border border-white/10 text-text-sub ${isLastInGroup ? 'rounded-bl-none' : ''}`
                          }`}>
                            
                            {m.deletedForEveryone ? (
                              <div className="flex items-center gap-1.5 py-0.5 my-0.5 text-text-dim opacity-90 select-none">
                                <Ban className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span className="italic text-xs font-normal">This message was deleted</span>
                              </div>
                            ) : (
                              <>
                                {/* Forwarded Header Indicator */}
                                {m.isForwarded && (
                                  <div className={`flex items-center gap-1 mb-1.5 text-[10px] italic font-semibold select-none ${
                                    isCurrentUser ? 'text-violet-200' : 'text-text-dim'
                                  }`}>
                                    <Forward className="w-3 h-3 text-current shrink-0" />
                                    <span>Forwarded</span>
                                  </div>
                                )}

                                {/* Quoted Reply Preview */}
                                {m.replyToMessageId && (() => {
                                  const repliedMsg = messages.find((msg) => msg.id === m.replyToMessageId);
                                  return (
                                    <div
                                      onClick={() => {
                                        const targetId = `msg-${m.replyToMessageId}`;
                                        const el = document.getElementById(targetId);
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          setHighlightedMsgId(m.replyToMessageId!);
                                          setTimeout(() => setHighlightedMsgId(null), 2000);
                                        }
                                      }}
                                      className={`mb-2 p-2 rounded-lg text-[11px] border-l-2 cursor-pointer transition select-none ${
                                        isCurrentUser
                                          ? 'bg-black/30 border-lavender-300 text-lavender-100 hover:bg-black/40'
                                          : 'bg-surface-base border-violet-500 text-text-sub hover:bg-surface-base/80'
                                      }`}
                                    >
                                      <div className="font-bold text-[10px] text-violet-400 mb-0.5">
                                        {repliedMsg
                                          ? (repliedMsg.senderId === currentUser.id ? 'You' : activeContact?.name || 'User')
                                          : 'Original message'}
                                      </div>
                                      <p className="truncate text-[10px] opacity-90 font-normal">
                                        {repliedMsg
                                          ? (repliedMsg.deletedForEveryone
                                              ? '🚫 This message was deleted'
                                              : (repliedMsg.text || (repliedMsg.fileName ? `📎 ${repliedMsg.fileName}` : 'Attachment')))
                                          : 'Original message not found'}
                                      </p>
                                    </div>
                                  );
                                })()}

                                {/* Image attachment preview */}
                                {isImageMessage(m) && (m.fileUrl || m.fileName) && (
                                  <div className="mb-2 overflow-hidden rounded-xl border border-zinc-700/60 bg-black/40 group/img relative">
                                    <img 
                                      src={m.fileUrl || ''} 
                                      alt={m.fileName || 'Shared image'} 
                                      referrerPolicy="no-referrer"
                                      onClick={() => m.fileUrl && setPreviewImageModal({ url: m.fileUrl, name: m.fileName || 'Image' })}
                                      className="max-h-60 w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                                    />
                                    <div className="p-1.5 flex items-center justify-between text-[10px] bg-zinc-950/80 text-zinc-300">
                                      <span className="truncate max-w-[180px] font-medium text-zinc-200">{m.fileName || 'Shared Image'}</span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {m.fileSize && <span className="opacity-75">{formatFileSize(m.fileSize)}</span>}
                                        {m.fileUrl && (
                                          <a 
                                            href={m.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            download={m.fileName || 'image'}
                                            className="text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Download className="w-3 h-3" /> View
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Voice message player */}
                                {!isImageMessage(m) && isAudioMessage(m) && (m.fileUrl || m.fileName) && (
                                  <VoiceMessagePlayer url={m.fileUrl || ''} isCurrentUser={isCurrentUser} />
                                )}

                                {/* Non-image Non-audio File attachment card */}
                                {!isImageMessage(m) && !isAudioMessage(m) && (m.fileName || m.fileUrl) && (
                                  <div className={`p-2.5 rounded-xl border flex items-center gap-3 mb-2 min-w-[200px] ${
                                    isCurrentUser ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-900 border-zinc-700/80 text-zinc-200'
                                  }`}>
                                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-xs truncate leading-tight text-white">
                                        {isSearchOpen && searchQuery.trim()
                                          ? renderHighlightedText(m.fileName || 'Attached Document', searchQuery)
                                          : (m.fileName || 'Attached Document')}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5 text-[10px] opacity-75">
                                        {m.fileSize && <span>{formatFileSize(m.fileSize)}</span>}
                                        {m.fileType && <span className="truncate max-w-[100px] uppercase font-mono">{m.fileType.split('/')[1] || m.fileType}</span>}
                                      </div>
                                    </div>
                                    {m.fileUrl && (
                                      <a
                                        href={m.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={m.fileName || 'file'}
                                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shrink-0 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                        title="Download file"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Download</span>
                                      </a>
                                    )}
                                  </div>
                                )}

                                {m.text && (m.text !== '🎤 Voice Note' || (!m.fileUrl && !m.fileName)) && (
                                  <p className="leading-relaxed text-xs break-words whitespace-pre-wrap max-w-full">
                                    {isSearchOpen && searchQuery.trim()
                                      ? renderHighlightedText(m.text, searchQuery)
                                      : m.text}
                                  </p>
                                )}
                              </>
                            )}
                            
                            <div className={`flex items-center justify-end gap-1 shrink-0 ${
                              !isLastInGroup ? 'text-[8px] opacity-60 mt-0.5' : 'text-[9px] opacity-75 mt-1'
                            }`}>
                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isCurrentUser && (
                                <span className="inline-flex items-center ml-0.5" title={m.status || 'sent'}>
                                  {m.status === 'read' ? (
                                    <CheckCheck className={`stroke-[2.5] text-sky-300 ${!isLastInGroup ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                                  ) : m.status === 'delivered' ? (
                                    <CheckCheck className={`stroke-[2.5] opacity-80 ${!isLastInGroup ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                                  ) : (
                                    <Check className={`stroke-[2.5] opacity-80 ${!isLastInGroup ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reaction Pills below message bubble */}
                          {!m.deletedForEveryone && m.reactions && Object.keys(m.reactions).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(m.reactions).map(([emoji, userIds]) => {
                                if (!Array.isArray(userIds) || userIds.length === 0) return null;
                                const hasReacted = userIds.includes(currentUser.id);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleReaction(m.id, emoji);
                                    }}
                                    className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition cursor-pointer select-none border ${
                                      hasReacted
                                        ? 'bg-indigo-500/25 border-indigo-500/60 text-indigo-200 shadow-xs font-semibold'
                                        : 'bg-zinc-800/90 border-zinc-700/70 text-zinc-300 hover:bg-zinc-700/80 hover:text-white'
                                    }`}
                                    title={`${userIds.length} ${userIds.length === 1 ? 'reaction' : 'reactions'}`}
                                  >
                                    <span className="text-xs leading-none">{emoji}</span>
                                    <span className="text-[10px] leading-none opacity-90">{userIds.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Action buttons (React, Reply & Delete) on hover / touch */}
                        <div className="relative flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition shrink-0">
                          {!m.deletedForEveryone && (
                            <>
                              <button
                                onClick={() => setActiveReactionPickerMsgId(activeReactionPickerMsgId === m.id ? null : m.id)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  activeReactionPickerMsgId === m.id
                                    ? 'text-amber-400 bg-zinc-800'
                                    : 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/80'
                                }`}
                                title="React with emoji"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>

                              {/* Quick Reaction Picker Popover */}
                              <AnimatePresence>
                                {activeReactionPickerMsgId === m.id && (
                                  <motion.div
                                    initial={{ scale: 0.85, opacity: 0, y: 5 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.85, opacity: 0, y: 5 }}
                                    className={`absolute bottom-full mb-1.5 z-30 flex items-center gap-1 p-1.5 bg-zinc-900 border border-zinc-700/90 rounded-full shadow-2xl backdrop-blur-md ${
                                      isCurrentUser ? 'right-0' : 'left-0'
                                    }`}
                                  >
                                    {QUICK_EMOJIS.map((emoji) => {
                                      const hasReacted = m.reactions?.[emoji]?.includes(currentUser.id);
                                      return (
                                        <button
                                          key={emoji}
                                          onClick={() => handleToggleReaction(m.id, emoji)}
                                          className={`p-1.5 hover:scale-125 rounded-full transition cursor-pointer text-base leading-none select-none ${
                                            hasReacted ? 'bg-indigo-500/30 text-indigo-300 scale-110' : 'hover:bg-zinc-800'
                                          }`}
                                          title={`React with ${emoji}`}
                                        >
                                          {emoji}
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <button
                                onClick={() => setReplyingTo(m)}
                                className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800/80 rounded-lg transition cursor-pointer"
                                title="Reply to message"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setForwardModalMsg(m);
                                  setSelectedForwardContactIds([]);
                                  setForwardSearchQuery('');
                                }}
                                className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/80 rounded-lg transition cursor-pointer"
                                title="Forward message"
                              >
                                <Forward className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteModalMsg(m)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition cursor-pointer"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Text Input Footer */}
            <div className="border-t border-zinc-800 bg-zinc-950/80 flex flex-col sticky bottom-0 z-10 shrink-0">
              {/* Upload Error Banner */}
              {fileUploadError && (
                <div className="px-3.5 py-2 bg-rose-950/80 border-b border-rose-800/60 text-rose-300 text-[11px] flex items-center justify-between animate-fade-in">
                  <span className="flex items-center gap-1.5 font-medium">⚠️ {fileUploadError}</span>
                  <button 
                    onClick={() => setFileUploadError(null)} 
                    className="p-0.5 text-rose-300 hover:text-white rounded transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Upload Progress Banner */}
              {isUploadingFile && (
                <div className="px-3.5 py-2 bg-violet-950/80 border-b border-violet-800/60 text-lavender-300 text-[11px] flex items-center gap-2 animate-fade-in">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-violet-400" />
                  <span className="font-medium">{uploadProgressText || 'Uploading attachment to storage...'}</span>
                </div>
              )}

              {/* Reply Preview Bar */}
              {replyingTo && (
                <div className="px-3.5 py-2 bg-surface-base border-b border-white/5 flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-2 min-w-0 border-l-2 border-violet-500 pl-2">
                    <CornerUpLeft className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-violet-400 leading-tight">
                        Replying to {replyingTo.senderId === currentUser.id ? 'yourself' : activeContact?.name || 'User'}
                      </p>
                      <p className="text-[11px] text-text-sub truncate max-w-sm sm:max-w-md leading-tight mt-0.5">
                        {replyingTo.text || (replyingTo.fileName ? `📎 ${replyingTo.fileName}` : 'Attachment')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-text-dim hover:text-white hover:bg-surface-interactive rounded-lg transition shrink-0 cursor-pointer"
                    title="Cancel reply"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-2.5 sm:p-3 flex items-center gap-2 bg-surface-raised">
                {isRecordingAudio ? (
                  <div className="flex-1 flex items-center justify-between gap-3 bg-surface-base border border-white/10 rounded-2xl px-3 py-1.5 animate-fade-in">
                    <button
                      type="button"
                      onClick={cancelAudioRecording}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                      title="Discard recording"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-rose-900/40">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {Math.floor(recordingDuration / 60)}:{recordingDuration % 60 < 10 ? '0' : ''}{recordingDuration % 60}
                      </span>
                      <span className="text-[10px] text-text-dim font-mono">/ 2:00</span>
                    </div>

                    <button
                      type="button"
                      onClick={stopAndSendAudioRecording}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title="Send voice note"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile}
                      className={`p-2 rounded-xl transition shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border-0 bg-transparent ${
                        isUploadingFile 
                          ? 'opacity-50 cursor-not-allowed text-text-muted' 
                          : 'text-text-dim hover:text-white hover:bg-surface-interactive'
                      }`}
                      title="Attach file or image (Max 10MB)"
                    >
                      {isUploadingFile ? (
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </button>

                    <input
                      type="text"
                      placeholder={isUploadingFile ? "Uploading file..." : "Type your message..."}
                      value={inputText}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                      className="flex-1 min-w-0 bg-surface-base border border-white/10 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-text-dim"
                    />

                    <button
                      type="button"
                      onClick={startAudioRecording}
                      disabled={isUploadingFile}
                      className="p-2 text-text-dim hover:text-violet-400 hover:bg-surface-interactive rounded-xl transition shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border-0 bg-transparent"
                      title="Record voice note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage(inputText)}
                      disabled={isUploadingFile || !inputText.trim()}
                      className={`p-2.5 sm:p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-600/20 transition shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border-0 ${
                        isUploadingFile || !inputText.trim() ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title="Send message"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
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
                  : "Select a partner from the left sidebar to coordinate barter sessions."
              }
            />
          </div>
        )}

        {/* Delete Message Modal Dialog */}
        <AnimatePresence>
          {deleteModalMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
              onClick={() => setDeleteModalMsg(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-zinc-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 text-rose-400">
                    <Trash2 className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-sm text-white">Delete message?</h3>
                  </div>
                  <button
                    onClick={() => setDeleteModalMsg(null)}
                    className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60 text-xs text-zinc-400 italic truncate">
                  "{deleteModalMsg.deletedForEveryone ? 'This message was deleted' : deleteModalMsg.text || deleteModalMsg.fileName || 'Attachment'}"
                </div>

                <div className="space-y-2 pt-1">
                  {/* Delete for me */}
                  <button
                    onClick={() => handleDeleteForMe(deleteModalMsg)}
                    className="w-full text-left px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div>Delete for me</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Hides only in your chat view</div>
                    </div>
                  </button>

                  {/* Delete for everyone (available if current user is sender and sent < 1 hour ago) */}
                  {(() => {
                    const isSender = deleteModalMsg.senderId === currentUser.id;
                    const diffMs = Date.now() - new Date(deleteModalMsg.timestamp).getTime();
                    const isWithin1Hour = diffMs < 3600 * 1000;
                    const canDeleteEveryone = isSender && isWithin1Hour && !deleteModalMsg.deletedForEveryone;

                    return (
                      <button
                        disabled={!canDeleteEveryone}
                        onClick={() => handleDeleteForEveryone(deleteModalMsg)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                          canDeleteEveryone
                            ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 cursor-pointer'
                            : 'bg-zinc-800/40 text-zinc-500 border border-zinc-800/50 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div>
                          <div>Delete for everyone</div>
                          {!isSender ? (
                            <div className="text-[10px] opacity-75 font-normal">Only available for messages sent by you</div>
                          ) : !isWithin1Hour ? (
                            <div className="text-[10px] opacity-75 font-normal">Available only within 1 hour of sending</div>
                          ) : deleteModalMsg.deletedForEveryone ? (
                            <div className="text-[10px] opacity-75 font-normal">Already deleted for everyone</div>
                          ) : (
                            <div className="text-[10px] opacity-75 font-normal">Replaces message for both participants</div>
                          )}
                        </div>
                      </button>
                    );
                  })()}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setDeleteModalMsg(null)}
                    className="px-4 py-2 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forward Message Modal */}
        <AnimatePresence>
          {forwardModalMsg && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl flex flex-col max-h-[85vh]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Forward className="w-4 h-4 text-indigo-400" />
                      <span>Forward message to...</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[280px]">
                      {forwardModalMsg.text || forwardModalMsg.fileName || 'Voice Note'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForwardModalMsg(null);
                      setSelectedForwardContactIds([]);
                      setForwardSearchQuery('');
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contact Search Input */}
                <div className="my-3">
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                    <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={forwardSearchQuery}
                      onChange={(e) => setForwardSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none placeholder:text-zinc-600 text-xs"
                    />
                    {forwardSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setForwardSearchQuery('')}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 my-1 pr-1 min-h-[160px] max-h-[280px]">
                  {contacts
                    .filter((c) => c.id !== currentUser.id)
                    .filter((c) =>
                      c.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()) ||
                      (c.bio && c.bio.toLowerCase().includes(forwardSearchQuery.toLowerCase()))
                    )
                    .map((contact) => {
                      const isSelected = selectedForwardContactIds.includes(contact.id);
                      return (
                        <div
                          key={contact.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedForwardContactIds((prev) => prev.filter((id) => id !== contact.id));
                            } else {
                              setSelectedForwardContactIds((prev) => [...prev, contact.id]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500/80 text-white'
                              : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                              alt={contact.name}
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-700"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-xs truncate text-white">{contact.name}</p>
                              <p className="text-[10px] text-zinc-400 truncate">{contact.bio || contact.skillsOffered?.[0]?.name || 'Member'}</p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                            isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-zinc-700 bg-zinc-900'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3 mt-2">
                  <span className="text-xs text-zinc-400 font-medium">
                    {selectedForwardContactIds.length === 0
                      ? 'Select contacts'
                      : `${selectedForwardContactIds.length} selected`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForwardModalMsg(null);
                        setSelectedForwardContactIds([]);
                        setForwardSearchQuery('');
                      }}
                      className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteForward}
                      disabled={selectedForwardContactIds.length === 0 || isSendingForward}
                      className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5 ${
                        selectedForwardContactIds.length === 0 || isSendingForward ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSendingForward ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Forwarding...</span>
                        </>
                      ) : (
                        <>
                          <Forward className="w-3.5 h-3.5" />
                          <span>Forward ({selectedForwardContactIds.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Chat Confirmation Modal */}
        <AnimatePresence>
          {deleteChatModalContact && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 text-rose-400 mb-3">
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <Trash2 className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Delete Chat</h3>
                    <p className="text-[11px] text-zinc-400">Clear chat from direct contacts</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                  Delete this chat with <span className="font-bold text-white">{deleteChatModalContact.name}</span>? This will hide the conversation from your chat list until a new message is sent.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDeleteChatModalContact(null)}
                    className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteChat(deleteChatModalContact.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Chat</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Image Lightbox Preview Modal */}
        <AnimatePresence>
          {previewImageModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setPreviewImageModal(null)}
            >
              <div 
                className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setPreviewImageModal(null)}
                  className="absolute -top-10 right-0 p-1.5 text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-full transition cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
                <img 
                  src={previewImageModal.url} 
                  alt={previewImageModal.name} 
                  referrerPolicy="no-referrer"
                  className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-zinc-800"
                />
                <div className="mt-3 flex items-center justify-between gap-4 text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-xl w-full max-w-lg">
                  <span className="font-semibold truncate max-w-xs">{previewImageModal.name}</span>
                  <a
                    href={previewImageModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={previewImageModal.name}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 text-xs transition shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Original
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
});

export default ChatView;
