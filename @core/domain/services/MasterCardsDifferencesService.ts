import Card from "../entities/Card";
import Master from "../entities/Master";
import MasterNotification from "../entities/MasterNotification";
import { NOTIFICATION_CODE } from "../constants/Notification";

export default class MasterCardsDifferencesService {
  public execute(
    currentMaster: Master,
    oldMaster: Master
  ): MasterNotification[] {
    const currentMasterAsJSON = currentMaster.toJSON();
    const oldCards = oldMaster.toJSON().cards;
    const currentCards = currentMasterAsJSON.cards;

    const newCardsNotifies =
      currentCards && oldCards
        ? this.getNewCardsAndGenerateNotifies(
            currentMasterAsJSON,
            currentCards,
            oldCards
          )
        : [];

    const cardTitleUpdatedNotifies =
      currentCards && oldCards
        ? this.getCardsTitleUpdatedAndGenerateNotifies(
            currentMasterAsJSON,
            currentCards,
            oldCards
          )
        : [];

    return [...newCardsNotifies, ...cardTitleUpdatedNotifies];
  }

  private getCardsTitleUpdatedAndGenerateNotifies(
    master: ReturnType<Master["toJSON"]>,
    currentCards: ReturnType<Card["toJSON"]>[],
    oldCards?: ReturnType<Card["toJSON"]>[]
  ): MasterNotification[] {
    return currentCards
      .filter(
        (card) =>
          !oldCards?.some(
            (oldCard) => oldCard.id === card.id && card.title !== oldCard.title
          )
      )
      .map((card) =>
        MasterNotification.create({
          masterUUID: master.uuid || "123",
          message: `O título de um dos cards foi ajustado para ${card.title}.`,
          agentsUuid: card.assignments,
          chatsUuid: card.chatsUuid,
          code: NOTIFICATION_CODE.MASTER_CARD_TITLE_UPDATED,
        })
      );
  }

  private getNewCardsAndGenerateNotifies(
    master: ReturnType<Master["toJSON"]>,
    currentCards: ReturnType<Card["toJSON"]>[],
    oldCards?: ReturnType<Card["toJSON"]>[]
  ): MasterNotification[] {
    const filteredNewCards = currentCards.filter(
      (card) =>
        !oldCards?.some((oldCard) => oldCard.id === card.id) || card.create
    );

    return filteredNewCards.map((card) =>
      MasterNotification.create({
        masterUUID: master.uuid || "123",
        message: `Um novo card foi criado para a master ${master.discipline}.`,
        agentsUuid: card.assignments,
        chatsUuid: card.chatsUuid,
        code: NOTIFICATION_CODE.MASTER_CARD_CREATED,
      })
    );
  }
}
