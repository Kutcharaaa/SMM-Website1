"use client";

import { supabase } from "@/lib/supabase";
import {
  Headphones,
  Loader2,
  LogIn,
  MessageCircle,
  Minimize2,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Conversation = {
  id: string;
  user_id: string;
  subject: string | null;
  status: string | null;
  last_message: string | null;
  last_sender_role: string | null;
  created_at: string;
  updated_at: string | null;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
};

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [messageText, setMessageText] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id || null);
      setCheckingUser(false);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setCheckingUser(false);

      if (!session?.user?.id) {
        setConversation(null);
        setMessages([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open || !userId) return;

    loadOrCreateConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`live-chat-widget-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          loadMessages(conversation.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_conversations",
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          setConversation(payload.new as Conversation);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open, minimized]);

  async function loadMessages(conversationId: string) {
    const { data: messageData, error: messageError } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.warn("LIVE_CHAT_MESSAGES_LOAD_ERROR:", messageError.message);
      setErrorMessage(messageError.message);
      setMessages([]);
      return;
    }

    setMessages((messageData || []) as ChatMessage[]);

    const adminUnreadIds = (messageData || [])
      .filter(
        (item) =>
          String(item.sender_role || "").toLowerCase() === "admin" &&
          item.is_read === false,
      )
      .map((item) => item.id);

    if (adminUnreadIds.length > 0) {
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .in("id", adminUnreadIds);
    }
  }

  async function loadOrCreateConversation() {
    if (!userId) return;

    setLoadingChat(true);
    setErrorMessage("");

    const { data: existingConversation, error: existingError } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "closed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.warn("LIVE_CHAT_CONVERSATION_LOAD_ERROR:", existingError.message);
      setErrorMessage(existingError.message);
    }

    let activeConversation = existingConversation as Conversation | null;

    if (!activeConversation) {
      const now = new Date().toISOString();

      const { data: createdConversation, error: createError } = await supabase
        .from("support_conversations")
        .insert({
          user_id: userId,
          subject: "Live Chat",
          status: "open",
          last_message: "Conversation started",
          last_sender_role: "user",
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();

      if (createError) {
        console.warn("LIVE_CHAT_CONVERSATION_CREATE_ERROR:", createError.message);
        setErrorMessage(createError.message);
        setLoadingChat(false);
        return;
      }

      activeConversation = createdConversation as Conversation;
    }

    setConversation(activeConversation);
    await loadMessages(activeConversation.id);

    setLoadingChat(false);
  }

  async function sendMessage() {
    const cleanMessage = messageText.trim();

    if (!cleanMessage || !conversation?.id || !userId || sending) return;

    setSending(true);
    setErrorMessage("");
    setMessageText("");

    const now = new Date().toISOString();

    const { data: newMessage, error: messageError } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        sender_role: "user",
        message: cleanMessage,
        is_read: false,
        created_at: now,
      })
      .select("*")
      .single();

    if (messageError) {
      console.warn("LIVE_CHAT_SEND_ERROR:", messageError.message);
      setErrorMessage(messageError.message);
      setMessageText(cleanMessage);
      setSending(false);
      return;
    }

    setMessages((current) => {
      const exists = current.some((item) => item.id === newMessage.id);
      if (exists) return current;
      return [...current, newMessage as ChatMessage];
    });

    const { data: updatedConversation, error: conversationError } = await supabase
      .from("support_conversations")
      .update({
        status: "open",
        last_message: cleanMessage,
        last_sender_role: "user",
        updated_at: now,
      })
      .eq("id", conversation.id)
      .select("*")
      .single();

    if (conversationError) {
      console.warn(
        "LIVE_CHAT_CONVERSATION_UPDATE_ERROR:",
        conversationError.message,
      );
    } else if (updatedConversation) {
      setConversation(updatedConversation as Conversation);
    }

    setSending(false);
  }

  function formatTime(value: string) {
    if (!value) return "";

    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-[90] flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-600/30 transition hover:-translate-y-1 hover:bg-blue-700"
        >
          <MessageCircle size={30} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[90] w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-blue-950/20">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Headphones size={23} />
              </div>

              <div>
                <h3 className="text-base font-black">Ascend Live Chat</h3>
                <p className="text-xs font-semibold text-blue-100">
                  We usually reply as soon as possible
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMinimized(!minimized)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              >
                <Minimize2 size={17} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="h-[390px] overflow-y-auto bg-slate-50 p-4">
                {checkingUser ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto animate-spin text-blue-600" />
                      <p className="mt-3 text-sm font-bold text-slate-500">
                        Checking session...
                      </p>
                    </div>
                  </div>
                ) : !userId ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <LogIn size={26} />
                      </div>

                      <h4 className="mt-4 text-lg font-black text-slate-950">
                        Login Required
                      </h4>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Please login or create an account to start live chat.
                      </p>

                      <div className="mt-5 flex gap-3">
                        <Link
                          href="/login"
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                        >
                          Login
                        </Link>

                        <Link
                          href="/register"
                          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : loadingChat ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto animate-spin text-blue-600" />
                      <p className="mt-3 text-sm font-bold text-slate-500">
                        Loading chat...
                      </p>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <X size={26} />
                      </div>

                      <h4 className="mt-4 text-lg font-black text-slate-950">
                        Live chat error
                      </h4>

                      <p className="mt-2 text-sm font-semibold leading-6 text-red-600">
                        {errorMessage}
                      </p>

                      <button
                        type="button"
                        onClick={loadOrCreateConversation}
                        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : messages.length <= 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <MessageCircle size={26} />
                      </div>

                      <h4 className="mt-4 text-lg font-black text-slate-950">
                        Start a conversation
                      </h4>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Send us your question and our support team will reply.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((item) => {
                      const isUser =
                        String(item.sender_role || "").toLowerCase() === "user";

                      return (
                        <div
                          key={item.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                              isUser
                                ? "rounded-br-md bg-blue-600 text-white"
                                : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{item.message}</p>

                            <p
                              className={`mt-1 text-[10px] font-bold ${
                                isUser ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {isUser ? "You" : "Support"} •{" "}
                              {formatTime(item.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                {!userId ? (
                  <p className="text-center text-xs font-bold text-slate-400">
                    Login to send a message.
                  </p>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !messageText.trim()}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
