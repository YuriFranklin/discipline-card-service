import { z, ZodError } from "zod";
import Notification, { notificationSchema } from "./Notification";
import Master, { IMasterEntity, masterSchema } from "./Master";

export type IMasterNotificationEntity = z.infer<
  typeof masterNotificationSchema
> & { master: IMasterEntity };

const masterNotificationSchema = notificationSchema.and(
  z.object({
    master: masterSchema,
  })
);

export default class MasterNotification extends Notification {
  private master: Master;

  private constructor(props: IMasterNotificationEntity) {
    super(props);
    this.master = Master.create(props.master);
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

  public toJSON() {
    const master = this.master.toJSON();

    return {
      ...super.prepareToJSON({
        DISCIPLINE: master.discipline,
      }),
      masterUUID: master.uuid,
    };
  }
}
