import { ZodError, z } from "zod";
import { STATUS } from "../constants/status";

export interface IContentEntity {
  uuid: string;
  columnName: string;
  title: string;
  plannerUuid?: string;
  bucketUuid?: string;
  status?: STATUS;
}

export const contentSchema = z.object({
  uuid: z.string(),
  columnName: z.string(),
  title: z.string(),
  plannerUuid: z.string().optional(),
  bucketUuid: z.string().optional(),
  status: z.nativeEnum(STATUS).optional(),
});

export default class Content implements IContentEntity {
  uuid: string;
  columnName: string;
  title: string;
  plannerUuid?: string | undefined;
  bucketUuid?: string | undefined;
  status?: STATUS;

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
      plannerUuid: this.plannerUuid,
      bucketUuid: this.bucketUuid,
      status: this.status,
    };
  }
}
