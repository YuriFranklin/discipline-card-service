export enum NOTIFICATION_CODE {
  MASTER_CARD_CREATED = 0,
  MASTER_CARD_UPDATED = 1,
  MASTER_CARD_DELETED = 2,
  MASTER_CARD_TITLE_UPDATED = 3,
  MASTER_CARD_CHECKLIST_UPDATED = 4,
}

export type MessageTemplate = {
  complete: string;
  reduced: string;
};

type NotificationMessages = {
  [key in NOTIFICATION_CODE]?: MessageTemplate;
};

export const NOTIFICATION_MESSAGES: NotificationMessages = {
  [NOTIFICATION_CODE.MASTER_CARD_CREATED]: {
    complete: `<h1>Olá, <strong>{AGENTNAME}</strong>,</h1><br>
    <p>Realizamos a criação do card da disciplina {DISCIPLINE || 'N/A'}.</p><br><br>
    <p>Gentileza, verificar o status no planner.</p>`,
    reduced: `Novo card criado.`,
  },
};
