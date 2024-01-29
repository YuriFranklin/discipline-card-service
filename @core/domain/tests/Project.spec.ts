import Project, { IProjectEntity } from "../entities/Project";

describe("Project", () => {
  test("Should create a new Project instance without optional properties", () => {
    const projectData: IProjectEntity = {
      name: "Tradicional AB",
      identifier: "[TRAD - AB]",
      statusColumn: "STATUS_TRAD",
      module: "AB",
    };

    const project = Project.create(projectData);

    expect(project.toJSON()).toEqual({
      uuid: expect.any(String),
      name: projectData.name,
      identifier: projectData.identifier,
      statusColumn: projectData.statusColumn,
      module: projectData.module,
    });
  });
});
