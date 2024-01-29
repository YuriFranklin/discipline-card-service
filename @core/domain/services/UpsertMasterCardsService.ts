import { STATUS } from "../constants/Status";
import Agent, { IAgentEntity } from "../entities/Agent";
import Card, { ICardEntity } from "../entities/Card";
import { IContentEntity } from "../entities/Content";
import Master, { IMasterEntity } from "../entities/Master";
import Planner, { IPlannerEntity } from "../entities/Planner";
import { IProjectEntity } from "../entities/Project";
import { IPublisherEntity } from "../entities/Publisher";

export default class UpsertMasterCardsService {
  public execute({
    master,
    planners,
    cards,
    agents,
  }: {
    planners: Planner[];
    master: Master;
    cards?: Card[];
    agents: Agent[];
  }): Master {
    const masterAsJSON = master.toJSON();
    const plannersAsJSON = planners.map((planner) => planner.toJSON());
    const agentsAsJSON = agents.map((agent) => agent.toJSON());
    if (cards) {
      let upsertedCards: ICardEntity[] = [];

      cards?.forEach((card) => {
        const findedCard = masterAsJSON.cards?.find(
          (masterStoredCard) => masterStoredCard.id === card.id
        );

        if (!findedCard) return upsertedCards.push(card.toJSON());

        upsertedCards.push(
          this.compareAndUpdateCard({
            agents,
            currentCard: card,
            master: masterAsJSON,
            oldCard: findedCard,
            planners,
          })
        );
      });

      return Master.create({ ...masterAsJSON, cards: upsertedCards });
    }

    const contentsByPlannersIds = this.getContentsByPlannerIds(
      master.contents || []
    );

    const upsertedCards = contentsByPlannersIds.map((contentsByPlannerId) => {
      const card = masterAsJSON.cards?.find(
        (card) => card.planId === contentsByPlannerId.plannerId
      );

      if (card)
        return this.updateCard({
          master: masterAsJSON,
          planners,
          card,
          agents: agentsAsJSON,
        });

      return this.createCard(
        masterAsJSON,
        plannersAsJSON,
        contentsByPlannerId.contents
      );
    });

    return Master.create({
      ...masterAsJSON,
      cards: upsertedCards,
    });
  }

  private getMissingContents(contents: IContentEntity[]) {
    return contents?.filter((content) => content?.status === STATUS.MISSING);
  }

  private compareAndUpdateCard({
    agents,
    currentCard,
    master,
    oldCard,
    planners,
  }: {
    master: IMasterEntity;
    oldCard: ICardEntity;
    currentCard: ICardEntity;
    agents: IAgentEntity[];
    planners: IPlannerEntity[];
  }): ICardEntity {
    const updatedChecklist = currentCard.checklist || [];

    const updatedCard = this.updateCard({
      agents,
      card: { ...oldCard, checklist: updatedChecklist },
      master,
      planners,
    });

    return updatedCard;
  }

  private createCard(
    master: IMasterEntity,
    planners: IPlannerEntity[],
    contents: IContentEntity[]
  ): ICardEntity {
    throw new Error("method not implemented yet");
  }

  private updateCard({
    agents,
    card,
    master,
    planners,
  }: {
    master: IMasterEntity;
    planners: IPlannerEntity[];
    card: ICardEntity;
    agents: IAgentEntity[];
  }): ICardEntity {
    const planner = planners.find((planner) => planner.uuid === card.planId);

    if (!planner) throw new Error(`Planner not found for card ${card.id}`);

    const checklist = this.upsertChecklist(master, card, planner);

    const today = new Date();

    const sortedProjects = master?.projects
      ?.filter((project) => {
        const projectStartDate = project.startDate
          ? new Date(project.startDate)
          : new Date();
        return projectStartDate <= today;
      })
      .sort((a, b) => {
        const startDateA = a.startDate ? new Date(a.startDate) : new Date();
        const startDateB = b.startDate ? new Date(b.startDate) : new Date();
        return startDateA.getTime() - startDateB.getTime();
      });

    if (!sortedProjects)
      throw new Error(`Card ${card.id} doesn't have project.`);

    const project = sortedProjects[0];

    const appliedCategories = this.getCategories({
      master,
      project,
      publisher: master.productionPublisher,
    });

    const dueDateTime = sortedProjects?.length
      ? this.getProjectDueDate(project)
      : new Date();

    const buckets = this.getBuckets({
      contents: master.contents || [],
      master,
      planner,
      card,
    });

    const assignments = this.getAssignments({
      projects: sortedProjects,
      planner,
      agents,
    });

    return {
      ...card,
      ...buckets,
      appliedCategories,
      title: `[PENDÊNCIA] [${master.uuid}] ${master.discipline}`,
      create: false,
      checklist,
      dueDateTime,
      assignments,
    };
  }

  private upsertChecklist(
    master: IMasterEntity,
    card: ICardEntity,
    planner: IPlannerEntity
  ) {
    const defaultBucketId = planner.buckets?.find(
      (bucket) => bucket.isDefault
    )?.uuid;

    if (!defaultBucketId)
      throw new Error(`Planner hasn't a default bucket ${planner.uuid}`);

    const contents = master.contents?.filter(
      (content) => content.plannerUuid === card.planId
    );

    const updatedCardCheckItems =
      card.checklist?.map((checkItem) => {
        const checkItemContent = contents?.find(
          (content) => content.uuid === checkItem.contentUuid
        );

        if (checkItemContent) {
          const isChecked = () => {
            switch (checkItemContent.status) {
              case STATUS.MISSING || STATUS.INCOMPLETE:
                return false;
              default:
                return true;
            }
          };

          return {
            ...checkItem,
            bucketId: checkItemContent.bucketUuid || defaultBucketId,
            id: checkItemContent.uuid,
            contentUuid: checkItemContent.uuid,
            value: {
              ...checkItem.value,
              title: checkItemContent.title,
              isChecked: isChecked(),
            },
          };
        }

        return {
          ...checkItem,
          value: {
            ...checkItem.value,
            title: `${checkItem.value.title} (Item não localizado)`,
            isChecked: true,
          },
        };
      }) || [];

    const newCheckItems =
      contents
        ?.filter(
          (content) =>
            !card.checklist?.some(
              (checkItem) => checkItem.contentUuid === content.uuid
            ) && content.status === STATUS.MISSING
        )
        .map((content) => ({
          id: content.uuid,
          contentUuid: content.uuid,
          bucketId: content.bucketUuid || defaultBucketId,
          value: {
            title: content.title,
            isChecked: false,
          },
        })) || [];

    return [...updatedCardCheckItems, ...newCheckItems];
  }

  private getContentsByPlannerIds(contents: IContentEntity[]) {
    const plannerIds =
      contents?.reduce((planners, card) => {
        if (card.plannerUuid) {
          planners.push(card.plannerUuid);
        }
        return planners;
      }, [] as string[]) || [];

    const contentsAsPlannerIds = plannerIds.map((plannerId) => ({
      plannerId,
      contents: contents.filter((content) => content.plannerUuid === plannerId),
    }));

    return contentsAsPlannerIds;
  }

  private getCategories({
    master,
    project,
    publisher,
  }: {
    master: IMasterEntity;
    project?: IProjectEntity;
    publisher?: IPublisherEntity;
  }): { [categoryId: string]: boolean } | undefined {
    const appliedCategories: { [categoryId: string]: boolean } = {};

    project &&
      project.tags?.forEach((tag) => {
        appliedCategories[tag.apiId] = true;
      });

    publisher &&
      publisher.tags.forEach((tag) => {
        appliedCategories[tag.apiId] = true;
      });

    if (!Object.keys(appliedCategories).length) return undefined;

    return appliedCategories;
  }

  private getProjectDueDate(project: IProjectEntity): Date {
    return project.startDate || new Date();
  }

  private getBuckets({
    planner,
    master,
    contents,
    card,
  }: {
    planner: IPlannerEntity;
    master: IMasterEntity;
    contents: IContentEntity[];
    card?: ICardEntity;
  }): {
    isSolvedBucked: string;
    defaultBucketId: string;
    solvedLMSBucketId: string;
    bucketId: string;
  } {
    const bucketNames = [
      "isSolvedBucked",
      "defaultBucketId",
      "solvedLMSBucketId",
    ];

    const buckets: Record<(typeof bucketNames)[number], string> =
      bucketNames.reduce((acc, bucketName) => {
        const plannerBucket = planner[bucketName];

        if (!plannerBucket) {
          throw new Error(
            `Planner ${planner.uuid} doesn't have ${bucketName}.`
          );
        }

        acc[bucketName] = plannerBucket;
        return acc;
      }, {} as Record<(typeof bucketNames)[number], string>);

    const missingContents = this.getMissingContents(contents);

    const cardBucketId = card?.bucketId;

    let bucketId = buckets.defaultBucketId;

    if (missingContents.length > 1) bucketId = buckets.defaultBucketId;

    if (
      !missingContents.length &&
      (cardBucketId !== buckets.solvedLMSBucketId ||
        cardBucketId !== buckets.isSolvedBucked)
    )
      bucketId = buckets.solvedLMSBucketId;

    if (missingContents.length === 1 && missingContents[0].bucketUuid)
      bucketId = missingContents[0].bucketUuid;

    return { ...buckets, bucketId } as {
      isSolvedBucked: string;
      defaultBucketId: string;
      solvedLMSBucketId: string;
      bucketId: string;
    };
  }

  private getAssignments({
    projects,
    agents,
    planner,
  }: {
    projects: IProjectEntity[];
    agents: IAgentEntity[];
    planner: IPlannerEntity;
  }) {
    const currentDate = new Date();

    const filteredProjects = projects.filter(
      (project) => !project.startDate || project.startDate <= currentDate
    );

    const projectsAgents = (filteredProjects
      .filter((project) => project.agents !== undefined)
      .flatMap((project) => project.agents) || []) as IAgentEntity[];

    const includeInAllPlannerAgents = agents.filter(
      (agent) => agent.includeOnAllCardsPlanner
    );

    const includeInThisPlanner = agents.filter((agent) =>
      agent.plannersToInclude?.some(
        (plannerUuid) => plannerUuid === planner.uuid
      )
    );

    const assignments = [
      ...projectsAgents,
      ...includeInAllPlannerAgents,
      ...includeInThisPlanner,
    ].map((agent) => agent.uuid);

    return assignments;
  }
}
