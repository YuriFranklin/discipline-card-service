import { STATUS } from "../constants/Status";
import Agent, { IAgentEntity } from "../entities/Agent";
import Card, { ICardEntity } from "../entities/Card";
import Content, { IContentEntity } from "../entities/Content";
import Master from "../entities/Master";
import Planner, { IPlannerEntity } from "../entities/Planner";
import Project, { IProjectEntity } from "../entities/Project";
import Publisher from "../entities/Publisher";

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

    if (!masterAsJSON.uuid)
      throw new Error(
        `Cannot upsertcards because ${masterAsJSON.discipline} doesn't have uuid.`
      );

    if (cards) {
      let upsertedCards: ICardEntity[] = [];

      cardsAsJSON?.forEach((card) => {
        const findedCard = masterAsJSON.cards?.find(
          (masterStoredCard) => masterStoredCard.id === card.id
        );

        if (!findedCard)
          return upsertedCards.push({
            ...card,
            lastUpdate: card?.lastUpdate
              ? new Date(card.lastUpdate)
              : undefined,
            dueDateTime: new Date(card.dueDateTime),
            createdDateTime: card?.createdDateTime
              ? new Date(card.createdDateTime)
              : undefined,
            checklist: card.checklist?.map((checkItem) => ({
              ...checkItem,
              firstNotificationDate: checkItem?.firstNotificationDate
                ? new Date(checkItem?.firstNotificationDate)
                : undefined,
              lastNotificationDate: checkItem?.lastNotificationDate
                ? new Date(checkItem?.lastNotificationDate)
                : undefined,
            })),
          });

        upsertedCards.push(
          this.updateCard({
            agents: agentsAsJSON,
            card,
            master: masterAsJSON,
            planners: plannersAsJSON,
          })
        );
      });

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
        cards: upsertedCards,
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

      const planner = plannersAsJSON.find(
        (planner) => planner.uuid === contentsByPlannerId.plannerId
      );

      if (!planner)
        throw new Error(
          `Planner with id ${contentsByPlannerId.plannerId} not found.`
        );

      return this.createCard(
        masterAsJSON,
        planner,
        contentsByPlannerId.contents,
        agentsAsJSON
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

  private createCard(
    master: ReturnType<Master["toJSON"]>,
    planner: ReturnType<Planner["toJSON"]>,
    contents: IContentEntity[],
    agents: ReturnType<Agent["toJSON"]>[]
  ): ICardEntity {
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

    const project = sortedProjects?.[0];

    const appliedCategories = this.getCategories({
      master,
      project,
      publisher: master.productionPublisher,
    });

    const dueDateTime = project ? this.getProjectDueDate(project) : new Date();

    const buckets = this.getBuckets({
      contents,
      master,
      planner,
    });

    const assignments = this.getAssignments({
      projects: sortedProjects,
      planner,
      agents,
    });

    const checklist = this.upsertChecklist({ master, planner, contents });

    const chatsUuid = project?.chats?.map((chat) => chat.uuid);

    return {
      ...buckets,
      appliedCategories,
      title: `[PENDÊNCIA] [${master.uuid}] ${master.discipline}`,
      create: true,
      dueDateTime: dueDateTime,
      assignments,
      planId: planner.uuid,
      checklist,
      chatsUuid,
      lastUpdate: new Date(),
    };
  }

  private updateCard({
    agents,
    card,
    master,
    planners,
  }: {
    master: ReturnType<Master["toJSON"]>;
    planners: ReturnType<Planner["toJSON"]>[];
    card: ReturnType<Card["toJSON"]>;
    agents: ReturnType<Agent["toJSON"]>[];
  }): ICardEntity {
    const planner = planners.find((planner) => planner.uuid === card.planId);

    if (!planner) throw new Error(`Planner not found for card ${card.id}`);

    const checklist = this.upsertChecklist({ master, card, planner });

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

    const project = sortedProjects?.[0];

    const appliedCategories = this.getCategories({
      master,
      project,
      publisher: master.productionPublisher,
    });

    const dueDateTime = project ? this.getProjectDueDate(project) : new Date();

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

    const chatsUuid = project?.chats?.map((chat) => chat.uuid);

    return {
      ...card,
      ...buckets,
      appliedCategories,
      title: `[PENDÊNCIA] [${master.uuid}] ${master.discipline}`,
      create: false,
      checklist,
      dueDateTime: dueDateTime,
      assignments,
      lastUpdate: new Date(),
      createdDateTime: card.createdDateTime
        ? new Date(card.createdDateTime)
        : undefined,
      chatsUuid,
    };
  }

  private upsertChecklist({
    card,
    master,
    planner,
    contents,
  }: {
    master: ReturnType<Master["toJSON"]>;
    card?: ReturnType<Card["toJSON"]>;
    planner: IPlannerEntity;
    contents?: IContentEntity[];
  }) {
    const defaultBucketId = planner.buckets?.find(
      (bucket) => bucket.isDefault
    )?.uuid;

    if (!defaultBucketId)
      throw new Error(`Planner hasn't a default bucket ${planner.uuid}`);

    const masterContentsOrParam =
      master.contents?.filter(
        (content) => content.plannerUuid === card?.planId
      ) || contents;

    const updatedCardCheckItems =
      card?.checklist?.map((checkItem) => {
        const checkItemContent = masterContentsOrParam?.find(
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
            firstNotificationDate: checkItem?.firstNotificationDate
              ? new Date(checkItem?.firstNotificationDate)
              : undefined,
            lastNotificationDate: checkItem?.lastNotificationDate
              ? new Date(checkItem?.lastNotificationDate)
              : undefined,
            value: {
              ...checkItem.value,
              title: checkItemContent.title,
              isChecked: isChecked(),
            },
          };
        }

        return {
          ...checkItem,
          firstNotificationDate: checkItem?.firstNotificationDate
            ? new Date(checkItem?.firstNotificationDate)
            : undefined,
          lastNotificationDate: checkItem?.lastNotificationDate
            ? new Date(checkItem?.lastNotificationDate)
            : undefined,
          value: {
            ...checkItem.value,
            title: `${checkItem.value.title} (Conteúdo não localizado)`,
            isChecked: true,
          },
          create: false,
        };
      }) || [];

    const newCheckItems =
      masterContentsOrParam
        ?.filter(
          (content) =>
            !card?.checklist?.some(
              (checkItem) => checkItem.contentUuid === content.uuid
            ) && content.status === STATUS.MISSING
        )
        .map((content) => ({
          create: true,
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
    master: ReturnType<Master["toJSON"]>;
    project?: ReturnType<Project["toJSON"]>;
    publisher?: ReturnType<Publisher["toJSON"]>;
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

  private getProjectDueDate(project: ReturnType<Project["toJSON"]>): Date {
    return project.startDate ? new Date(project.startDate) : new Date();
  }

  private getBuckets({
    planner,
    master,
    contents,
    card,
  }: {
    planner: ReturnType<Planner["toJSON"]>;
    master: ReturnType<Master["toJSON"]>;
    contents: ReturnType<Content["toJSON"]>[];
    card?: ReturnType<Card["toJSON"]>;
  }): {
    solvedBucketId: string;
    defaultBucketId: string;
    solvedLMSBucketId: string;
    bucketId: string;
  } {
    const buckets = [
      {
        bucketEntityKeyFlag: "isDefault",
        cardEntityKeyValue: "defaultBucketId",
      },
      {
        bucketEntityKeyFlag: "isSolvedBucked",
        cardEntityKeyValue: "solvedBucketId",
      },
      {
        bucketEntityKeyFlag: "isSolvedLmsBucked",
        cardEntityKeyValue: "solvedLMSBucketId",
      },
    ].reduce((acc, bucket) => {
      const findedPlannerBucket = planner.buckets?.find(
        (plannerBucket) => plannerBucket[bucket.bucketEntityKeyFlag] === true
      )?.uuid;

      if (!findedPlannerBucket) {
        throw new Error(
          `Planner ${planner.uuid} doesn't have ${bucket.bucketEntityKeyFlag}.`
        );
      }

      acc[bucket.cardEntityKeyValue] = findedPlannerBucket;
      return acc;
    }, {} as { [key: string]: string });

    const missingContents = this.getMissingContents(contents);

    const cardBucketId = card?.bucketId;

    let bucketId = buckets.defaultBucketId;

    if (missingContents.length > 1) bucketId = buckets.defaultBucketId;

    if (
      !missingContents.length &&
      (cardBucketId !== buckets.solvedBucketId ||
        cardBucketId !== buckets.solvedLMSBucketId)
    )
      bucketId = buckets.solvedBucketId;

    if (missingContents.length === 1 && missingContents[0].bucketUuid)
      bucketId = missingContents[0].bucketUuid;

    return { ...buckets, bucketId } as {
      solvedBucketId: string;
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
    projects?: ReturnType<Project["toJSON"]>[];
    agents: ReturnType<Agent["toJSON"]>[];
    planner: ReturnType<Planner["toJSON"]>;
  }) {
    const currentDate = new Date();

    const filteredProjects =
      projects?.filter(
        (project) =>
          !project.startDate || new Date(project.startDate) <= currentDate
      ) || [];

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
