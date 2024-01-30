import { STATUS } from "../constants/Status";
import Master, { IMasterEntity } from "../entities/Master";

describe("Master class", () => {
  const mockMasterData: IMasterEntity = {
    discipline: "Test Discipline",
    isFirstPeriod: true,
    semester: "Test Semester",
  };

  it("should create a Master instance", () => {
    const masterInstance = Master.create(mockMasterData);
    expect(masterInstance).toBeInstanceOf(Master);
  });
});