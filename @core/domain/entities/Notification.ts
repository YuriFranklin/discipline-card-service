import { ZodError, z } from "zod";
import crypto from "crypto";
import {
  MessageTemplate,
  NOTIFICATION_CODE,
  NOTIFICATION_MESSAGES,
} from "../constants/Notification";
import Agent, { agentSchema } from "./Agent";
import Chat, { chatSchema } from "./Chat";

export type INotificationEntity = z.infer<typeof notificationSchema>;

export const notificationSchema = z
  .object({
    uuid: z.string().optional(),
    messageCode: z.nativeEnum(NOTIFICATION_CODE),
    agent: agentSchema.optional(),
    chat: chatSchema.optional(),
    message: z.string().optional(),
  })
  .refine((data) => data.agent !== undefined || data.chat !== undefined, {
    message: "At least one of agent or chat must be present",
  });

export default class Notification {
  private uuid: string;
  private messageCode: NOTIFICATION_CODE;
  private agent: Agent | undefined;
  private chat: Chat | undefined;
  private message: string | undefined;

  protected constructor(props: Optional<INotificationEntity, "uuid">) {
    const { uuid, agent, chat, messageCode, message } = props;
    this.uuid = uuid || crypto.randomUUID();
    this.agent = agent && Agent.create(agent);
    this.chat = chat && Chat.create(chat);
    this.messageCode = messageCode;
    this.message = message;
  }

  public static create(
    data: Optional<INotificationEntity, "uuid">
  ): Notification {
    try {
      notificationSchema.parse(data);
      return new Notification(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  private formatMessage(
    template: MessageTemplate,
    variables: Record<string, any>
  ): {
    complete: string;
    reduced: string;
  } {
    return {
      complete: this.injectVariablesIntoMessage(template.complete, variables),
      reduced: this.injectVariablesIntoMessage(template.reduced, variables),
    };
  }

  private injectVariablesIntoMessage(
    message: string,
    variables: Record<string, any>
  ): string {
    return Object.entries(variables).reduce(
      (formattedMessage, [key, value]) => {
        const placeholder = new RegExp(`\\{${key}\\}`, "g");
        return formattedMessage.replace(placeholder, value || "N/A");
      },
      message
    );
  }

  protected prepareToJSON(variables?: { [key: string]: any }) {
    const messageTemplate = NOTIFICATION_MESSAGES[this.messageCode];
    const agent = this.agent?.toJSON();
    const chat = this.chat?.toJSON();

    if (!messageTemplate)
      throw new Error(
        `Message template for code ${this.messageCode} not found.`
      );

    return {
      uuid: this.uuid,
      ...(agent && { agent }),
      ...(chat && { chat }),
      messages: this.formatMessage(messageTemplate, {
        ...variables,
        AGENTNAME: agent?.name,
        CHATNAME: chat?.name,
        ...(this.message && { MESSAGE: this.message }),
      }),
    };
  }

  public toJSON() {
    return this.prepareToJSON();
  }
}
