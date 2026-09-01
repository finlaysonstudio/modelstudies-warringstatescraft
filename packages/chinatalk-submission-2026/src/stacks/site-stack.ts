import { JaypieWebDeploymentBucket, envHostname } from "@jaypie/constructs";
import { Stack, Tags, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import {
  HOSTED_ZONE,
  SITE_SUBDOMAIN,
  cdkEnv,
  stackId,
} from "../shared/project.js";
import { SERVICE } from "../shared/service-tags.js";
import { SSM } from "../shared/ssm-keys.js";

/**
 * One stack, one bucket, one distribution. The submission site is the whole
 * snapshot rendered as files: pages, art, and every `/data/*.json` the app
 * fetches. There is no Lambda, no table, and no secret, because the deployed
 * artifact answers no question it has to compute — the bench that produced the
 * results ran on a workstation and its output is what travels.
 *
 * `spa: true` is what makes a deep link work: `/craft/replays/<id>` is a route
 * in the browser router and not a key in the bucket, so the viewer-request
 * function rewrites an extension-less URI to `/index.html`. A `/data/...json`
 * request carries an extension and is left alone, which is what keeps a
 * missing artifact a 404 rather than a page of HTML the fetch would try to
 * parse.
 */
export interface SubmissionSiteStackProps extends StackProps {
  /**
   * The hosted zone to alias into, defaulting to the environment's. An empty
   * string opts out: the distribution still exists and answers on its own
   * CloudFront domain, with no certificate and no record. That is also what
   * lets the stack synthesize with no AWS session, since resolving a zone is a
   * lookup.
   */
  zone?: string;
}

export class SubmissionSiteStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: SubmissionSiteStackProps = {},
  ) {
    const { zone = HOSTED_ZONE, ...stackProps } = props;
    super(scope, id, {
      stackName: stackId("chinatalk-submission-2026"),
      env: cdkEnv,
      ...stackProps,
    });

    // Resolved here rather than read back off the distribution: the construct
    // exposes the CloudFront domain, not the vanity host it aliased.
    const siteHost = zone
      ? envHostname({ domain: zone, subdomain: SITE_SUBDOMAIN })
      : "";

    const site = new JaypieWebDeploymentBucket(this, "Site", {
      // A second web bucket in the account would collide on the default
      // component name; this one is named for the submission it carries.
      component: "chinatalk-submission-2026",
      spa: true,
      // WAF costs more than the site does. The content is public and static.
      waf: false,
      // No CloudFront access logs: the default would add a second bucket and
      // a forwarder function, which is the only compute the template would
      // otherwise carry. A snapshot has no traffic question to answer.
      destination: false,
      // Passed as a resolved string rather than a HostConfig so the name does
      // not depend on which CDK_ENV_* happen to be set at synth.
      ...(zone && { host: siteHost, zone }),
      securityHeaders: {
        contentSecurityPolicy: [
          "default-src 'self'",
          // The bundle is the only script. Nothing is inlined and nothing is
          // fetched from a CDN.
          "script-src 'self'",
          // Tailwind ships one stylesheet, but React and Phaser both set style
          // attributes on elements they own, which `style-src` governs.
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          // blob: is the overworld: Phaser builds textures from canvases and
          // hands them back to the page as object URLs.
          "img-src 'self' data: blob:",
          "connect-src 'self'",
          "worker-src 'self' blob:",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    });

    Tags.of(site).add("service", SERVICE.SITE);

    const publish = (id: string, parameterName: string, value: string) =>
      new ssm.StringParameter(this, id, { parameterName, stringValue: value });

    publish("SiteBucketName", SSM.site.bucketName, site.bucketName);
    if (site.deployRoleArn) {
      publish("SiteDeployRoleArn", SSM.site.deployRoleArn, site.deployRoleArn);
    }
    publish(
      "SiteDistributionId",
      SSM.site.distributionId,
      site.distribution.distributionId,
    );
    // The publish step and any check reach the site by this before DNS
    // propagates, and by the vanity host after.
    publish(
      "SiteDistributionDomain",
      SSM.site.distributionDomain,
      site.distribution.distributionDomainName,
    );
    if (siteHost) publish("SiteHost", SSM.site.host, siteHost);

    site.exportOutputs({ prefix: "Site" });
  }
}
