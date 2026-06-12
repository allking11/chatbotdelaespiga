"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  CheckCheck,
  RotateCcw
} from "lucide-react";

// Types for Chat Messages
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

// Global counter for react purity-rule compliance
let globalMessageCounter = 0;
const generateUniqueId = (prefix: string) => {
  globalMessageCounter += 1;
  return `${prefix}-${globalMessageCounter}`;
};

export default function ChatbotDemoPage() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Chat message history
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set isMounted to true on client mount safely and load history
  useEffect(() => {
    const savedMsg = localStorage.getItem("espiga_de_oro_chat");
    if (savedMsg) {
      try {
        const parsed = JSON.parse(savedMsg);
        setTimeout(() => setMessages(parsed), 0);
      } catch (error) {
        console.error("Failed to parse local storage messages", error);
      }
    }
    
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("espiga_de_oro_chat", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Send message action
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userText = textToSend;
    setInputText("");

    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = generateUniqueId("user-msg");

    // Add user message to state
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: userText,
        time: timeNow,
      },
    ]);

    // Set typing status
    setIsTyping(true);

    try {
      // Build conversation history
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Send query to API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatHistory,
        }),
      });

      const data = await response.json();

      setIsTyping(false);

      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateUniqueId("reply-err"),
            role: "assistant",
            content: `⚠️ Error de conexión: ${data.error}. Por favor reintenta en unos instantes.`,
            time: replyTime,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: generateUniqueId("reply-ok"),
            role: "assistant",
            content: data.reply,
            time: replyTime,
          },
        ]);
      }
    } catch {
      setIsTyping(false);
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          id: generateUniqueId("reply-net-err"),
          role: "assistant",
          content: "⚠️ Error de red. Asegúrate de tener conexión y de que las variables de entorno estén configuradas en AI Studio.",
          time: replyTime,
        },
      ]);
    }
  };

  // Helper formatting markdown bold symbols
  const formatMessage = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      const parts = line.split(/(\*\*|__|\*)/g);
      let isBold = false;
      const parsedLine = parts.map((part, partIdx) => {
        if (part === "**" || part === "__" || part === "*") {
          isBold = !isBold;
          return null;
        }
        return isBold ? <strong key={partIdx} className="font-semibold">{part}</strong> : part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {parsedLine}
          {lineIdx < text.split("\n").length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleResetChat = () => {
    setMessages([]);
    localStorage.removeItem("espiga_de_oro_chat");
  };

  // Pre-load loading screen during hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-2xl animate-bounce">
          <span>🌾</span>
        </div>
        <div className="text-slate-400 font-medium text-xs tracking-wider animate-pulse">Cargando Chatbot Espiga de Oro...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden antialiased selection:bg-teal-500 selection:text-slate-900">
      
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 overflow-hidden flex items-center justify-center shadow-lg shadow-amber-500/20 relative">
            <Image
              src="/heroo2.png"
              alt="Logo Espiga de Oro"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Espiga de Oro
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Canal Oficial de WhatsApp (Simulador)</p>
            <p className="text-[10px] text-teal-400 sm:hidden flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping inline-block"></span>
              WhatsApp simulator en vivo
            </p>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetChat}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs transition-colors active:scale-95"
            title="Reiniciar chat"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reiniciar Chat</span>
          </button>
        </div>
      </nav>

      {/* Centered Main Layout */}
      <main className="flex-1 max-w-[560px] w-full mx-auto px-2 py-4 lg:p-6 flex flex-col justify-center items-center">
        
        <div className="w-full flex flex-col md:bg-slate-900 md:border md:border-slate-800 md:rounded-3xl overflow-hidden md:shadow-2xl shadow-slate-950/40 lg:min-h-[640px] h-[calc(100vh-100px)] md:h-[720px] relative">
          
          {/* Right panel: Smartphone simulator */}
          <div className="flex-1 flex flex-col justify-between bg-slate-950 relative">
            
            {/* WhatsApp UI Header */}
            <div className="bg-[#075E54] text-white px-3 py-2.5 flex items-center justify-between shadow-md shrink-0 select-none relative z-20">
              
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-amber-500 border-2 border-white/90 overflow-hidden flex items-center justify-center font-bold text-lg shadow text-slate-900 pointer-events-none select-none relative">
                    <Image
                      src="/heroo2.png"
                      alt="WhatsApp Avatar"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25d366] border-2 border-[#075E54]"></span>
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm tracking-wide">Espiga de Oro</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {isTyping ? (
                      <motion.span
                        key="typing"
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        className="text-[11px] text-emerald-200 font-medium block"
                      >
                        escribiendo...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="online"
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        className="text-[11px] text-emerald-100 opacity-90 block"
                      >
                        en línea
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 text-white/90">
                <Video className="w-4 h-4 cursor-not-allowed opacity-60 hover:opacity-100 transition-opacity" />
                <Phone className="w-4 h-4 cursor-not-allowed opacity-60 hover:opacity-100 transition-opacity" />
                <MoreVertical className="w-4 h-4 cursor-not-allowed opacity-60 hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Chat Messages flow container */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative flex flex-col"
              style={{
                backgroundColor: "#efeae2",
                backgroundImage: "url('/whatsapp_bg.svg')",
                backgroundRepeat: "repeat",
                backgroundSize: "120px 120px",
              }}
            >
              
              {/* WhatsApp Encrypted message box */}
              <div className="self-center bg-amber-100/90 border border-amber-200/50 rounded-lg py-1 px-3 text-center max-w-[90%] text-[10px] text-amber-900 shadow-sm leading-relaxed mb-3 select-none pointer-events-none">
                🔒 Los mensajes y llamadas están cifrados de extremo a extremo. Nadie fuera de este chat, ni siquiera WhatsApp, puede leerlos ni escucharlos.
              </div>

              <div className="flex-1 space-y-3.5">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === "user";

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`relative max-w-[82%] px-3 py-2 rounded-xl text-sm shadow-sm leading-relaxed ${
                          isUser
                            ? "bg-[#d9fdd3] text-stone-900 rounded-tr-none border-l-2 border-[#25d366]"
                            : "bg-white text-stone-900 rounded-tl-none border-l-2 border-slate-300"
                        }`}
                      >
                        {/* Peaking arrow of WhatsApp chat bubbles */}
                        <div
                          className={`absolute top-0 w-2.5 h-2.5 overflow-hidden ${
                            isUser
                              ? "left-full -ml-[1px] text-[#d9fdd3]"
                              : "right-full -mr-[1px] text-white"
                          }`}
                        >
                          <svg viewBox="0 0 8 8" className="w-full h-full fill-current">
                            {isUser ? (
                              <path d="M0 0 C 4 0, 8 4, 8 8 L 8 0 Z" />
                            ) : (
                              <path d="M8 0 C 4 0, 0 4, 0 8 L 0 0 Z" />
                            )}
                          </svg>
                        </div>

                        <div className="whitespace-pre-line text-stone-800 text-[13px] leading-relaxed">
                          {formatMessage(msg.content)}
                        </div>

                        <div className="text-[9.5px] text-stone-500 text-right mt-1 select-none flex items-center justify-end space-x-1">
                          <span>{msg.time}</span>
                          {isUser && (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline-block shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Escribiendo animations */}
                {isTyping && (
                  <div className="flex w-full justify-start animate-fade-in">
                    <div className="relative max-w-[70%] bg-white px-4 py-3 rounded-xl text-stone-900 rounded-tl-none shadow-sm flex items-center space-x-1">
                      <div className="absolute top-0 right-full -mr-[1px] text-white w-2.5 h-2.5">
                        <svg viewBox="0 0 8 8" className="w-full h-full fill-current">
                          <path d="M8 0 C 4 0, 0 4, 0 8 L 0 0 Z" />
                        </svg>
                      </div>
                      <span className="text-[11.5px] text-[#075E54] font-bold tracking-tight mr-1 animate-pulse">
                        Escribiendo...
                      </span>
                      <div className="flex space-x-1 pt-1 ml-1 select-none pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Simulated Keyboard / Chat input pill area */}
            <div className="bg-[#f0f2f5] p-2 flex items-center space-x-2 border-t border-stone-200 shrink-0 select-none relative z-10">
              
              <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center space-x-2.5 border border-stone-100 shadow-xs">
                <Smile className="w-5 h-5 text-stone-500 hover:text-stone-700 cursor-not-allowed shrink-0" />
                
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputText);
                    }
                  }}
                  placeholder="Escribe un mensaje aquí..."
                  disabled={isTyping}
                  className="w-full bg-transparent focus:outline-none text-[13px] text-stone-800 placeholder-stone-400"
                  id="input-whatsapp"
                />

                <Paperclip className="w-5 h-5 text-stone-500 hover:text-stone-700 cursor-not-allowed rotate-45 shrink-0" />
              </div>

              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isTyping}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow transition-all ${
                  !inputText.trim() || isTyping
                    ? "bg-stone-300 text-stone-500 cursor-not-allowed scale-95"
                    : "bg-[#00a884] hover:bg-[#008f72] text-white active:scale-95 relative"
                }`}
                id="btn-whatsapp-send"
              >
                <Send className="w-4.5 h-4.5 translate-x-[1px]" />
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
