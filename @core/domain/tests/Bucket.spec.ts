import Bucket, { IBucketEntity } from "../entities/Bucket";
import crypto from "crypto";

describe("Bucket Tests", () => {
  it("Should create a new bucket", () => {
    const bucketProperties: IBucketEntity = {
      name: "Bucket Test",
      uuid: crypto.randomUUID(),
      isDefault: true,
      isSolvedBucked: false,
      isSolvedLmsBucked: false,
    };

    const bucket = Bucket.create(bucketProperties);

    expect(bucket).toBeInstanceOf(Bucket);

    expect(bucket.toJSON()).toStrictEqual({
      ...bucketProperties,
    });
  });
});
