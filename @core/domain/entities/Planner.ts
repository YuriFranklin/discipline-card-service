import { ZodError, z } from "zod";
import Bucket, { IBucketEntity, bucketSchema } from "./Bucket";

export interface IPlannerEntity {
  uuid: string;
  groupId: string;
  name: string;
  buckets?: IBucketEntity[];
}

const plannerSchema = z.object({
  uuid: z.string(),
  groupId: z.string(),
  name: z.string(),
  buckets: z.array(bucketSchema).optional(),
});

export default class Planner implements IPlannerEntity {
  uuid: string;
  groupId: string;
  name: string;
  buckets?: Bucket[] | undefined;

  private constructor(props: IPlannerEntity) {
    const { uuid, groupId, name, buckets } = props;

    this.uuid = uuid;
    this.groupId = groupId;
    this.name = name;
    this.buckets = buckets?.map((bucket) => Bucket.create(bucket));
  }

  public static create(data: IPlannerEntity): Planner {
    try {
      plannerSchema.parse(data);
      return new Planner(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): IPlannerEntity {
    return {
      uuid: this.uuid,
      groupId: this.groupId,
      name: this.name,
      buckets: this.buckets?.map((bucket) => bucket.toJSON()),
    };
  }
}
