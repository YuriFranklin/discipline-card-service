import { STATUS } from "@core/domain/constants/Status";
import MasterGatewayInterface from "@core/domain/gateways/MasterGatewayInterface";

export default class FindAllMasterUseCase {
  constructor(private masterRepository: MasterGatewayInterface) {}

  public async execute(input?: Input): Promise<Output> {
    const result = await this.masterRepository.findAll(input);

    return {
      ...result,
      result: result.result.map((master) => master.toJSON()),
    };
  }
}

export type Input = {
  limit?: NumericRange<CreateArrayWithLengthX<1>, 1000>;
  start?: number;
  sortBy?: {
    property: Properties;
    order: "ascending" | "descending";
  };
  filter?: {
    properties?: { [property in Properties]?: any };
  };
};

enum Properties {
  DISCIPLINE = "discipline",
  UUID = "uuid",
  MASTER_ID = "masterId",
  SEMESTER = "semester",
  STATUS = "status",
  PROJECT = "project",
  AGENT = "agent",
}

type Output = {
  totalItems: number;
  result: OutputMaster[];
  totalPages: number;
  currentPage: number;
  limit: number;
};

type OutputMaster = {
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

type ContentEntityStatus = Exclude<STATUS, STATUS.INCOMPLETE>;
