import Agent, { IAgentEntity } from "../entities/Agent";
import Card, { ICardEntity } from "../entities/Card";
import Master, { IMasterEntity } from "../entities/Master";
import Planner, { IPlannerEntity } from "../entities/Planner";
import UpsertMasterCardsService from "../services/UpsertMasterCardsService";

describe("UpsertMasterCardService Tests", () => {
  it("Should create a new UpsertMasterCardService", () => {
    const upsertMasterCardService = new UpsertMasterCardsService();
    expect(upsertMasterCardService).toBeInstanceOf(UpsertMasterCardsService);
  });

  it("Should update cards of Master", () => {
    const upsertMasterCardService = new UpsertMasterCardsService();

    const mockMasterData: IMasterEntity = {
      discipline: "Test Discipline",
      isFirstPeriod: true,
      semester: "Test Semester",
      uuid: "123",
    };

    const master = Master.create(mockMasterData);

    const cardData: ICardEntity = {
      planId: "123",
      title: "Test Card",
      dueDateTime: new Date(),
      defaultBucketId: "default",
      solvedBucketId: "abc",
      solvedLMSBucketId: "lms",
      bucketId: "789",
      appliedCategories: { category1: true, category2: false },
    };

    const card = Card.create(cardData);

    const plannerData: IPlannerEntity = {
      uuid: "123",
      groupId: "456",
      name: "Test Planner",
      buckets: [
        { uuid: "789", name: "Bucket 1" },
        { uuid: "abc", name: "Bucket 2", isDefault: true },
        { uuid: "abcd", name: "Bucket 3", isSolvedBucked: true },
        { uuid: "abcde", name: "Bucket 3", isSolvedLmsBucked: true },
      ],
    };

    const planners = [Planner.create(plannerData)];

    const agentProperties: IAgentEntity = {
      uuid: crypto.randomUUID(),
      alias: "AGENT ALIAS",
      email: "test@test.com",
      isLeader: false,
      name: "Test Test",
      includeOnAllCardsPlanner: true,
    };

    const agent = Agent.create(agentProperties);

    const updatedMaster = upsertMasterCardService.execute({
      planners,
      master,
      cards: [card],
      agents: [agent],
    });

    const cardDataUpdated: ICardEntity = {
      ...cardData,
      appliedCategories: { category1: true, category2: true },
      checklist: [
        {
          bucketId: "789",
          id: "1",
          value: { isChecked: true, title: "Undefined Content" },
        },
      ],
    };

    const cardUpdated = Card.create(cardDataUpdated);

    const updatedMasterWithCardsUpdated = upsertMasterCardService
      .execute({
        planners,
        master: updatedMaster,
        cards: [cardUpdated],
        agents: [agent],
      })
      .toJSON();

    console.log(updatedMasterWithCardsUpdated);

    expect(updatedMasterWithCardsUpdated).toEqual({
      ...mockMasterData,
      cards: [
        {
          ...cardDataUpdated,
          lastUpdate: expect.any(String),
          appliedCategories: undefined,
          create: false,
          createdDateTime: expect.any(String),
          dueDateTime: expect.any(String),
          assignments: expect.any(Array),
          bucketId: expect.any(String),
          checklist: [
            {
              ...cardDataUpdated.checklist?.[0],
              value: {
                ...cardDataUpdated.checklist?.[0].value,
                title: expect.any(String),
              },
            },
          ],
          defaultBucketId: expect.any(String),
          solvedBucketId: expect.any(String),
          solvedLMSBucketId: expect.any(String),
          title: expect.stringContaining(mockMasterData.discipline),
        },
      ],
    });
  });
});
