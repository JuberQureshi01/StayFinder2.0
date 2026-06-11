import Notification, { INotification } from "../modules/notification/notification.model";
import { SocketService } from "./socket.service";

type NotificationType = INotification["type"];

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  static async send(payload: NotificationPayload) {
    const notification = await Notification.create({
      user: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
    });

    SocketService.triggerSystemNotification(payload.userId, "new_notification", notification);

    return notification;
  }

  static async sendToMultipleUsers(userIds: string[], payload: Omit<NotificationPayload, "userId">) {
    const notifications = await Notification.insertMany(
      userIds.map((userId) => ({
        user: userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
      })),
    );

    userIds.forEach((userId, idx) => {
      SocketService.triggerSystemNotification(userId, "new_notification", notifications[idx] || notifications[0]);
    });

    return notifications;
  }
}
