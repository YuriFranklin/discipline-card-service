import Master from "../entities/Master";
import Notification from "../entities/Notification";

export default class AggregateNotifications {
  public execute(master: Master, notifications: Notification[]): Notification {
    throw new Error("Method not implemented yet.");
  }
}
