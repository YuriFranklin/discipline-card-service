import Publisher, { IPublisherEntity } from "../entities/Publisher";
import { ITagEntity } from "../entities/Tag";

describe("Publisher Tests", () => {
  it("Should create a new Publisher", () => {
    const tagProperties: Optional<ITagEntity, "uuid"> = {
      apiId: "category2",
      name: "vermelho",
      obs: "Test Tag",
    };

    const publisherParams: Optional<IPublisherEntity, "uuid"> = {
      name: "Publisher Test",
      tags: [tagProperties],
      slug: ["PUBLISHER TEST", "TEST PUBLISHER"],
    };

    const publisher = Publisher.create(publisherParams);

    expect(publisher).toBeInstanceOf(Publisher);

    expect(publisher.toJSON().tags).toHaveLength(1);

    expect(publisher.toJSON()).toStrictEqual({
      ...publisherParams,
      uuid: expect.any(String),
      tags: expect.arrayContaining([
        {
          ...tagProperties,
          uuid: expect.any(String),
        },
      ]),
    });
  });
});
