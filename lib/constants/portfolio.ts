export const PROJECT_TYPES = ["wedding", "portrait", "commercial", "event"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export function isValidProjectType(value: string): value is ProjectType {
  return PROJECT_TYPES.includes(value as ProjectType);
}

export function getProjectTypes() {
  return [...PROJECT_TYPES];
}
