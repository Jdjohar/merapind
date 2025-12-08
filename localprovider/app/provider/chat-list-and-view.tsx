// provider/chat-list-and-view.tsx  (client component)
'use client';
import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
let socket: Socket | null = null;

type Msg = { _id?: string; chatId: string; senderId: string; text?: string; audioUrl?: string; createdAt?: string };
type Chat = { _id: string; userId: string; providerId: string; lastMessage?: string; lastTimestamp?: string };

export default function ProviderChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const messagesEndRef = useRef<HTMLDivElement|null>(null);

  const getMyId = () => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload._id;
    } catch { return null; }
  };

  // init socket once
  useEffect(() => {
    if (socket) return;
    socket = io(BACKEND, { transports: ['websocket'], auth: { token } });

    socket.on('connect', () => console.log('provider socket connected', socket?.id));
    socket.on('receive_message', (m: Msg) => {
      // if message belongs to activeChat, append; otherwise update chat list lastMessage
      setMessages(prev => {
        if (activeChat && (m.chatId === activeChat._id)) {
          if (m._id && prev.some(x => x._id === m._id)) return prev; // dedupe
          return [...prev, m];
        }
        return prev;
      });

      // update chat preview (last message/time)
      setChats(prev => prev.map(c => c._id === m.chatId ? { ...c, lastMessage: m.text || 'Audio', lastTimestamp: m.createdAt } : c));
      scrollToBottom();
    });

    return () => {
      // keep socket alive across provider navigation OR disconnect:
      // socket?.disconnect();
      // socket = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // fetch chats for provider
    (async () => {
      const res = await fetch(`${BACKEND}/api/chats`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) return console.error('Failed to load chats', await res.text());
      const data: Chat[] = await res.json();
      setChats(data);
    })();
  }, [token]);

  // when opening a chat
  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    // fetch messages
    const res = await fetch(`${BACKEND}/api/chats/${chat._id}/messages`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    });
    if (!res.ok) return console.error('failed to load messages', await res.text());
    const msgs: Msg[] = await res.json();
    setMessages(msgs);

    // join the socket room for realtime updates
    socket?.emit('join_chat', chat._id);
    // optionally join all chats:
    // chats.forEach(c => socket?.emit('join_chat', c._id));
    scrollToBottom();
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  // send message (provider)
  const sendMessage = async (text: string) => {
    if (!activeChat) return;
    const res = await fetch(`${BACKEND}/api/chats/${activeChat._id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) return console.error('send failed', await res.text());
    const saved: Msg = await res.json();
    // server should emit to room; as fallback append when socket disconnected:
    if (!socket || socket.disconnected) setMessages(prev => [...prev, saved]);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r p-4">
        <h3 className="font-bold">Conversations</h3>
        <ul>
          {chats.map(c => (
            <li key={c._id} className="py-2 cursor-pointer" onClick={() => openChat(c)}>
              <div className="font-semibold">Chat {c._id}</div>
              <div className="text-xs text-gray-500">{c.lastMessage}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1 overflow-auto">
          {messages.map(m => (
            <div key={m._id || Math.random()} className={`p-2 my-2 ${m.senderId === getMyId() ? 'text-right' : 'text-left'}`}>
              {m.text ? <div className="inline-block bg-gray-200 p-2 rounded">{m.text}</div> : <audio src={m.audioUrl} controls/>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-2">
          <MessageInput onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}

function MessageInput({ onSend } : { onSend: (t: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2">
      <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-2 border rounded" onKeyDown={e=> e.key==='Enter' && (onSend(text), setText(''))}/>
      <button onClick={()=> { onSend(text); setText(''); }} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
    </div>
  );
}
