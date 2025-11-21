'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Phone, MoreVertical, Paperclip, Play, X } from 'lucide-react';
import { ChatMessage } from '../../types';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', senderId: 'p1', text: "Hi there! I saw you were looking for a plumber. How can I help?", timestamp: new Date(Date.now() - 100000), isMe: false },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      text: inputText,
      timestamp: new Date(),
      isMe: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsTyping(true);

    // call server-side API to generate reply
    try {
      const resp = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', history: messages.map(m => m.text || ''), message: newMessage.text })
      });
      const data = await resp.json();
      const replyText = data.reply || 'Sorry, I could not reply.';

      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: 'p1',
        text: replyText,
        timestamp: new Date(),
        isMe: false
      };
      setMessages(prev => [...prev, replyMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      const audioMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        audioUrl: 'mock_audio.mp3',
        timestamp: new Date(),
        isMe: true
      };
      setMessages(prev => [...prev, audioMsg]);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-100 flex">
      <div className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="p-3 bg-blue-50 border-l-4 border-blue-600 cursor-pointer hover:bg-gray-50 transition">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-900">Mike The Plumber</span>
              <span className="text-xs text-gray-500">Now</span>
            </div>
            <p className="text-sm text-gray-600 truncate">I can be there in 30 mins.</p>
          </div>
          <div className="p-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-900">Bright Spark Electric</span>
              <span className="text-xs text-gray-500">Yesterday</span>
            </div>
            <p className="text-sm text-gray-500 truncate">Thanks for the inquiry.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50 relative">
        <div className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="https://picsum.photos/id/64/100/100" alt="Mike" className="w-10 h-10 rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-none">Mike The Plumber</h3>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
                {msg.audioUrl ? (
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <button className={`p-2 rounded-full ${msg.isMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <div className="flex-1 space-y-1">
                       <div className={`h-1 rounded-full w-full ${msg.isMe ? 'bg-blue-400' : 'bg-gray-200'}`}>
                         <div className={`h-1 rounded-full w-1/3 ${msg.isMe ? 'bg-white' : 'bg-gray-400'}`} />
                       </div>
                       <span className="text-[10px] opacity-80">0:12</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm md:text-base">{msg.text}</p>
                )}
                <span className={`text-[10px] block mt-1 text-right ${msg.isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                 <div className="flex gap-1">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white p-4 border-t border-gray-200">
          {isRecording ? (
            <div className="flex items-center justify-between bg-red-50 text-red-600 px-4 py-3 rounded-xl animate-pulse">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                 <span className="font-bold">Recording Audio... 0:04</span>
              </div>
              <button onClick={handleRecordToggle} className="bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full hidden sm:block">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-gray-700"
                />
              </div>
              {inputText.trim() ? (
                 <button
                   onClick={handleSend}
                   className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md transition-transform hover:scale-105"
                 >
                   <Send className="w-5 h-5" />
                 </button>
              ) : (
                 <button
                   onClick={handleRecordToggle}
                   className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
                 >
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
