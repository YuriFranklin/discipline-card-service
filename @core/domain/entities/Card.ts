import { z, ZodError } from "zod";

export type ICardEntity = z.infer<typeof cardSchema>;

export interface ICheckItem {
  id: string;
  notifiedDate?: Date;
  contentUuid?: string;
  bucketId: string;
  value: {
    title: string;
    isChecked: boolean;
  };
}

export const cardSchema = z.object({
  create: z.boolean().optional(),
  planId: z.string(),
  bucketId: z.string().optional(),
  title: z.string(),
  createdDateTime: z.date().optional(),
  dueDateTime: z.date(),
  id: z.string().optional(),
  appliedCategories: z.record(z.boolean()).optional(),
  assignments: z.array(z.string()).optional(),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        firstNotificationDate: z.date().optional(),
        lastNotificationDate: z.date().optional(),
        contentUuid: z.string().optional(),
        bucketId: z.string(),
        value: z.object({
          title: z.string(),
          isChecked: z.boolean(),
        }),
      })
    )
    .optional(),
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
  private checklist?: ICheckItem[] | undefined;
  private chatsUuid?: string[] | undefined;

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
    } = props;

    this.planId = planId;
    this.title = title;
    this.createdDateTime = createdDateTime || new Date();
    this.dueDateTime = dueDateTime;
    this.id = id;
    this.appliedCategories = appliedCategories;
    this.assignments = assignments;
    this.checklist = checklist;
    this.create = create;
    this.defaultBucketId = defaultBucketId;
    this.solvedBucketId = solvedBucketId;
    this.solvedLMSBucketId = solvedLMSBucketId;
    this.chatsUuid = chatsUuid;

    if (this.isAllItemsChecked()) {
      this.bucketId = this.solvedBucketId;
    } else {
      const uncheckedChecklist = this.checklist?.filter(
        (checkItem) => !checkItem.value.isChecked
      );

      if (uncheckedChecklist?.length === 1) {
        this.bucketId = uncheckedChecklist[0].bucketId;
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
      this.checklist?.every((checkitem) => checkitem.value.isChecked) ?? false
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
      dueDateTime: this.dueDateTime.toISOString(),
      ...(this.id && { id: this.id }),
      ...(this.appliedCategories && {
        appliedCategories: this.appliedCategories || {},
      }),
      ...(this.assignments?.length && { assignments: this.assignments }),
      ...(this.checklist?.length && { checklist: this.checklist }),
      ...(this.create !== undefined && { create: this.create }),
      defaultBucketId: this.defaultBucketId,
      solvedBucketId: this.solvedBucketId,
      solvedLMSBucketId: this.solvedLMSBucketId,
      ...(this.chatsUuid?.length && { chatsUuid: this.chatsUuid }),
    };
  }
}
