import { STATUS } from "../constants/Status";
import Agent, { IAgentEntity } from "../entities/Agent";
import Card from "../entities/Card";
import Content, { IContentEntity } from "../entities/Content";
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
    const cardsAsJSON = cards?.map((card) => card.toJSON());
    if (cards) {
      let upsertedCards: ReturnType<Card["toJSON"]>[] = [];

      cardsAsJSON?.forEach((card) => {
        const findedCard = masterAsJSON.cards?.find(
          (masterStoredCard) => masterStoredCard.id === card.id
        );

        if (!findedCard) return upsertedCards.push(card);

        upsertedCards.push(
          this.compareAndUpdateCard({
            agents: agentsAsJSON,
            currentCard: card,
            master: masterAsJSON,
            oldCard: findedCard,
            planners: plannersAsJSON,
          })
        );
      });

      const upsertedCardsFormatted = upsertedCards.map((card) => ({
        ...card,
        dueDateTime: new Date(card.dueDateTime),
        createdDateTime:
          card?.createdDateTime === typeof "string"
            ? new Date(card?.createdDateTime)
            : undefined,
      }));

      const projects: IProjectEntity[] =
        masterAsJSON.projects?.map((project) => ({
          ...project,
          startDate: project?.startDate
            ? new Date(project?.startDate)
            : undefined,
          endDate: project?.endDate ? new Date(project?.endDate) : undefined,
        })) || [];

      return Master.create({
        ...masterAsJSON,
        cards: upsertedCardsFormatted,
        projects,
      });
    }

    const contentsByPlannersIds = this.getContentsByPlannerIds(
      masterAsJSON.contents || []
    );

    const upsertedCards = contentsByPlannersIds.map((contentsByPlannerId) => {
      const card = masterAsJSON.cards?.find(
        (card) => card.planId === contentsByPlannerId.plannerId
      );

      if (card)
        return this.updateCard({
          master: masterAsJSON,
          planners: plannersAsJSON,
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
      projects: masterAsJSON.projects?.map((project) => ({
        ...project,
        startDate: project?.startDate ? new Date(project.startDate) : undefined,
        endDate: project?.endDate ? new Date(project.endDate) : undefined,
      })),
      cards: upsertedCards.map((card) => ({
        ...card,
        dueDateTime: new Date(card.dueDateTime),
        createdDateTime: card?.createdDateTime
          ? new Date(card.createdDateTime)
          : undefined,
      })),
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
    master: ReturnType<Master["toJSON"]>;
    oldCard: ReturnType<Card["toJSON"]>;
    currentCard: ReturnType<Card["toJSON"]>;
    agents: IAgentEntity[];
    planners: ReturnType<Planner["toJSON"]>[];
  }): ReturnType<Card["toJSON"]> {
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
    master: ReturnType<Master["toJSON"]>,
    planners: ReturnType<Planner["toJSON"]>[],
    contents: IContentEntity[]
  ): ReturnType<Card["toJSON"]> {
    throw new Error("method not implemented yet");
  }

  private updateCard({
    agents,
    card,
    master,
    planners,
  }: {
    master: ReturnType<Master["toJSON"]>;
    planners: IPlannerEntity[];
    card: ReturnType<Card["toJSON"]>;
    agents: ReturnType<Agent["toJSON"]>[];
  }): ReturnType<Card["toJSON"]> {
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
    master: ReturnType<Master["toJSON"]>,
    card: ReturnType<Card["toJSON"]>,
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

  private getContentsByPlannerIds(contents: ReturnType<Content["toJSON"]>[]) {
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
    card?: ReturnType<Card["toJSON"]>;
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
