import Planner, { IPlannerEntity, plannerSchema } from "../entities/Planner";
import Bucket from "../entities/Bucket";

describe("Planner", () => {
  test("Should create a new Planner instance with valid data", () => {
    const plannerData: IPlannerEntity = {
      uuid: "123",
      groupId: "456",
      name: "Test Planner",
      buckets: [
        { uuid: "789", name: "Bucket 1" },
        { uuid: "abc", name: "Bucket 2" },
      ],
    };

    const planner = Planner.create(plannerData);

    expect(planner.toJSON()).toEqual({
      uuid: plannerData.uuid,
      groupId: plannerData.groupId,
      name: plannerData.name,
      buckets: plannerData.buckets?.map((bucket) =>
        Bucket.create(bucket).toJSON()
      ),
    });
  });
});
