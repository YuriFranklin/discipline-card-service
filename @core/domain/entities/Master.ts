import { ZodError, z } from "zod";
import Publisher, { IPublisherEntity, publisherSchema } from "./Publisher";
import Content, { IContentEntity, contentSchema } from "./Content";
import Agent, { IAgentEntity, agentSchema } from "./Agent";
import Project, { IProjectEntity, projectSchema } from "./Project";
import Card, { ICardEntity, cardSchema } from "./Card";
import { STATUS } from "../constants/Status";

export interface IMasterEntity {
  discipline: string;
  equivalences?: string[];
  masterPublisher?: IPublisherEntity;
  productionPublisher?: IPublisherEntity;
  isFirstPeriod: boolean;
  masterId?: number;
  uuid?: string;
  semester: string;
  contents?: IContentEntity[];
  projects?: IProjectEntity[];
  agents?: IAgentEntity[];
  status?: STATUS;
  cards?: ICardEntity[];
}

const masterSchema = z.object({
  discipline: z.string(),
  equivalences: z.array(z.string()).optional(),
  masterPublisher: publisherSchema.optional(),
  productionPublisher: publisherSchema.optional(),
  isFirstPeriod: z.boolean(),
  masterId: z.number().optional(),
  uuid: z.string().optional(),
  semester: z.string(),
  contents: z.array(contentSchema).optional(),
  projects: z.array(projectSchema).optional(),
  agents: z.array(agentSchema).optional(),
  status: z.nativeEnum(STATUS).optional(),
  cards: z.array(cardSchema).optional(),
});

export default class Master implements IMasterEntity {
  discipline: string;
  equivalences?: string[] | undefined;
  masterPublisher?: Publisher | undefined;
  productionPublisher?: Publisher | undefined;
  isFirstPeriod: boolean;
  masterId?: number | undefined;
  uuid?: string | undefined;
  semester: string;
  contents?: Content[] | undefined;
  projects?: Project[] | undefined;
  agents?: Agent[] | undefined;
  status?: STATUS;
  cards?: Card[];

  private constructor(props: IMasterEntity) {
    const {
      discipline,
      equivalences,
      masterPublisher,
      productionPublisher,
      isFirstPeriod,
      masterId,
      uuid,
      semester,
      contents,
      projects,
      agents,
      status,
      cards,
    } = props;

    this.discipline = discipline;
    this.equivalences = equivalences;
    this.masterPublisher = masterPublisher && Publisher.create(masterPublisher);
    this.productionPublisher =
      productionPublisher && Publisher.create(productionPublisher);
    this.isFirstPeriod = isFirstPeriod;
    this.masterId = masterId;
    this.uuid = uuid;
    this.semester = semester;
    this.contents = contents?.map((content) => Content.create(content));
    this.projects = projects?.map((project) => Project.create(project));
    this.agents = agents?.map((agent) => Agent.create(agent));
    this.cards = cards?.map((card) => Card.create(card)) || [];
    this.status = status || this.getStatus(this.contents);
  }

  public static create(data: IMasterEntity): Master {
    try {
      masterSchema.parse(data);
      return new Master(data);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Error on validation:", error.errors);
      } else {
        throw error;
      }
      throw new Error("Error on data validation.");
    }
  }

  public getStatus(contents?: Content[]): STATUS | undefined {
    const scopedContents = contents || this.contents;

    const missingContents =
      scopedContents?.filter((content) => content.status === STATUS.MISSING) ||
      [];

    const notApplicableContents =
      scopedContents?.filter(
        (content) => content.status === STATUS.NOT_APPLICABLE
      ) || [];

    const okContents =
      scopedContents?.filter((content) => content.status === STATUS.OK) || [];

    const totalContents = scopedContents?.length || 0;

    if (missingContents.length > 0 && missingContents.length < totalContents) {
      return STATUS.INCOMPLETE;
    }

    if (okContents.length + notApplicableContents.length === totalContents) {
      return STATUS.OK;
    }

    if (missingContents.length > 0) {
      return STATUS.MISSING;
    }

    return undefined;
  }

  public toJSON(): IMasterEntity {
    return {
      discipline: this.discipline,
      equivalences: this.equivalences,
      masterPublisher: this.masterPublisher?.toJSON(),
      productionPublisher: this.productionPublisher?.toJSON(),
      isFirstPeriod: this.isFirstPeriod,
      masterId: this.masterId,
      uuid: this.uuid,
      semester: this.semester,
      contents: this.contents?.map((content) => content.toJSON()),
      projects: this.projects?.map((project) => project.toJSON()),
      agents: this.agents?.map((agent) => agent.toJSON()),
      cards: this.cards?.map((card) => card.toJSON()),
      status: this.getStatus(),
    };
  }
}
