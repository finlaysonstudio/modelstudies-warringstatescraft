import { App } from "aws-cdk-lib";
import { SubmissionSiteStack } from "./stacks/site-stack.js";
import { cdkEnv } from "./shared/project.js";

const app = new App();

new SubmissionSiteStack(app, "SubmissionSiteStack", { env: cdkEnv });
