import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { socket } from "../services/socket";
import apiFetch from "../services/apiFetch";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasJoined = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiFetch.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications();

    if (!hasJoined.current) {
      socket.connect();
      socket.emit("join_user_room", user.id);
      hasJoined.current = true;
    }

    const handleNewNotification = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.disconnect();
      hasJoined.current = false;
    };
  }, [isAuthenticated, user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
