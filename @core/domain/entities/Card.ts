import { z, ZodError } from "zod";

export interface ICardEntity {
  create?: boolean;
  planId: string;
  defaultBucketId: string;
  solvedBucketId: string;
  solvedLMSBucketId: string;
  bucketId: string;
  title: string;
  createdDateTime?: Date;
  dueDateTime: Date;
  id?: string;
  appliedCategories?: { [categoryId: string]: boolean } | undefined;
  assignments?: string[] | undefined;
  checklist?: ICheckItem[] | undefined;
}

export interface ICheckItem {
  id: string;
  notifiedDate?: Date;
  contentUuid: string;
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
        notifiedDate: z.date().optional(),
        contentUuid: z.string(),
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
});

export default class Card implements ICardEntity {
  create?: boolean;
  planId: string;
  defaultBucketId: string;
  solvedBucketId: string;
  solvedLMSBucketId: string;
  bucketId: string;
  title: string;
  createdDateTime?: Date;
  dueDateTime: Date;
  id?: string;
  appliedCategories?: { [categoryId: string]: boolean } | undefined;
  assignments?: string[] | undefined;
  checklist?: ICheckItem[] | undefined;

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

  toJSON(): ICardEntity {
    return {
      planId: this.planId,
      bucketId: this.bucketId,
      title: this.title,
      createdDateTime: this.createdDateTime,
      dueDateTime: this.dueDateTime,
      id: this.id,
      appliedCategories: this.appliedCategories,
      assignments: this.assignments,
      checklist: this.checklist,
      create: this.create,
      defaultBucketId: this.defaultBucketId,
      solvedBucketId: this.solvedBucketId,
      solvedLMSBucketId: this.solvedLMSBucketId,
    };
  }
}
