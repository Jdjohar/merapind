// app/chat/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { Send, Mic, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

type ServerMsg = {
  _id?: string;
  chatId?: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  createdAt?: string;
  tempId?: string;
};

type UIMessage = {
  id: string; // either server _id or tempId
  senderId: string;
  text?: string;
  audioUrl?: string;
  timestamp: string;
  isMe: boolean;
  // local only
  localBlobUrl?: string; // for optimistic audio playback
};

type ChatSummary = {
  _id: string;
  userId?: any;
  providerId?: any;
  lastMessage?: string;
  lastTimestamp?: string;
  user?: { _id?: string; name?: string };
  provider?: { _id?: string; name?: string; imageUrl?: string };
};

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const providerId = (searchParams?.get('providerId') as string) || '';
  const chatIdFromQuery = (searchParams?.get('chatId') as string) || '';

  const [chat, setChat] = useState<{ _id: string } | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // helpers
  const getTokenFromStorage = () => {
    try {
      return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
    } catch {
      return null;
    }
  };

  const parseJwt = (token?: string | null) => {
    try {
      if (!token) return null;
      const b = token.split('.')[1];
      if (!b) return null;
      const base64 = b.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const getMyUserIdFromToken = (): string | null => {
    try {
      const token = getTokenFromStorage();
      if (!token) return null;
      const p = token.split('.')[1];
      if (!p) return null;
      const payload = JSON.parse(atob(p));
      return payload.id || payload._id || null;
    } catch {
      return null;
    }
  };

  const convertServerMsg = (m: ServerMsg): UIMessage => ({
    id: m._id ?? m.tempId ?? `${Math.random().toString(36).slice(2)}`,
    senderId: m.senderId,
    text: m.text,
    audioUrl: m.audioUrl,
    timestamp: m.createdAt ?? new Date().toISOString(),
    isMe: getMyUserIdFromToken() === m.senderId,
  });

 const scrollToBottom = (opts: { smooth?: boolean; force?: boolean } = {}) => {
  const smooth = opts.smooth ?? true;
  const force = opts.force ?? false;
  const el = messagesEndRef.current;
  if (!el) return;

  // messagesEndRef is an empty div at the end of the list.
  // we'll use scrollIntoView for simplicity.
  try {
    if (smooth) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      el.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  } catch {
    // fallback: try container scrollTop manipulation
    const container = el.parentElement;
    if (container) {
      if (force) container.scrollTop = container.scrollHeight;
      else container.scrollTop = container.scrollHeight;
    }
  }
};
const containerRef = useRef<HTMLDivElement | null>(null);
const userNearBottomRef = useRef(true);
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const onScroll = () => {
    const threshold = 150; // px from bottom to still be considered "near bottom"
    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    userNearBottomRef.current = distanceFromBottom < threshold;
  };

  // initial compute
  onScroll();
  container.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    container.removeEventListener('scroll', onScroll);
  };
}, []);

// 3) Auto-scroll when messages change — but only if user is near bottom.
// If you want to always jump to latest (e.g., when opening a chat) pass force = true below.
useEffect(() => {
  // run on next paint so DOM nodes exist
  requestAnimationFrame(() => {
    if (userNearBottomRef.current) {
      scrollToBottom({ smooth: true });
    }
  });
}, [messages.length]); // triggers whenever messages change

// 4) When opening a chat (chat._id changes) force-scroll to bottom
useEffect(() => {
  if (!chat) return;
  // give the fetch & render a micro tick (or two) then force-scroll
  const id = setTimeout(() => {
    scrollToBottom({ smooth: false, force: true });
  }, 50);
  return () => clearTimeout(id);
}, [chat?._id]);


  // Fetch chat summaries (for left sidebar) and auto-join rooms
  async function fetchChatsAndJoin() {
    try {
      const tokenNow = getTokenFromStorage();
      const res = await fetch(`${BACKEND}/api/chats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(tokenNow ? { Authorization: `Bearer ${tokenNow}` } : {}),
        },
      });
      if (!res.ok) {
        console.warn('Failed to fetch chats', res.status);
        setChats([]);
        return;
      }
      const json = await res.json();
      const arr = Array.isArray(json) ? json : Array.isArray(json?.chats) ? json.chats : [];
      setChats(arr);

      // join rooms for each chat (so provider receives messages)
      for (const c of arr) {
        const cid = c._id || (c as any).id;
        if (cid && socket?.emit) {
          socket.emit('join_chat', cid);
        }
      }
    } catch (err) {
      console.warn('fetchChatsAndJoin failed', err);
      setChats([]);
    }
  }

  // Initialize socket once
  useEffect(() => {
    if (socket) return;

    const tokenNow = getTokenFromStorage();

    socket = io(BACKEND, {
      transports: ['websocket'],
      auth: { token: tokenNow },
    });

    socket.on('connect', async () => {
      console.log('socket connected', socket?.id);

      // ensure we have a single handler and it can reconcile tempId
      socket?.off('receive_message');
      socket?.on('receive_message', (msg: ServerMsg) => {
        // server authoritative broadcast
        console.debug('receive_message', msg);

        // If server included a tempId, replace local temp message
        if (msg.tempId) {
          setMessages(prev => {
            let replaced = false;
            const out = prev.map(m => {
              if (m.id === msg.tempId) {
                replaced = true;
                return convertServerMsg(msg);
              }
              return m;
            });
            // if not replaced (client didn't have temp), append if not duplicate
            if (!replaced) {
              if (msg._id && out.some(m => m.id === msg._id)) return out;
              out.push(convertServerMsg(msg));
            }
            return out;
          });
          scrollToBottom();
          // update chats preview if needed
          if (msg.chatId) {
            setChats(prev => prev.map(c => {
              if ((c._id || (c as any).id) === msg.chatId) {
                return { ...c, lastMessage: msg.text || (msg.audioUrl ? 'Audio' : ''), lastTimestamp: msg.createdAt || new Date().toISOString() };
              }
              return c;
            }));
          }
          return;
        }

        // normal flow: dedupe by _id then append
        setMessages(prev => {
          if (msg._id && prev.some(m => m.id === msg._id)) return prev;
          return [...prev, convertServerMsg(msg)];
        });
        scrollToBottom();

        // update chats preview (lastMessage, lastTimestamp)
        if (msg.chatId) {
          setChats(prev =>
            prev
              .map(c => {
                if ((c._id || (c as any).id) === msg.chatId) {
                  return { ...c, lastMessage: msg.text || (msg.audioUrl ? 'Audio' : ''), lastTimestamp: msg.createdAt || new Date().toISOString() };
                }
                return c;
              })
              .sort((a, b) => {
                const ta = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
                const tb = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
                return tb - ta;
              })
          );
        }
      });

      socket?.on('connect_error', (err: any) => {
        console.warn('socket connect_error', err);
      });

      socket?.on('disconnect', (reason) => {
        console.log('socket disconnected', reason);
      });

      // fetch chats after socket connected (so join emits work)
      await fetchChatsAndJoin();
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When providerId or chatIdFromQuery changes: create or open chat
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If providerId supplied (user initiating chat with provider), create/get chat
        if (providerId) {
          const tokenNow = getTokenFromStorage();
          const res = await fetch(`${BACKEND}/api/chats/get-or-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: tokenNow ? `Bearer ${tokenNow}` : '',
            },
            body: JSON.stringify({ providerId }),
          });
          if (!res.ok) {
            console.error('open chat failed', res.status, await res.text().catch(() => ''));
            return;
          }
          const data = await res.json();
          if (!mounted) return;
          const cid = data._id ?? data.id;
          if (cid) {
            setChat({ _id: cid });
            // join room
            if (socket?.emit) socket.emit('join_chat', cid);

            // fetch messages for that chat
            const msgsRes = await fetch(`${BACKEND}/api/chats/${cid}/messages`, {
              headers: { Authorization: tokenNow ? `Bearer ${tokenNow}` : '' },
            });
            if (msgsRes.ok) {
              const msgs: ServerMsg[] = await msgsRes.json();
              setMessages(msgs.map(convertServerMsg));
              scrollToBottom();
            }
          }
        }

        // If chatIdFromQuery supplied (provider opening existing chat), open it
        else if (chatIdFromQuery) {
          const tokenNow = getTokenFromStorage();
          const cid = chatIdFromQuery;
          setChat({ _id: cid });
          if (socket?.emit) socket.emit('join_chat', cid);

          const msgsRes = await fetch(`${BACKEND}/api/chats/${cid}/messages`, {
            headers: { Authorization: tokenNow ? `Bearer ${tokenNow}` : '' },
          });
          if (msgsRes.ok) {
            const msgs: ServerMsg[] = await msgsRes.json();
            setMessages(msgs.map(convertServerMsg));
            scrollToBottom();
          } else {
            console.warn('Could not fetch messages', msgsRes.status);
          }
        }
      } catch (err) {
        console.error('openChat error', err);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, chatIdFromQuery]);

  // Fetch chats when page loads (in case socket isn't connected yet)
  useEffect(() => {
    fetchChatsAndJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // send text message (optimistic with tempId)
  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!chat) {
      console.warn('no chat created yet');
      return;
    }
    const chatId = chat._id;

    // create temp message locally for immediate UI feedback
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tempMsg: UIMessage = {
      id: tempId,
      senderId: getMyUserIdFromToken() || 'me',
      text: inputText,
      timestamp: new Date().toISOString(),
      isMe: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();
    setInputText('');

    try {
      const tokenNow = getTokenFromStorage();
      // include tempId so server echoes it back
      const res = await fetch(`${BACKEND}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: tokenNow ? `Bearer ${tokenNow}` : '',
        },
        body: JSON.stringify({ text: tempMsg.text, tempId }),
      });

      if (!res.ok) {
        // remove temp message if server failed
        setMessages(prev => prev.filter(m => m.id !== tempId));
        const txt = await res.text().catch(() => '');
        console.error('send failed', res.status, txt);
        return;
      }

      // server will broadcast authoritative message (with tempId); server response can be used to reconcile too
      const saved: ServerMsg = await res.json();
      if (saved.tempId) {
        setMessages(prev => prev.map(m => (m.id === saved.tempId ? convertServerMsg(saved) : m)));
      } else if (saved._id) {
        // fallback: replace by temp id mapping, or append if not present
        setMessages(prev => {
          if (prev.some(m => m.id === saved._id)) return prev;
          return prev.map(m => (m.id === tempId ? convertServerMsg(saved) : m));
        });
      }
      scrollToBottom();
    } catch (err) {
      console.error('send error', err);
      // on error, remove temp message
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // upload audio and send (with optimistic local message)
  async function uploadAndSendAudio(blob: Blob) {
    if (!chat) {
      alert('No chat selected');
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const localUrl = URL.createObjectURL(blob);

    // optimistic local audio message
    const tempMsg: UIMessage = {
      id: tempId,
      senderId: getMyUserIdFromToken() || 'me',
      audioUrl: localUrl,
      localBlobUrl: localUrl,
      timestamp: new Date().toISOString(),
      isMe: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      // upload audio file to backend (Cloudinary)
      const form = new FormData();
      form.append('file', blob, 'voice.webm');
      const tokenNow = getTokenFromStorage();

      const resp = await fetch(`${BACKEND}/api/uploads/audio`, {
        method: 'POST',
        body: form,
        headers: tokenNow ? { Authorization: `Bearer ${tokenNow}` } : undefined,
      });

      if (!resp.ok) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        console.error('audio upload failed', resp.status, await resp.text().catch(() => ''));
        alert('Audio upload failed');
        return;
      }

      const upJson = await resp.json();
      const audioUrl = upJson?.audioUrl || upJson?.url || upJson?.secure_url;
      if (!audioUrl) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        console.error('upload returned no audioUrl', upJson);
        alert('Audio upload failed (no URL returned)');
        return;
      }

      // save message to DB (include tempId so server can echo it)
      const saveRes = await fetch(`${BACKEND}/api/chats/${chat._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: tokenNow ? `Bearer ${tokenNow}` : '',
        },
        body: JSON.stringify({ audioUrl, tempId }),
      });

      if (!saveRes.ok) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        console.error('audio message save failed', saveRes.status, await saveRes.text().catch(() => ''));
        alert('Failed to save audio message');
        return;
      }

      const saved: ServerMsg = await saveRes.json();

      // reconcile: server should broadcast, but if it returned saved, replace temp now
      if (saved.tempId) {
        setMessages(prev => prev.map(m => (m.id === saved.tempId ? convertServerMsg(saved) : m)));
      } else if (saved._id) {
        setMessages(prev => prev.map(m => (m.id === tempId ? convertServerMsg(saved) : m)));
      }

      // free local blob url if it was used
      try {
        URL.revokeObjectURL(localUrl);
      } catch {}
      scrollToBottom();
    } catch (err) {
      console.error('upload/send audio failed', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Upload/send audio failed');
    }
  }

  // record toggle UI - creates MediaRecorder and handles onstop -> uploadAndSendAudio
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Recording not supported in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      setMediaRecorder(mr);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // send audio with optimistic UI
        await uploadAndSendAudio(blob);
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error('record start failed', err);
      alert('Could not start recording: ' + String(err));
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-100 flex">
      {/* Left sidebar: chats */}
      <div className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        <div className="overflow-y-auto flex-1">
          {chats.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No conversations yet.</div>
          ) : (
            <ul className="divide-y">
              {chats.map(c => {
                const id = c._id || (c as any).id;
                 const otherName = (c.userId && c.userId.name) || (c.providerId && c.providerId.name) || 'Conversation';
                const last = c.lastMessage || '—';
                const time = c.lastTimestamp ? new Date(c.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const selected = chat && chat._id === id;
                return (
                  <li
                    key={id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      router.push(`/chat?chatId=${encodeURIComponent(String(id))}`);
                      // setChat will be handled by effect which reads chatIdFromQuery
                      setChat({ _id: String(id) });
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{otherName}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{last}</div>
                      </div>
                      <div className="text-xs text-gray-400">{time}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-white h-16 border-b px-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold">Chat</h3>
            <div className="text-xs text-gray-500">
              {providerId ? `Provider: ${providerId}` : chat ? `Chat: ${chat._id}` : 'No conversation selected'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${msg.isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>
                {msg.audioUrl ? (
                  <div className="min-w-[150px] flex items-center gap-3">
                    <audio controls src={msg.audioUrl} />
                    {/* show spinner if this is a temporary message (id starts with temp_) */}
                    {String(msg.id).startsWith('temp_') && (
                      <div className="ml-2 text-xs text-gray-200 flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Uploading…
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {/* spinner for optimistic text */}
                    {String(msg.id).startsWith('temp_') && (
                      <div className="text-xs text-gray-200 mt-2">Sending…</div>
                    )}
                  </>
                )}
                <div className="text-[10px] mt-1 text-right text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white p-4 border-t">
          {isRecording ? (
            <div className="flex items-center justify-between bg-red-50 text-red-600 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="font-bold">Recording...</span>
              </div>
              <button onClick={stopRecording} className="bg-white p-2 rounded-full shadow">
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-full bg-gray-100 outline-none"
              />
              {inputText.trim() ? (
                <button onClick={handleSend} className="p-3 bg-blue-600 text-white rounded-full">
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={() => (isRecording ? stopRecording() : startRecording())} className="p-3 bg-gray-200 rounded-full">
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
