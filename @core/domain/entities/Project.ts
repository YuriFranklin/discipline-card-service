import { ZodError, z } from "zod";
import Tag, { ITagEntity, tagSchema } from "./Tag";
import Agent, { IAgentEntity, agentSchema } from "./Agent";
import Chat, { IChatEntity, chatSchema } from "./Chat";

export interface IProjectEntity {
  uuid: string;
  name: string;
  identifier: string;
  agentColumn?: string;
  statusColumn: string;
  startDate?: Date;
  endDate?: Date;
  module: string & { length: 1 | 2 };
  tags?: ITagEntity[];
  agents?: IAgentEntity[];
  chats?: IChatEntity[];
}

const refineModule = (value: string) =>
  typeof value === "string" && (value.length === 1 || value.length === 2);

export const projectSchema = z.object({
  uuid: z.string(),
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

export default class Project implements IProjectEntity {
  uuid: string;
  name: string;
  identifier: string;
  agentColumn?: string | undefined;
  statusColumn: string;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  module: string & { length: 1 | 2 };
  tags?: Tag[] | undefined;
  agents?: Agent[] | undefined;
  chats?: Chat[] | undefined;

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

    this.uuid = uuid;
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

  public toJSON(): IProjectEntity {
    return {
      uuid: this.uuid,
      name: this.name,
      identifier: this.identifier,
      agentColumn: this.agentColumn,
      statusColumn: this.statusColumn,
      startDate: this.startDate,
      endDate: this.endDate,
      module: this.module,
      tags: this.tags?.map((tag) => tag.toJSON()),
      agents: this.agents?.map((agent) => agent.toJSON()),
      chats: this.chats?.map((chat) => chat.toJSON()),
    };
  }
}
