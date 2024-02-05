import Card from "../entities/Card";
import Master from "../entities/Master";
import { IAgentEntity } from "../entities/Agent";
import Project from "../entities/Project";
import Notification from "../entities/Notification";
import { NOTIFICATION_CODE, NOTIFY_DAYS } from "../constants/Notification";

const today = new Date();

export default class MasterCardsDifferencesService {
  public execute(
    currentMaster: Master,
    oldMaster: Master
  ): { master: Master; notifications: Notification[] } {
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

    const updatedMasterCardsChecklistAndNotifies =
      this.getCardsChecklistUpdatesAndGenerateNotifies(currentMasterAsJSON);

    const notifications = [
      ...newCardsNotifies,
      ...cardTitleUpdatedNotifies,
      ...updatedMasterCardsChecklistAndNotifies.notifications,
    ];

    const master = Master.create({
      ...currentMasterAsJSON,
      projects: currentMasterAsJSON.projects?.map((project) => ({
        ...project,
        startDate: project?.startDate ? new Date(project.startDate) : undefined,
        endDate: project?.endDate ? new Date(project.endDate) : undefined,
      })),
      cards: updatedMasterCardsChecklistAndNotifies.master?.cards?.map(
        (card) => ({
          ...card,
          dueDateTime: new Date(card.dueDateTime),
          createdDateTime: card?.createdDateTime
            ? new Date(card.createdDateTime)
            : undefined,
          lastUpdate: card?.lastUpdate ? new Date(card.lastUpdate) : undefined,
        })
      ),
    });

    return { notifications, master };
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

  private getCardsChecklistUpdatesAndGenerateNotifies(
    master: ReturnType<Master["toJSON"]>
  ): { master: ReturnType<Master["toJSON"]>; notifications: Notification[] } {
    const cards = master.cards;
    const projects = this.getMasterProjects(master);

    if (!cards?.length) return { master, notifications: [] };

    const notifications: Notification[] = [];

    const cardsUpdated = cards.map((card) => {
      const checklist = card.checklist?.map((checkitem) => {
        const daysNotified = this.daysNotified(
          checkitem.firstNotificationDate,
          checkitem.lastNotificationDate
        );

        if (daysNotified === undefined) return checkitem;

        const content = master.contents?.find(
          (content) => content.uuid === checkitem.contentUuid
        );

        if (!content) return checkitem;

        daysNotified === 0
          ? this.createNotificationByProject(
              projects,
              NOTIFICATION_CODE.MASTER_CARD_CHECKLIST_ITEM_CHECKED,
              { CARDTITLE: card.title, CHECKITEM: content?.columnName }
            ).forEach((notification) => notifications.push(notification))
          : this.createNotificationByProject(
              projects,
              NOTIFICATION_CODE.MASTER_CARD_CHECKLIST_ITEM_CHECKED_DAYS,
              {
                CARDTITLE: card.title,
                CHECKITEM: content?.columnName,
                DAYS: daysNotified,
              }
            ).forEach((notification) => notifications.push(notification));

        return {
          ...checkitem,
          firstNotificationDate: checkitem.firstNotificationDate || today,
          lastNotificationDate: today,
        };
      });

      if (!checklist) return card;

      return { ...card, checklist, lastUpdate: new Date().toISOString() };
    });

    return { master: { ...master, cards: cardsUpdated }, notifications };
  }

  private daysNotified(
    firstDate: Date | undefined,
    lastDate: Date | undefined
  ): number | undefined {
    if (firstDate === undefined) return 0;

    const todayTimestamp = Date.now();
    const lastNotificationInDays = Math.floor(
      (todayTimestamp - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isLastNotificationMoreThan24Hours =
      lastDate === undefined ||
      (todayTimestamp - lastDate.getTime()) / (1000 * 60 * 60) > 24;

    if (
      NOTIFY_DAYS.includes(lastNotificationInDays) &&
      isLastNotificationMoreThan24Hours
    ) {
      return lastNotificationInDays;
    }

    if (
      Math.max(...NOTIFY_DAYS) < lastNotificationInDays &&
      isLastNotificationMoreThan24Hours
    ) {
      return lastNotificationInDays;
    }

    return undefined;
  }
}
