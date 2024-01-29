import { ZodError, z } from "zod";
import Tag, { tagSchema } from "./Tag";
import crypto from "crypto";

export type IPublisherEntity = z.infer<typeof publisherSchema>;

export const publisherSchema = z.object({
  uuid: z.string().optional(),
  name: z.string(),
  slug: z.array(z.string()).optional(),
  tags: z.array(tagSchema),
});

export default class Publisher {
  private uuid: string;
  private name: string;
  private slug?: string[] | undefined;
  private tags: Tag[];

  constructor(props: Optional<IPublisherEntity, "uuid">) {
    const { uuid, name, slug, tags } = props;
    this.uuid = uuid || crypto.randomUUID();
    this.name = name;
    this.slug = slug;
    this.tags = tags.map((tag) => Tag.create(tag));
  }

  public static create(data: Optional<IPublisherEntity, "uuid">): Publisher {
    try {
      publisherSchema.parse(data);
      return new Publisher(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): IPublisherEntity {
    return {
      uuid: this.uuid,
      name: this.name,
      ...(this.slug?.length && { slug: this.slug }),
      tags: this.tags.map((tag) => tag.toJSON()),
    };
  }
}
