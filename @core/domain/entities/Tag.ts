import { ZodError, z } from "zod";
import crypto from "crypto";

export type ITagEntity = z.infer<typeof tagSchema>;

export const tagSchema = z.object({
  uuid: z.string().optional(),
  name: z.string(),
  apiId: z.string(),
  obs: z.string().optional(),
});

export default class Tag {
  private uuid: string;
  private name: string;
  private apiId: string;
  private obs?: string | undefined;

  private constructor(props: Optional<ITagEntity, "uuid">) {
    const { uuid, name, apiId, obs } = props;
    this.uuid = uuid || crypto.randomUUID();
    this.name = name;
    this.apiId = apiId;
    this.obs = obs;
  }

  public static create(data: Optional<ITagEntity, "uuid">): Tag {
    try {
      tagSchema.parse(data);
      return new Tag(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): ITagEntity {
    return {
      uuid: this.uuid,
      name: this.name,
      apiId: this.apiId,
      ...(this.obs && { obs: this.obs }),
    };
  }
}
