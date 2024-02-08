import Master from "../entities/Master";

export default interface MasterGatewayInterface {
  upsert(master: Master): Promise<void>;
  find(uuid: string): Promise<Master>;
  delete(uuid: string): Promise<void>;
  findAll(criterias?: Criterias): Promise<findAllOutput>;
}

export type Criterias = {
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

export type findAllOutput = {
  totalItems: number;
  result: Master[];
  totalPages: number;
  currentPage: number;
  limit: number;
};
