import Agent, { IAgentEntity } from "../entities/Agent";
import crypto from "crypto";

describe("Agent Tests", () => {
  it("Should create a new Agent", () => {
    const agentProperties: IAgentEntity = {
      uuid: crypto.randomUUID(),
      alias: "AGENT ALIAS",
      email: "test@test.com",
      isLeader: false,
      name: "Test Test",
      includeOnAllCardsPlanner: true,
    };

    const agent = Agent.create(agentProperties);

    expect(agent).toBeInstanceOf(Agent);

    expect(agent.toJSON()).toStrictEqual({
      ...agentProperties,
    });
  });
});
