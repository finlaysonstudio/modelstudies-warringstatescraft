// Datadog unified-service-tagging vocabulary, project-prefixed so the name is
// unique across the studio's Datadog org.
const PROJECT =
  process.env.PROJECT_ALIAS || process.env.PROJECT_KEY || "situationeval";

const service = (name: string): string => `${PROJECT}:${name}`;

export const SERVICE = {
  SITE: service("web:chinatalk-submission-2026"),
};
