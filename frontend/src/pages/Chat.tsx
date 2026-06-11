import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Send, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import apiFetch from "../services/apiFetch";
import { socket } from "../services/socket";
import { RootState } from "../app/store";

interface Message {
  _id: string;
  sender: string | { _id: string; profile: { name: string } };
  text: string;
  createdAt: string;
}

const Chat = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !bookingId) return;

    const fetchHistory = async () => {
      try {
        const response = await apiFetch.get(`/bookings/chat/${bookingId}`);
        setMessages(response.data.messages);
      } catch {
        toast.error("Failed to load conversation history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    socket.connect();
    socket.emit("join_room", bookingId);

    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user_typing", (data: { userName: string }) => {
      setTypingUser(data.userName);
    });

    socket.on("user_stopped_typing", () => {
      setTypingUser("");
    });

    socket.on("error", (err: { message: string }) => {
      if (err?.message) {
        toast.error(err.message);
      }
    });

    socket.on("connect_error", () => {
      toast.error("Connection lost. Trying to reconnect...");
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
      socket.off("error");
      socket.off("connect_error");
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [bookingId, user]);

  const handleTyping = () => {
    if (!user || !bookingId) return;

    socket.emit("typing", { bookingId, userName: user.name || "Someone" });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { bookingId });
    }, 2000);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || !bookingId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("stop_typing", { bookingId });

    const messagePayload = {
      bookingId,
      senderId: user.id,
      text: newMessage.trim(),
    };

    socket.emit("send_message", messagePayload);

    const optimisticMessage: Message = {
      _id: Date.now().toString(),
      sender: user.id,
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
  };

  const isMyMessage = (sender: any) => {
    const senderId = typeof sender === "string" ? sender : sender._id;
    return senderId === user?.id;
  };

  if (loading) {
    return (
      <div className="mx-auto flex h-[80vh] max-w-4xl items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-4xl flex-col bg-gray-50 border-x">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Conversation</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-green-600" /> End-to-end encrypted
            </p>
          </div>
        </div>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="text-center text-xs text-gray-400 font-medium my-4">
          This is the beginning of your conversation.
        </div>

        {messages.map((msg) => {
          const mine = isMyMessage(msg.sender);
          return (
            <div
              key={msg._id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl ${
                  mine
                    ? "bg-gray-900 text-white rounded-br-sm"
                    : "bg-white border text-gray-900 shadow-sm rounded-bl-sm"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 text-right ${mine ? "text-rose-200" : "text-gray-400"}`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingUser && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white border shadow-sm px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{typingUser}</span>
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="border-t bg-white p-4">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3 rounded-full border bg-gray-50 p-2 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500 transition"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white transition hover:bg-black disabled:opacity-50"
          >
            <Send className="h-4 w-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
