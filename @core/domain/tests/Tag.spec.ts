import Tag, { ITagEntity } from "../entities/Tag";

describe("UpsertMasterCardService Tests", () => {
  it("Should create a new Tag", () => {
    const tagProperties: Optional<ITagEntity, "uuid"> = {
      apiId: "category2",
      name: "vermelho",
      obs: "Test Tag",
    };

    const tag = Tag.create(tagProperties);

    expect(tag).toBeInstanceOf(Tag);

    expect(tag.toJSON()).toStrictEqual({
      ...tagProperties,
      uuid: expect.any(String),
    });
  });
});
