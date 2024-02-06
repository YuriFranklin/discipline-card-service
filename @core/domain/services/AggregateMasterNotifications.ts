import { NOTIFICATION_CODE } from "../constants/Notification";
import Master from "../entities/Master";
import Notification from "../entities/Notification";

export default class AggregateMasterNotifications {
  public execute(
    master: Master,
    notifications: Notification[]
  ): Notification[] {
    const agentsChats = notifications.map((notification) => ({
      agent: notification.toJSON().agent,
      chat: notification.toJSON().chat,
    }));

    const notificationsByAgentsChat = agentsChats.map((agentChat) => ({
      ...agentChat,
      notifications: notifications.filter(
        (notification) => notification.toJSON().agent === agentChat.agent?.uuid
      ),
    }));

    return notificationsByAgentsChat.map((agentChat) =>
      Notification.create({
        messageCode: NOTIFICATION_CODE.MASTER_AGGREGATED,
        agent: agentChat.agent,
        chat: agentChat.chat,
        variables: {
          MESSAGE: agentChat.notifications.reduce(
            (messageAcc, currentNotification) =>
              messageAcc + currentNotification.toJSON().messages.reduced,
            ""
          ),
          DISCIPLINE: master.toJSON().discipline,
        },
      })
    );
  }
}
