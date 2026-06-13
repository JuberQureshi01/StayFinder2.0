import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import Message from "../modules/chat/message.model";
import Booking from "../modules/booking/booking.model";

export class SocketService {
  private static io: Server;

  static initialize(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS
          ? process.env.ALLOWED_ORIGINS.split(",")
          : "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket: Socket) => {
      // console.log(`🔌 Client Connected: ${socket.id}`);

      // Wrap every socket event handler in a boundary so no error escapes
      const safeOn = (event: string, handler: (...args: any[]) => void | Promise<void>) => {
        socket.on(event, async (...args: any[]) => {
          try {
            await handler(...args);
          } catch (error: any) {
            console.error(`Socket error on "${event}" (${socket.id}):`, error?.message || error);
            socket.emit("error", { message: `Failed to process ${event}` });
          }
        });
      };

      safeOn("join_room", (bookingId: string) => {
        if (!bookingId || typeof bookingId !== "string") return;
        socket.join(bookingId);
        // console.log(`Socket ${socket.id} joined Chat Room: ${bookingId}`);
      });

      safeOn("join_user_room", (userId: string) => {
        if (!userId || typeof userId !== "string") return;
        socket.join(userId);
        // console.log(`Socket ${socket.id} joined User Room: ${userId}`);
      });

      safeOn("typing", (data: { bookingId: string; userName: string }) => {
        if (!data?.bookingId || !data?.userName) return;
        socket.to(data.bookingId).emit("user_typing", { userName: data.userName });
      });

      safeOn("stop_typing", (data: { bookingId: string }) => {
        if (!data?.bookingId) return;
        socket.to(data.bookingId).emit("user_stopped_typing");
      });

      safeOn("send_message", async (data: { bookingId: string; senderId: string; text: string }) => {
        if (!data?.bookingId || !data?.senderId || !data?.text) {
          socket.emit("error", { message: "Missing required fields." });
          return;
        }

        const booking = await Booking.findById(data.bookingId);
        if (!booking) {
          socket.emit("error", { message: "Booking not found." });
          return;
        }

        const receiverId =
          booking.user.toString() === data.senderId
            ? booking.host.toString()
            : booking.user.toString();

        const newMessage = await Message.create({
          booking: data.bookingId,
          sender: data.senderId,
          receiver: receiverId,
          text: data.text,
        });

        socket.to(data.bookingId).emit("receive_message", newMessage);

        const populated = await newMessage.populate("sender", "profile.name");
        this.io.to(receiverId).emit("new_notification", {
          type: "new_message",
          title: "New Message",
          message: `${(populated.sender as any)?.profile?.name || "Someone"} sent you a message`,
          link: `/chat/${data.bookingId}`,
        });
      });

      // Track socket errors — never crash from a bad client
      socket.on("error", (err: any) => {
        console.error(`Socket ${socket.id} error:`, err?.message || err);
      });

      socket.on("disconnect", (reason: string) => {
        // console.log(`🛑 Client Disconnected: ${socket.id} (${reason})`);
      });
    });
  }

  static triggerSystemNotification(room: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(room).emit(event, payload);
    }
  }
}
