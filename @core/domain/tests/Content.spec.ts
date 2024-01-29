import Content, { IContentEntity, contentSchema } from "../entities/Content";
import { STATUS } from "../constants/Status";

describe("Content", () => {
  test("Should create a new Content instance with valid data", () => {
    const contentData: IContentEntity = {
      uuid: "123",
      columnName: "Test Column",
      title: "Test Title",
      plannerUuid: "456",
      bucketUuid: "789",
      status: STATUS.OK,
    };

    const content = Content.create(contentData);

    expect(content.toJSON()).toEqual({
      uuid: contentData.uuid,
      columnName: contentData.columnName,
      title: contentData.title,
      plannerUuid: contentData.plannerUuid,
      bucketUuid: contentData.bucketUuid,
      status: contentData.status,
    });
  });

  test("Should create a new Content instance without optional properties", () => {
    const contentData: IContentEntity = {
      uuid: "123",
      columnName: "Test Column",
      title: "Test Title",
    };

    const content = Content.create(contentData);

    expect(content.toJSON()).toEqual({
      uuid: contentData.uuid,
      columnName: contentData.columnName,
      title: contentData.title,
    });
  });

  test("Should validate data using contentSchema", () => {
    const validContentData: IContentEntity = {
      uuid: "123",
      columnName: "Test Column",
      title: "Test Title",
    };

    expect(() => contentSchema.parse(validContentData)).not.toThrow();
  });
});
