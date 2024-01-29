import { ZodError, z } from "zod";

export interface IAgentEntity {
  uuid: string;
  alias: string;
  name: string;
  email: string;
  isLeader: boolean;
  includeOnAllCardsPlanner?: boolean;
  plannersToInclude?: string[];
}

export const agentSchema = z.object({
  uuid: z.string(),
  alias: z.string(),
  name: z.string(),
  email: z.string(),
  isLeader: z.boolean(),
  includeOnAllCardsPlanner: z.boolean().optional(),
  plannersToInclude: z.array(z.string()).optional(),
});

export default class Agent implements IAgentEntity {
  uuid: string;
  alias: string;
  name: string;
  email: string;
  isLeader: boolean;
  includeOnAllCardsPlanner?: boolean | undefined;
  plannersToInclude?: string[] | undefined;

  private constructor(props: IAgentEntity) {
    const {
      uuid,
      alias,
      name,
      email,
      isLeader,
      includeOnAllCardsPlanner,
      plannersToInclude,
    } = props;

    this.uuid = uuid;
    this.alias = alias;
    this.name = name;
    this.email = email;
    this.isLeader = isLeader;
    this.includeOnAllCardsPlanner = includeOnAllCardsPlanner;
    this.plannersToInclude = plannersToInclude;
  }

  public static create(data: IAgentEntity): Agent {
    try {
      // Valida os dados usando o schema
      agentSchema.parse(data);
      // Se a validação for bem-sucedida, cria uma instância da classe
      return new Agent(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
    }
    throw new Error("Error on data validation.");
  }

  public toJSON(): IAgentEntity {
    return {
      uuid: this.uuid,
      alias: this.alias,
      name: this.name,
      email: this.email,
      isLeader: this.isLeader,
      includeOnAllCardsPlanner: this.includeOnAllCardsPlanner,
      plannersToInclude: this.plannersToInclude,
    };
  }
}
