import { z, ZodError } from "zod";
import CheckItem, { checkItemSchema } from "./CheckItem";

export type ICardEntity = z.infer<typeof cardSchema>;

export const cardSchema = z.object({
  create: z.boolean().optional(),
  planId: z.string(),
  bucketId: z.string().optional(),
  title: z.string(),
  createdDateTime: z.date().optional(),
  lastUpdate: z.date().optional(),
  dueDateTime: z.date(),
  id: z.string().optional(),
  appliedCategories: z.record(z.boolean()).optional(),
  assignments: z.array(z.string()).optional(),
  checklist: z.array(checkItemSchema).optional(),
  defaultBucketId: z.string(),
  solvedBucketId: z.string(),
  solvedLMSBucketId: z.string(),
  chatsUuid: z.array(z.string()).optional(),
});

export default class Card {
  private create?: boolean;
  private planId: string;
  private defaultBucketId: string;
  private solvedBucketId: string;
  private solvedLMSBucketId: string;
  private bucketId: string;
  private title: string;
  private createdDateTime?: Date;
  private dueDateTime: Date;
  private id?: string;
  private appliedCategories?: { [categoryId: string]: boolean } | undefined;
  private assignments?: string[] | undefined;
  private checklist?: CheckItem[] | undefined;
  private chatsUuid?: string[] | undefined;
  private lastUpdate?: Date | undefined;

  private constructor(props: ICardEntity) {
    const {
      planId,
      bucketId,
      title,
      createdDateTime,
      dueDateTime,
      id,
      appliedCategories,
      assignments,
      checklist,
      create,
      defaultBucketId,
      solvedBucketId,
      solvedLMSBucketId,
      chatsUuid,
      lastUpdate,
    } = props;

    this.planId = planId;
    this.title = title;
    this.createdDateTime = createdDateTime || new Date();
    this.dueDateTime = dueDateTime;
    this.id = id;
    this.appliedCategories = appliedCategories;
    this.assignments = assignments;
    this.checklist = checklist?.map((checkItem) => CheckItem.create(checkItem));
    this.create = create;
    this.defaultBucketId = defaultBucketId;
    this.solvedBucketId = solvedBucketId;
    this.solvedLMSBucketId = solvedLMSBucketId;
    this.chatsUuid = chatsUuid;
    this.lastUpdate = lastUpdate;

    if (this.isAllItemsChecked()) {
      this.bucketId = this.solvedBucketId;
    } else {
      const uncheckedChecklist = this.checklist?.filter(
        (checkItem) => !checkItem.getValue().isChecked
      );

      if (uncheckedChecklist?.length === 1) {
        this.bucketId = uncheckedChecklist[0].toJSON().bucketId;
      } else {
        this.bucketId = bucketId ?? defaultBucketId;
      }
    }
  }

  public static create(data: ICardEntity): Card {
    try {
      cardSchema.parse(data);
      return new Card(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  private isAllItemsChecked(): boolean {
    return (
      this.checklist?.every((checkitem) => checkitem.getValue().isChecked) ??
      false
    );
  }

  public toJSON() {
    return {
      planId: this.planId,
      bucketId: this.bucketId,
      title: this.title,
      ...(this.createdDateTime && {
        createdDateTime: this.createdDateTime.toISOString(),
      }),
      ...(this.lastUpdate && {
        lastUpdate: this.lastUpdate.toISOString(),
      }),
      dueDateTime: this.dueDateTime.toISOString(),
      ...(this.id && { id: this.id }),
      ...(this.appliedCategories && {
        appliedCategories: this.appliedCategories || {},
      }),
      ...(this.assignments?.length && { assignments: this.assignments }),
      ...(this.checklist?.length && {
        checklist: this.checklist.map((checkItem) => checkItem.toJSON()),
      }),
      ...(this.create !== undefined && { create: this.create }),
      defaultBucketId: this.defaultBucketId,
      solvedBucketId: this.solvedBucketId,
      solvedLMSBucketId: this.solvedLMSBucketId,
      ...(this.chatsUuid?.length && { chatsUuid: this.chatsUuid }),
    };
  }
}
