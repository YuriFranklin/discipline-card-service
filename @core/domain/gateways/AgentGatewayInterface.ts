import Agent from "../entities/Agent";

export default interface AgentGatewayInterface {
  upsert(agent: Agent): Promise<void>;
  find(uuid: string): Promise<Agent>;
  delete(uuid: string): Promise<void>;
  findAll(): Promise<Agent[]>;
}
