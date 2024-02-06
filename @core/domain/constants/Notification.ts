export enum NOTIFICATION_CODE {
  MASTER_CARD_CREATED = 0,
  MASTER_CARD_UPDATED = 1,
  MASTER_CARD_DELETED = 2,
  MASTER_CARD_TITLE_UPDATED = 3,
  MASTER_CARD_CHECKLIST_ITEM_CHECKED = 4,
  MASTER_CARD_CHECKLIST_ITEM_CHECKED_DAYS = 5,
  MASTER_AGGREGATED = 100,
}

export const NOTIFY_DAYS = [0, 1, 3, 5];

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
    <p>Realizamos a criação do card da disciplina {DISCIPLINE}.</p><br><br>
    <p>Gentileza, verificar o status no planner.</p>`,
    reduced: `<p>Novo card {CARDTITLE} criado.</p><br>`,
  },
  [NOTIFICATION_CODE.MASTER_AGGREGATED]: {
    complete: `<h1>Olá, <strong>{AGENTNAME}</strong>,</h1><br>
    <p>Encontramos alterações na disciplina {DISCIPLINE}. Segue:</p><br><br>
    {MESSAGE}<br><br>
    <p>Gentileza, verificar.</p>`,
    reduced: `<h1>Olá, <strong>{AGENTNAME}</strong>,</h1><br>
    <p>Encontramos alterações na disciplina {DISCIPLINE}. Segue:</p><br><br>
    {MESSAGE}<br><br>
    <p>Gentileza, verificar.</p>`,
  },
  [NOTIFICATION_CODE.MASTER_CARD_TITLE_UPDATED]: {
    complete: `<h1>Olá, <strong>{AGENTNAME}</strong>,</h1><br>
    <p>Realizamos alteração no título do card {CARDTITLE}.</p><br><br>
    <p>Gentileza, verificar no planner.</p>`,
    reduced: `<p>Título do card atualizado.</p><br>`,
  },
  [NOTIFICATION_CODE.MASTER_CARD_CHECKLIST_ITEM_CHECKED]: {
    complete: `<h1>Olá, <strong>{AGENTNAME}</strong>,</h1><br>
    <p>Verificamos que houve uma alteração no card {CARDTITLE}.</p><br>
    <p>O item {CHECKITEM} está disponível.</p><br><br>
    <p>Gentileza, verificar no planner.</p>`,
    reduced: `<p>O item {CHECKITEM} está disponível.</p><br>`,
  },
  [NOTIFICATION_CODE.MASTER_CARD_CHECKLIST_ITEM_CHECKED_DAYS]: {
    complete: `<h1>Olá, <strong>{AGENTNAME}</strong>,</h1><br>
    <p>Verificamos que houve uma alteração no card {CARDTITLE}.</p><br>
    <p>O item {CHECKITEM} está disponível há {DAYS} dia(s).</p><br><br>
    <p>Gentileza, verificar no planner.</p>`,
    reduced: `<p>O item {CHECKITEM} está disponível há {DAYS} dia(s).</p><br>`,
  },
};
