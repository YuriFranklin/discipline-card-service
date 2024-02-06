import { z, ZodError } from "zod";

export const checkItemSchema = z.object({
  id: z.string(),
  firstNotificationDate: z.date().optional(),
  lastNotificationDate: z.date().optional(),
  contentUuid: z.string().optional(),
  bucketId: z.string(),
  value: z.object({
    title: z.string(),
    isChecked: z.boolean(),
  }),
});

export type ICheckItemEntity = z.infer<typeof checkItemSchema>;

export default class CheckItem {
  private id: string;
  private firstNotificationDate?: Date | undefined;
  private lastNotificationDate?: Date | undefined;
  private contentUuid?: string | undefined;
  private bucketId: string;
  private value: {
    title: string;
    isChecked: boolean;
  };

  private constructor(props: ICheckItemEntity) {
    const {
      id,
      firstNotificationDate,
      lastNotificationDate,
      contentUuid,
      bucketId,
      value,
    } = props;
    this.id = id;
    this.firstNotificationDate = firstNotificationDate;
    this.lastNotificationDate = lastNotificationDate;
    this.contentUuid = contentUuid;
    this.bucketId = bucketId;
    this.value = value;
  }

  public static create(data: ICheckItemEntity): CheckItem {
    try {
      checkItemSchema.parse(data);
      return new CheckItem(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public getValue() {
    return this.value;
  }

  public toJSON() {
    return {
      id: this.id,
      ...(this.firstNotificationDate && {
        firstNotificationDate: this.firstNotificationDate.toISOString(),
      }),
      ...(this.lastNotificationDate && {
        lastNotificationDate: this.lastNotificationDate.toISOString(),
      }),
      ...(this.contentUuid && { contentUuid: this.contentUuid }),
      bucketId: this.bucketId,
      value: {
        title: this.value.title,
        isChecked: this.value.isChecked,
      },
    };
  }
}
