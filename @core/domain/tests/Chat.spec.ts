import Chat, { IChatEntity } from "../entities/Chat";

describe("Chat Tests", () => {
  it("Should create a new chat", () => {
    const chatProperties: IChatEntity = {
      uuid: crypto.randomUUID(),
      isDefault: false,
      name: "Test Chat",
    };

    const chat = Chat.create(chatProperties);

    expect(chat.toJSON()).toStrictEqual({
      ...chatProperties,
    });
  });
});
