import Planner from "../entities/Planner";

export default interface PlannerGatewayInterface {
  upsert(agent: Planner): Promise<void>;
  find(uuid: string): Promise<Planner>;
  delete(uuid: string): Promise<void>;
  findAll(): Promise<Planner[]>;
}
