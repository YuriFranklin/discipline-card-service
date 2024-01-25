import { ZodError, z } from "zod";

export interface ITagEntity {
  uuid: string;
  name: string;
  apiId: string;
  obs?: string;
}

export const tagSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  apiId: z.string(),
  obs: z.string().optional(),
});

export default class Tag implements ITagEntity {
  uuid: string;
  name: string;
  apiId: string;
  obs?: string | undefined;

  constructor(props: ITagEntity) {
    const { uuid, name, apiId, obs } = props;
    this.uuid = uuid;
    this.name = name;
    this.apiId = apiId;
    this.obs = obs;
  }

  public static create(data: ITagEntity): Tag {
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
      obs: this.obs,
    };
  }
}
