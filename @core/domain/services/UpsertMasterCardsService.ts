import { STATUS } from "../constants/Status";
import Card, { ICardEntity } from "../entities/Card";
import { IContentEntity } from "../entities/Content";
import Master, { IMasterEntity } from "../entities/Master";
import Planner, { IPlannerEntity } from "../entities/Planner";

export default class UpsertMasterCardsService {
  public execute(planners: Planner[], master: Master, cards?: Card[]): Master {
    const masterAsJSON = master.toJSON();
    const plannersAsJSON = planners.map((planner) => planner.toJSON());

    if (cards) {
      let upsertedCards: ICardEntity[] = [];

      cards?.forEach((card) => {
        const findedCard = masterAsJSON.cards?.find(
          (masterStoredCard) => masterStoredCard.id === card.id
        );

        if (!findedCard) return upsertedCards.push(card.toJSON());

        upsertedCards.push(
          this.compareAndUpdateCard(findedCard, card.toJSON())
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

      if (card) return this.updateCard(masterAsJSON, planners, card);

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

  private compareCardChecklistWithContentsAndUpdate(
    card: ICardEntity,
    contentsPlanner: { plannerId: string; contents: IContentEntity[] }
  ): ICardEntity {
    throw new Error("method not implemented yet");
  }

  /*   private getMissingContentsByPlanner(master: IMasterEntity): {
    plannerId: string;
    contents: IContentEntity[];
  }[] {
    const plannerIds = this.getContentsPlannerIds(master.contents ?? []);

    const missingContents = this.getMissingContents(master.contents ?? []);

    const structuredContentsByPlanner = plannerIds.map((plannerId) => ({
      plannerId,
      contents: missingContents?.filter(
        (content) => content.plannerUuid === plannerId
      ),
    }));

    return structuredContentsByPlanner ?? [];
  } */

  private getMissingContents(contents: IContentEntity[]) {
    return contents?.filter((content) => content?.status === STATUS.MISSING);
  }

  private compareAndUpdateCard(
    oldCard: ICardEntity,
    currentCard: ICardEntity
  ): ICardEntity {
    throw new Error("method not implemented yet");
  }

  private createCard(
    master: IMasterEntity,
    planners: IPlannerEntity[],
    contents: IContentEntity[]
  ): ICardEntity {
    throw new Error("method not implemented yet");
  }

  private updateCard(
    master: IMasterEntity,
    planners: IPlannerEntity[],
    card: ICardEntity
  ): ICardEntity {
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

    return {
      ...card,
      title: `[PENDÊNCIA] [${master.uuid}] ${master.discipline}`,
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
}
