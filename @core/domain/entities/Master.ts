import { ZodError, z } from "zod";
import Publisher, { publisherSchema } from "./Publisher";
import Content, { IContentEntity, contentSchema } from "./Content";
import Agent, { agentSchema } from "./Agent";
import Project, { projectSchema } from "./Project";
import Card, { cardSchema } from "./Card";
import { STATUS } from "../constants/Status";

export type IMasterEntity = z.infer<typeof masterSchema> & {
  contents?: IContentEntity[];
};

export const masterSchema = z.object({
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

export default class Master {
  private discipline: string;
  private equivalences?: string[] | undefined;
  private masterPublisher?: Publisher | undefined;
  private productionPublisher?: Publisher | undefined;
  private isFirstPeriod: boolean;
  private masterId?: number | undefined;
  private uuid?: string | undefined;
  private semester: string;
  private contents?: Content[] | undefined;
  private projects?: Project[] | undefined;
  private agents?: Agent[] | undefined;
  private status?: STATUS;
  private cards?: Card[];

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
    this.contents = contents?.map((content: IContentEntity) =>
      Content.create(content)
    );
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
    const scopedContents =
      contents?.map((content) => content.toJSON()) ||
      this.contents?.map((content) => content.toJSON());

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

    if (
      totalContents &&
      okContents.length + notApplicableContents.length === totalContents
    ) {
      return STATUS.OK;
    }

    if (missingContents.length > 0) {
      return STATUS.MISSING;
    }

    return undefined;
  }

  public toJSON() {
    return {
      discipline: this.discipline,
      ...(this.equivalences && { equivalences: this.equivalences }),
      ...(this.masterPublisher && {
        masterPublisher: this.masterPublisher.toJSON(),
      }),
      ...(this.productionPublisher && {
        productionPublisher: this.productionPublisher?.toJSON(),
      }),
      isFirstPeriod: this.isFirstPeriod,
      ...(this.masterId && { masterId: this.masterId }),
      ...(this.uuid && { uuid: this.uuid }),
      semester: this.semester,
      ...(this.contents?.length && {
        contents: this.contents?.map((content) => content.toJSON()),
      }),
      ...(this.projects?.length && {
        projects: this.projects?.map((project) => project.toJSON()),
      }),
      ...(this.agents?.length && {
        agents: this.agents?.map((agent) => agent.toJSON()),
      }),
      ...(this.cards?.length && {
        cards: this.cards?.map((card) => card.toJSON()),
      }),
      ...(this.status && { status: this.getStatus() }),
    };
  }
}
