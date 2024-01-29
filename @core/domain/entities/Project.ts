import { ZodError, z } from "zod";
import Tag, { tagSchema } from "./Tag";
import Agent, { agentSchema } from "./Agent";
import Chat, { chatSchema } from "./Chat";

export type IProjectEntity = z.infer<typeof projectSchema>;

const refineModule = (value: string) =>
  typeof value === "string" && (value.length === 1 || value.length === 2);

export const projectSchema = z.object({
  uuid: z.string().optional(),
  name: z.string(),
  identifier: z.string(),
  agentColumn: z.string().optional(),
  statusColumn: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  module: z.string().refine(refineModule, {
    message: "Module length must be 1 or 2",
  }),
  tags: z.array(tagSchema).optional(),
  agents: z.array(agentSchema).optional(),
  chats: z.array(chatSchema).optional(),
});

export default class Project {
  private uuid: string;
  private name: string;
  private identifier: string;
  private agentColumn?: string | undefined;
  private statusColumn: string;
  private startDate?: Date | undefined;
  private endDate?: Date | undefined;
  private module: string;
  private tags?: Tag[] | undefined;
  private agents?: Agent[] | undefined;
  private chats?: Chat[] | undefined;

  constructor(props: IProjectEntity) {
    const {
      uuid,
      name,
      identifier,
      agentColumn,
      statusColumn,
      startDate,
      endDate,
      module,
      tags,
      agents,
      chats,
    } = props;

    this.uuid = uuid || crypto.randomUUID();
    this.name = name;
    this.identifier = identifier;
    this.agentColumn = agentColumn;
    this.statusColumn = statusColumn;
    this.startDate = startDate;
    this.endDate = endDate;
    this.module = module;
    this.tags = tags?.map((tag) => Tag.create(tag));
    this.agents = agents?.map((agent) => Agent.create(agent));
    this.chats = chats?.map((chat) => Chat.create(chat));
  }

  public static create(data: IProjectEntity): Project {
    try {
      projectSchema.parse(data);
      return new Project(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public toJSON(): IProjectEntity | { startDate?: string; endDate?: string } {
    return {
      uuid: this.uuid,
      name: this.name,
      identifier: this.identifier,
      ...(this.agentColumn && { agentColumn: this.agentColumn }),
      statusColumn: this.statusColumn,
      ...(this.startDate && { startDate: this.startDate.toISOString() }),
      ...(this.endDate && { endDate: this.endDate.toISOString() }),
      module: this.module,
      ...(this.tags?.length && { tags: this.tags?.map((tag) => tag.toJSON()) }),
      ...(this.agents?.length && {
        agents: this.agents?.map((agent) => agent.toJSON()),
      }),
      ...(this.chats && { chats: this.chats?.map((chat) => chat.toJSON()) }),
    };
  }
}
