import { ZodError, z } from "zod";

export type IAgentEntity = z.infer<typeof agentSchema>;

export const agentSchema = z.object({
  uuid: z.string(),
  alias: z.string(),
  name: z.string(),
  email: z.string(),
  isLeader: z.boolean(),
  includeOnAllCardsPlanner: z.boolean().optional(),
  plannersToInclude: z.array(z.string()).optional(),
});

export default class Agent {
  private uuid: string;
  private alias: string;
  private name: string;
  private email: string;
  private isLeader: boolean;
  private includeOnAllCardsPlanner?: boolean | undefined;
  private plannersToInclude?: string[] | undefined;

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
      agentSchema.parse(data);
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
      ...(this.includeOnAllCardsPlanner && {
        includeOnAllCardsPlanner: this.includeOnAllCardsPlanner,
      }),
      ...(this.plannersToInclude && {
        plannersToInclude: this.plannersToInclude,
      }),
    };
  }
}
