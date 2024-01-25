import { ZodError, z } from "zod";
import Tag, { ITagEntity, tagSchema } from "./Tag";

export interface IPublisherEntity {
  uuid: string;
  name: string;
  slug?: string[];
  tags: ITagEntity[];
}

export const publisherSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  slug: z.array(z.string()).optional(),
  tags: z.array(tagSchema),
});

export default class Publisher implements IPublisherEntity {
  uuid: string;
  name: string;
  slug?: string[] | undefined;
  tags: Tag[];

  constructor(props: IPublisherEntity) {
    const { uuid, name, slug, tags } = props;
    this.uuid = uuid;
    this.name = name;
    this.slug = slug;
    this.tags = tags.map((tag) => new Tag(tag));
  }

  public static create(data: IPublisherEntity): Publisher {
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
      slug: this.slug,
      tags: this.tags.map((tag) => tag.toJSON()),
    };
  }
}
