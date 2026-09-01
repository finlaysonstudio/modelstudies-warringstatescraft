import { PROJECT_PREFIX, PROJECT_QUALIFIER } from "./project.js";

const BASE = `/${PROJECT_PREFIX}/${PROJECT_QUALIFIER}`;

// The publish step reads these rather than taking a bucket name on the command
// line, so the sync always lands on the bucket this stack made.
export const SSM = {
  site: {
    bucketName: `${BASE}/chinatalk-submission-2026/bucket-name`,
    deployRoleArn: `${BASE}/chinatalk-submission-2026/deploy-role-arn`,
    distributionDomain: `${BASE}/chinatalk-submission-2026/distribution-domain`,
    distributionId: `${BASE}/chinatalk-submission-2026/distribution-id`,
    host: `${BASE}/chinatalk-submission-2026/host`,
  },
} as const;
