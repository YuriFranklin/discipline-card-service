import { z, ZodError } from "zod";
import Notification, { notificationSchema } from "./Notification";

export type IMasterNotificationEntity = z.infer<
  typeof masterNotificationSchema
>;

const masterNotificationSchema = notificationSchema.and(
  z.object({
    masterUUID: z.string(),
  })
);

export default class MasterNotification extends Notification {
  private masterUUID: string;

  private constructor(props: IMasterNotificationEntity) {
    super(props);
    this.masterUUID = props.masterUUID;
  }

  public static create(data: IMasterNotificationEntity): MasterNotification {
    try {
      masterNotificationSchema.parse(data);
      return new MasterNotification(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): IMasterNotificationEntity {
    return {
      ...super.toJSON(),
      masterUUID: this.masterUUID,
    };
  }
}
