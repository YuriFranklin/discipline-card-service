import Master from "../entities/Master";

export default interface MasterGatewayInterface {
  upsert(master: Master): Promise<void>;
  find(uuid: string): Promise<Master>;
  delete(uuid: string): Promise<void>;
}
