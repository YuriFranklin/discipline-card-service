import Card, { ICardEntity } from "../entities/Card";

describe("Card", () => {
  test("Should create a new Card instance with valid data", () => {
    const cardData: ICardEntity = {
      planId: "123",
      title: "Test Card",
      dueDateTime: new Date(),
      defaultBucketId: "default",
      solvedBucketId: "solved",
      solvedLMSBucketId: "lms",
      bucketId: "someBucketId",
    };

    const card = Card.create(cardData);

    expect(card.toJSON()).toStrictEqual({
      ...cardData,
      planId: cardData.planId,
      dueDateTime: cardData.dueDateTime.toISOString(),
      defaultBucketId: cardData.defaultBucketId,
      solvedBucketId: cardData.solvedBucketId,
      solvedLMSBucketId: cardData.solvedLMSBucketId,
      createdDateTime: expect.any(String),
    });
  });

  test("Should create a new Card instance with default createdDateTime", () => {
    const cardData: ICardEntity = {
      planId: "123",
      dueDateTime: new Date(),
      title: "Test Card",
      defaultBucketId: "default",
      solvedBucketId: "solved",
      solvedLMSBucketId: "lms",
      bucketId: "someBucketId",
    };

    const card = Card.create(cardData);

    expect(card.toJSON()).toStrictEqual({
      ...cardData,
      planId: cardData.planId,
      dueDateTime: cardData.dueDateTime.toISOString(),
      defaultBucketId: cardData.defaultBucketId,
      solvedBucketId: cardData.solvedBucketId,
      solvedLMSBucketId: cardData.solvedLMSBucketId,
      createdDateTime: expect.any(String),
    });
  });

  test("Should create a new Card instance with appliedCategories", () => {
    const cardData: ICardEntity = {
      planId: "123",
      title: "Test Card",
      dueDateTime: new Date(),
      defaultBucketId: "default",
      solvedBucketId: "solved",
      solvedLMSBucketId: "lms",
      bucketId: "someBucketId",
      appliedCategories: { category1: true, category2: false },
    };

    const card = Card.create(cardData);

    expect(card.toJSON()).toStrictEqual({
      planId: cardData.planId,
      title: cardData.title,
      dueDateTime: cardData.dueDateTime.toISOString(),
      defaultBucketId: cardData.defaultBucketId,
      solvedBucketId: cardData.solvedBucketId,
      solvedLMSBucketId: cardData.solvedLMSBucketId,
      appliedCategories: cardData.appliedCategories,
      createdDateTime: expect.any(String),
      bucketId: cardData.bucketId,
    });
  });
});
