import Card from "../entities/Card";
import Master from "../entities/Master";
import MasterNotification from "../entities/MasterNotification";
import { NOTIFICATION_CODE } from "../constants/Notification";
import Agent, { IAgentEntity } from "../entities/Agent";
import Project from "../entities/Project";
import Planner from "../entities/Planner";

const today = new Date();

export default class MasterCardsDifferencesService {
  public execute(
    currentMaster: Master,
    oldMaster: Master
  ): MasterNotification[] {
    const currentMasterAsJSON = currentMaster.toJSON();
    const oldCards = oldMaster.toJSON().cards;
    const currentCards = currentMasterAsJSON.cards;

    const sortedProjects =
      currentMasterAsJSON?.projects
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
        }) || [];

    const agents = this.getMasterAgents(sortedProjects);

    /* const newCardsNotifies =
      currentCards && oldCards
        ? this.getNewCardsAndGenerateNotifies(
            currentMasterAsJSON,
            currentCards,
            oldCards
          )
        : []; */

    const cardTitleUpdatedNotifies =
      currentCards && oldCards
        ? this.getCardsTitleUpdatedAndGenerateNotifies(
            currentMasterAsJSON,
            currentCards,
            oldCards
          )
        : [];

    return [/*...newCardsNotifies,*/ ...cardTitleUpdatedNotifies];
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
          master: {
            ...master,
            projects: master.projects?.map((project) => ({
              ...project,
              startDate: project.startDate
                ? new Date(project.startDate)
                : undefined,
              endDate: project.endDate ? new Date(project.endDate) : undefined,
            })),
            cards: master.cards?.map((card) => ({
              ...card,
              dueDateTime: new Date(card.dueDateTime),
              createdDateTime: card.createdDateTime
                ? new Date(card.createdDateTime)
                : undefined,
            })),
          },
          messageCode: NOTIFICATION_CODE.MASTER_CARD_TITLE_UPDATED,
        })
      );
  }

  private getMasterAgents(
    projects: ReturnType<Project["toJSON"]>[]
  ): IAgentEntity[] {
    const filteredProjects =
      projects?.filter(
        (project) => !project.startDate || new Date(project.startDate) <= today
      ) || [];

    const projectsAgents = (filteredProjects
      .filter((project) => project.agents !== undefined)
      .flatMap((project) => project.agents) || []) as IAgentEntity[];

    return projectsAgents;
  }

  /* private getNewCardsAndGenerateNotifies(
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
  } */
}
