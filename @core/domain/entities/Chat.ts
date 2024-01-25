import { ZodError, z } from "zod";

export interface IChatEntity {
  uuid: string;
  name: string;
  isDefault: boolean;
}

export const chatSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
});

export default class Chat implements IChatEntity {
  uuid: string;
  name: string;
  isDefault: boolean;

  private constructor(props: IChatEntity) {
    const { uuid, name, isDefault } = props;
    this.uuid = uuid;
    this.name = name;
    this.isDefault = isDefault;
  }

  public static create(data: IChatEntity): Chat {
    try {
      chatSchema.parse(data);
      return new Chat(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): IChatEntity {
    return {
      uuid: this.uuid,
      name: this.name,
      isDefault: this.isDefault,
    };
  }
}
