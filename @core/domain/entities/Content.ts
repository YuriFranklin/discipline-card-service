import { ZodError, z } from "zod";
import { STATUS } from "../constants/Status";

type ContentEntityStatus = Exclude<STATUS, STATUS.INCOMPLETE>;

const isValidStatus = (value: any): value is ContentEntityStatus => {
  return [STATUS.MISSING, STATUS.OK, STATUS.NOT_APPLICABLE].includes(value);
};

export type IContentEntity = z.infer<typeof contentSchema> & {
  status?: ContentEntityStatus;
};

export const contentSchema = z.object({
  uuid: z.string(),
  columnName: z.string(),
  title: z.string(),
  plannerUuid: z.string().optional(),
  bucketUuid: z.string().optional(),
  status: z
    .custom((value) =>
      isValidStatus(value) ? value : { message: "Invalid status" }
    )
    .optional(),
});

export default class Content {
  private uuid: string;
  private columnName: string;
  private title: string;
  private plannerUuid?: string | undefined;
  private bucketUuid?: string | undefined;
  private status?: ContentEntityStatus;

  private constructor(props: IContentEntity) {
    const { uuid, columnName, title, plannerUuid, bucketUuid, status } = props;
    this.uuid = uuid;
    this.columnName = columnName;
    this.title = title;
    this.plannerUuid = plannerUuid;
    this.bucketUuid = bucketUuid;
    this.status = status;
  }

  public static create(data: IContentEntity): Content {
    try {
      contentSchema.parse(data);
      return new Content(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): IContentEntity {
    return {
      uuid: this.uuid,
      columnName: this.columnName,
      title: this.title,
      ...(this.plannerUuid && { plannerUuid: this.plannerUuid }),
      ...(this.bucketUuid && { bucketUuid: this.bucketUuid }),
      ...(this.status && { status: this.status }),
    };
  }
}
