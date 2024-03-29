import { ZodError, z } from "zod";

export type IBucketEntity = z.infer<typeof bucketSchema>;

export const bucketSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  isDefault: z.boolean().optional(),
  isSolvedBucked: z.boolean().optional(),
  isSolvedLmsBucked: z.boolean().optional(),
});

export default class Bucket {
  private uuid: string;
  private name: string;
  private isDefault?: boolean | undefined;
  private isSolvedBucked?: boolean | undefined;
  private isSolvedLmsBucked?: boolean | undefined;

  private constructor(props: IBucketEntity) {
    const { uuid, name, isDefault, isSolvedBucked, isSolvedLmsBucked } = props;

    this.uuid = uuid;
    this.name = name;
    this.isDefault = isDefault;
    this.isSolvedBucked = isSolvedBucked;
    this.isSolvedLmsBucked = isSolvedLmsBucked;
  }

  public static create(data: IBucketEntity): Bucket {
    try {
      bucketSchema.parse(data);
      return new Bucket(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): IBucketEntity {
    return {
      uuid: this.uuid,
      name: this.name,
      isDefault: this.isDefault,
      isSolvedBucked: this.isSolvedBucked,
      isSolvedLmsBucked: this.isSolvedLmsBucked,
    };
  }
}
