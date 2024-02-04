import Card from "../entities/Card";
import Master from "../entities/Master";
import { IAgentEntity } from "../entities/Agent";
import Project from "../entities/Project";
import Notification from "../entities/Notification";
import { NOTIFICATION_CODE } from "../constants/Notification";

const today = new Date();

export default class MasterCardsDifferencesService {
  public execute(currentMaster: Master, oldMaster: Master): Notification[] {
    const currentMasterAsJSON = currentMaster.toJSON();
    const oldCards = oldMaster.toJSON().cards;
    const currentCards = currentMasterAsJSON.cards;

    const cardTitleUpdatedNotifies =
      currentCards && oldCards
        ? this.getCardsTitleUpdatedAndGenerateNotifies(
            currentMasterAsJSON,
            currentCards,
            oldCards
          )
        : [];

    const newCardsNotifies =
      currentCards && oldCards
        ? this.getNewCardsAndGenerateNotifies(
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
  ): Notification[] {
    const projects = this.getMasterProjects(master);

    return currentCards.flatMap((card) => {
      const updatedCards = oldCards?.find(
        (oldCard) => oldCard.id === card.id && card.title !== oldCard.title
      );

      if (!updatedCards) {
        return [];
      }

      return this.createNotificationByProject(
        projects,
        NOTIFICATION_CODE.MASTER_CARD_TITLE_UPDATED,
        {
          CARDTITLE: card.title,
        }
      );
    });
  }

  private getMasterAgents(
    master: ReturnType<Master["toJSON"]>
  ): IAgentEntity[] {
    const projects = this.getMasterProjects(master);

    const projectsAgents = projects
      .filter((project) => project.agents !== undefined)
      .map((project) => project.agents) as [] as IAgentEntity[];

    return projectsAgents;
  }

  private getMasterProjects(
    master: ReturnType<Master["toJSON"]>
  ): ReturnType<Project["toJSON"]>[] {
    const sortedProjects =
      master?.projects
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

    const filteredProjects =
      sortedProjects?.filter(
        (project, index) =>
          index === 0 ||
          !project.startDate ||
          new Date(project.startDate) <= today
      ) || [];

    return filteredProjects;
  }

  private getNewCardsAndGenerateNotifies(
    master: ReturnType<Master["toJSON"]>,
    currentCards: ReturnType<Card["toJSON"]>[],
    oldCards?: ReturnType<Card["toJSON"]>[]
  ): Notification[] {
    const projects = this.getMasterProjects(master);

    const filteredNewCards = currentCards.filter(
      (card) =>
        !oldCards?.some((oldCard) => oldCard.id === card.id) || card.create
    );

    return filteredNewCards.flatMap((card) =>
      this.createNotificationByProject(
        projects,
        NOTIFICATION_CODE.MASTER_CARD_CREATED,
        { DISCIPLINE: master.discipline, CARDTITLE: card.title }
      )
    );
  }

  private createNotificationByProject(
    projects: ReturnType<Project["toJSON"]>[],
    messageCode: NOTIFICATION_CODE,
    variables: Record<string, any>
  ): Notification[] {
    return projects.flatMap(
      (project) =>
        project.agents?.flatMap(
          (agent) =>
            project.chats?.flatMap((chat) =>
              Notification.create({
                messageCode,
                variables: {
                  ...variables,
                  PROJECT: project.identifier,
                },
                agent,
                chat,
              })
            ) ||
            Notification.create({
              messageCode,
              variables: {
                ...variables,
                PROJECT: project.identifier,
              },
              agent,
            })
        ) || []
    );
  }
}
