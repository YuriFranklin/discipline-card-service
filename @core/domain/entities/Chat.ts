import { ZodError, z } from "zod";

export type IChatEntity = z.infer<typeof chatSchema>;

export const chatSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
});

export default class Chat {
  private uuid: string;
  private name: string;
  private isDefault: boolean;

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
