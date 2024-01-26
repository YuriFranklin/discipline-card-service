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

        upsertedCards.push(this.updateCard(findedCard, card.toJSON()));
      });

      return Master.create({ ...masterAsJSON, cards: upsertedCards });
    }

    const missingContentsByPlanner = this.getMissingContentsByPlanner(
      masterAsJSON
    ).filter((contents) => !!contents.contents?.length) as {
      plannerId: string;
      contents: IContentEntity[];
    }[];

    const cardsUpserted = missingContentsByPlanner.map((contentsPlanner) => {
      const card = masterAsJSON.cards?.find(
        (card) => card.planId === contentsPlanner.plannerId
      );

      if (card)
        return this.compareCardChecklistWithContentsAndUpdate(
          card,
          contentsPlanner
        );

      return this.createCard(
        masterAsJSON,
        plannersAsJSON,
        contentsPlanner.contents
      );
    });

    const missingPlannerIds = this.getContentsPlannerIds(
      masterAsJSON.contents || []
    );

    const alreadyFinishedCards = master.cards?.filter(
      (card) => !missingPlannerIds.some((id) => id === card.planId)
    );
  }

  private compareCardChecklistWithContentsAndUpdate(
    card: ICardEntity,
    contentsPlanner: { plannerId: string; contents: IContentEntity[] }
  ): ICardEntity {}

  private getMissingContentsByPlanner(master: IMasterEntity): {
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
  }

  private getMissingContents(contents: IContentEntity[]) {
    return contents?.filter((content) => content?.status === STATUS.MISSING);
  }

  private updateCard(
    oldCard: ICardEntity,
    currentCard: ICardEntity
  ): ICardEntity {}

  private createCard(
    master: IMasterEntity,
    planners: IPlannerEntity[],
    contents: IContentEntity[]
  ): ICardEntity {}

  private getContentsPlannerIds(contents: IContentEntity[]): string[] {
    const missingContents = this.getMissingContents(contents);

    const plannerIds =
      missingContents?.reduce((planners, card) => {
        if (card.plannerUuid) {
          planners.push(card.plannerUuid);
        }
        return planners;
      }, [] as string[]) || [];

    return plannerIds;
  }
}
