import UpsertMasterCardsService from "../services/UpsertMasterCardsService";

describe("UpsertMasterCardService Tests", () => {
  it("Should create a new UpsertMasterCardService", () => {
    const upsertMasterCardService = new UpsertMasterCardsService();
    expect(upsertMasterCardService).toBeInstanceOf(UpsertMasterCardsService);
  });
});
