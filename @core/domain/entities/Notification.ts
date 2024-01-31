import { ZodError, z } from "zod";
import crypto from "crypto";
import { NOTIFICATION_CODE } from "../constants/Notification";

export type INotificationEntity = z.infer<typeof notificationSchema>;

export const notificationSchema = z
  .object({
    uuid: z.string().optional(),
    message: z.string(),
    agentsUuid: z.array(z.string()).optional(),
    chatsUuid: z.array(z.string()).optional(),
    code: z.nativeEnum(NOTIFICATION_CODE),
  })
  .refine(
    (data) => data.agentsUuid !== undefined || data.chatsUuid !== undefined,
    {
      message: "At least one of agentsUuid or chatsUuid must be present",
    }
  );

export default class Notification {
  private uuid: string;
  private message: string;
  private agentsUuid?: string[] | undefined;
  private chatsUuid?: string[] | undefined;
  private code: NOTIFICATION_CODE;

  protected constructor(props: Optional<INotificationEntity, "uuid">) {
    const { uuid, message, agentsUuid, chatsUuid, code } = props;
    this.uuid = uuid || crypto.randomUUID();
    this.message = message;
    this.agentsUuid = agentsUuid;
    this.chatsUuid = chatsUuid;
    this.code = code;
  }

  public static create(
    data: Optional<INotificationEntity, "uuid">
  ): Notification {
    try {
      notificationSchema.parse(data);
      return new Notification(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): INotificationEntity {
    return {
      code: this.code,
      uuid: this.uuid,
      message: this.message,
      ...(this.agentsUuid && { agentsUuid: this.agentsUuid }),
      ...(this.chatsUuid && { chatsUuid: this.chatsUuid }),
    };
  }
}
