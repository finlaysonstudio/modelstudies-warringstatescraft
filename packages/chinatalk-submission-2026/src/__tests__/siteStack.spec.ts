import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { beforeAll, describe, expect, it } from "vitest";
import { SubmissionSiteStack } from "../stacks/site-stack.js";
import { PROJECT_PREFIX, stackId } from "../shared/project.js";

// Synthesized once: the assertions read the template, none of them mutate it.
let template: Template;
let stack: SubmissionSiteStack;

beforeAll(() => {
  const app = new App();
  stack = new SubmissionSiteStack(app, "SubmissionSiteStack", {
    // Resolving the zone is a Route53 lookup; the stack is synthesized
    // without one so the test needs no AWS session.
    zone: "",
    env: { account: "123456789012", region: "us-east-1" },
  });
  template = Template.fromStack(stack);
});

describe("SubmissionSiteStack", () => {
  describe("Base Cases", () => {
    it("is a constructor", () => {
      expect(typeof SubmissionSiteStack).toBe("function");
    });

    it("synthesizes", () => {
      expect(template).toBeDefined();
    });
  });

  describe("Happy Paths", () => {
    it("names the stack for the submission", () => {
      expect(stack.stackName).toBe(
        `cdk-${PROJECT_PREFIX}-chinatalk-submission-2026-sandbox-dev`,
      );
    });

    it("never emits undefined or unknown in the stack name", () => {
      expect(stackId("chinatalk-submission-2026")).not.toContain("undefined");
      expect(stackId("chinatalk-submission-2026")).not.toContain("unknown");
    });

    it("makes one bucket and one distribution", () => {
      expect(
        Object.keys(template.findResources("AWS::S3::Bucket")),
      ).toHaveLength(1);
      expect(
        Object.keys(template.findResources("AWS::CloudFront::Distribution")),
      ).toHaveLength(1);
    });

    it("publishes the bucket and distribution for the publish step", () => {
      const parameters = template.findResources("AWS::SSM::Parameter");
      const names = Object.values(parameters).map(
        (resource) => (resource.Properties as { Name: string }).Name,
      );
      expect(names).toContain(
        `/${PROJECT_PREFIX}/sandbox-dev/chinatalk-submission-2026/bucket-name`,
      );
      expect(names).toContain(
        `/${PROJECT_PREFIX}/sandbox-dev/chinatalk-submission-2026/distribution-id`,
      );
    });
  });

  describe("Features", () => {
    it("rewrites deep links to the entry document", () => {
      // A route like /craft/replays/<id> is not a key in the bucket. Without
      // the viewer-request function every deep link and every reload is a 404.
      const functions = template.findResources("AWS::CloudFront::Function");
      const code = Object.values(functions)
        .map(
          (resource) =>
            (resource.Properties as { FunctionCode: string }).FunctionCode,
        )
        .join("\n");
      expect(code).toContain("index.html");
    });

    it("serves every request off the bucket", () => {
      // The whole claim of the deployment: the results travel, the bench does
      // not. Nothing is computed on request — the SPA rewrite is a CloudFront
      // Function at the edge, and the one Lambda in the template is CDK's own
      // custom resource for emptying the bucket when the stack is deleted.
      template.resourceCountIs("AWS::DynamoDB::Table", 0);
      template.resourceCountIs("AWS::SecretsManager::Secret", 0);
      template.resourceCountIs("AWS::ApiGateway::RestApi", 0);
      template.resourceCountIs("AWS::Lambda::Url", 0);

      const functions = Object.keys(
        template.findResources("AWS::Lambda::Function"),
      );
      expect(functions).toHaveLength(1);
      expect(functions[0]).toContain("AutoDeleteObjects");

      const distributions = template.findResources(
        "AWS::CloudFront::Distribution",
      );
      for (const resource of Object.values(distributions)) {
        const config = (
          resource.Properties as {
            DistributionConfig: {
              DefaultCacheBehavior: { LambdaFunctionAssociations?: unknown[] };
            };
          }
        ).DistributionConfig;
        expect(
          config.DefaultCacheBehavior.LambdaFunctionAssociations,
        ).toBeUndefined();
      }
    });

    it("admits the font host the page loads and nothing else", () => {
      const policies = template.findResources(
        "AWS::CloudFront::ResponseHeadersPolicy",
      );
      const csp = Object.values(policies)
        .map(
          (resource) =>
            (
              resource.Properties as {
                ResponseHeadersPolicyConfig: {
                  SecurityHeadersConfig?: {
                    ContentSecurityPolicy?: { ContentSecurityPolicy: string };
                  };
                };
              }
            ).ResponseHeadersPolicyConfig.SecurityHeadersConfig
              ?.ContentSecurityPolicy?.ContentSecurityPolicy ?? "",
        )
        .join(" ");
      expect(csp).toContain("https://fonts.googleapis.com");
      expect(csp).toContain("https://fonts.gstatic.com");
      expect(csp).toContain("script-src 'self'");
      expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    });
  });
});
