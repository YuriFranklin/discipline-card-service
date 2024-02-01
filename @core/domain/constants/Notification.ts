export enum NOTIFICATION_CODE {
  MASTER_CARD_CREATED = 0,
  MASTER_CARD_UPDATED = 1,
  MASTER_CARD_DELETED = 2,
  MASTER_CARD_TITLE_UPDATED = 3,
  MASTER_CARD_CHECKLIST_UPDATED = 4,
  AGGREGATED = 5,
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
    reduced: `Novo card criado`,
  },
  [NOTIFICATION_CODE.AGGREGATED]: {
    complete: `{MESSAGE}`,
    reduced: `{MESSAGE}`,
  },
  [NOTIFICATION_CODE.MASTER_CARD_TITLE_UPDATED]: {
    complete: `<h1>Olá, <strong>{AGENTNAME}</strong>,</h1><br>
    <p>Realizamos a alteração no título do card da disciplina <strong>{DISCIPLINE || 'N/A'}</strong>.</p><br><br>
    <p>Gentileza, verificar no planner.</p>`,
    reduced: `Título do card atualizado`,
  },
};
