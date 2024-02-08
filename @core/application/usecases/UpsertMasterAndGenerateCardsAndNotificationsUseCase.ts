import { STATUS } from "@core/domain/constants/Status";
import Card from "@core/domain/entities/Card";
import Master from "@core/domain/entities/Master";
import AgentGatewayInterface from "@core/domain/gateways/AgentGatewayInterface";
import MasterGatewayInterface from "@core/domain/gateways/MasterGatewayInterface";
import PlannerGatewayInterface from "@core/domain/gateways/PlannerGatewayInterface";
import UpsertMasterCardsService from "@core/domain/services/UpsertMasterCardsService";

export default class UpsertMasterAndGenerateCardsAndNotificationsUseCase {
  private static upsertMasterCardService: UpsertMasterCardsService =
    new UpsertMasterCardsService();

  constructor(
    private masterRepository: MasterGatewayInterface,
    private agentRepository: AgentGatewayInterface,
    private plannerRepository: PlannerGatewayInterface
  ) {}

  public async execute(input: Input): Promise<Output> {
    const { master, cards } = input;

    const masterEntity = Master.create(master);

    const cardEntities = cards?.map((card) => Card.create(card));

    const planners = await this.plannerRepository.findAll();

    const agents = await this.agentRepository.findAll();

    const upsertedMaster =
      UpsertMasterAndGenerateCardsAndNotificationsUseCase.upsertMasterCardService.execute(
        {
          master: masterEntity,
          planners,
          agents,
          cards: cardEntities,
        }
      );

    await this.masterRepository.upsert(upsertedMaster);

    return upsertedMaster.toJSON();
  }
}

type Input = {
  master: InputMaster;
  cards?: InputCard[];
};

type InputMaster = {
  discipline: string;
  equivalences?: string[];
  masterPublisher?: InputPublisher;
  productionPublisher?: InputPublisher;
  isFirstPeriod: boolean;
  masterId?: number;
  uuid?: string;
  semester: string;
  contents?: InputContent[];
  projects?: InputProject[];
  agents?: InputAgent[];
  status?: STATUS;
  cards?: InputCard[];
};

type InputPublisher = {
  uuid?: string;
  name: string;
  slug?: string[];
  tags: InputTag[];
};

type InputTag = {
  uuid?: string;
  name: string;
  apiId: string;
  obs?: string;
};

type InputContent = {
  uuid: string;
  columnName: string;
  title: string;
  plannerUuid?: string;
  bucketUuid?: string;
  status?: ContentEntityStatus;
};

type ContentEntityStatus = Exclude<STATUS, STATUS.INCOMPLETE>;

type InputProject = {
  uuid: string;
  name: string;
  identifier: string;
  agentColumn?: string;
  statusColumn: string;
  startDate?: Date;
  endDate?: Date;
  module: string;
  tags?: InputTag[];
  agents?: InputAgent[];
  chats?: InputChat[];
};

type InputChat = {
  uuid: string;
  name: string;
  isDefault: boolean;
};

type InputAgent = {
  uuid: string;
  alias: string;
  name: string;
  email: string;
  isLeader: boolean;
  includeOnAllCardsPlanner?: boolean;
  plannersToInclude?: string[];
};

type InputCard = {
  create?: boolean;
  planId: string;
  defaultBucketId: string;
  solvedBucketId: string;
  solvedLMSBucketId: string;
  bucketId: string;
  title: string;
  createdDateTime?: Date;
  dueDateTime: Date;
  id?: string;
  appliedCategories?: { [categoryId: string]: boolean };
  assignments?: string[];
  checklist?: InputCheckItem[];
  chatsUuid?: string[];
  lastUpdate?: Date;
};

type InputCheckItem = {
  create: boolean;
  id: string;
  contentUuid?: string;
  bucketId: string;
  firstNotificationDate?: Date;
  lastNotificationDate?: Date;
  value: {
    title: string;
    isChecked: boolean;
  };
};

type Output = {
  discipline: string;
  equivalences?: string[];
  masterPublisher?: OutputPublisher;
  productionPublisher?: OutputPublisher;
  isFirstPeriod: boolean;
  masterId?: number;
  uuid?: string;
  semester: string;
  contents?: OutputContent[];
  projects?: OutputProject[];
  agents?: OutputAgent[];
  status?: STATUS;
  cards?: OutputCard[];
};

type OutputPublisher = {
  uuid: string;
  name: string;
  slug?: string[];
  tags: OutputTag[];
};

type OutputTag = {
  uuid: string;
  name: string;
  apiId: string;
  obs?: string;
};

type OutputContent = {
  uuid: string;
  columnName: string;
  title: string;
  plannerUuid?: string;
  bucketUuid?: string;
  status?: ContentEntityStatus;
};

type OutputProject = {
  uuid: string;
  name: string;
  identifier: string;
  agentColumn?: string;
  statusColumn: string;
  startDate?: string;
  endDate?: string;
  module: string;
  tags?: OutputTag[];
  agents?: OutputAgent[];
  chats?: OutputChat[];
};

type OutputAgent = {
  uuid: string;
  alias: string;
  name: string;
  email: string;
  isLeader: boolean;
  includeOnAllCardsPlanner?: boolean;
  plannersToInclude?: string[];
};

type OutputChat = {
  uuid: string;
  name: string;
  isDefault: boolean;
};

type OutputCard = {
  create?: boolean;
  planId: string;
  defaultBucketId: string;
  solvedBucketId: string;
  solvedLMSBucketId: string;
  bucketId: string;
  title: string;
  createdDateTime?: string;
  dueDateTime: string;
  id?: string;
  appliedCategories?: { [categoryId: string]: boolean };
  assignments?: string[];
  checklist?: OutputCheckItem[];
  chatsUuid?: string[];
  lastUpdate?: string;
};

type OutputCheckItem = {
  id: string;
  contentUuid?: string;
  bucketId: string;
  firstNotificationDate?: string;
  lastNotificationDate?: string;
  value: {
    title: string;
    isChecked: boolean;
  };
};
