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

    return [...newCardsNotifies];
  }

  private cardTitleUpdated(): MasterNotification | undefined {
    throw new Error("Method not implemented.");
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
