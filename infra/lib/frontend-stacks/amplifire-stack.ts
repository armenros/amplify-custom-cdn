import * as core from '@aws-cdk/core';
import * as amplify from '@aws-cdk/aws-amplify';
import * as bootstrapKit from 'aws-bootstrap-kit';

export interface AmplifireStackProps extends core.NestedStackProps {
  stage: string;
  rootDomain?: string;
  serviceName: string;
}

export class AmplifireStack extends core.NestedStack {
  public readonly frontendUrl: string;
  public readonly amplifireAppID: string;

  constructor(
    parent: core.Construct,
    name: string,
    props: AmplifireStackProps
  ) {
    super(parent, name);

    if (props.rootDomain) {
      // const stage = props.stage ?? 'dev';
      this.frontendUrl = `${props.stage}.${props.rootDomain}`;

      const delegatedHostedZone = new bootstrapKit.CrossAccountDNSDelegator(
        this,
        'subzoneDelegation',
        {
          zoneName: this.frontendUrl,
        }
      );

      const amplifyApp = new amplify.App(this, `amplifire-app`, {
        appName: `amplifire`,
        autoBranchCreation: {
          // Automatically connect branches that match a pattern set
          patterns: [
            `${props.stage}*`,
            `${props.stage}/*`,
            `${props.stage}-*`,
            `${props.stage}-*/*`,
          ],
        },

        sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
          oauthToken: core.SecretValue.secretsManager('GITHUB_TOKEN'),
          owner: this.node.tryGetContext('github_alias'),
          repository: this.node.tryGetContext('github_amplifire_repo_name'),
        }),
      });

      const appSpecificBranch = amplifyApp.addBranch(`${props.stage}`);

      appSpecificBranch.addEnvironment('STAGE', `${props.stage}`);

      const domain = amplifyApp.addDomain(this.frontendUrl, {
        enableAutoSubdomain: true,
        autoSubdomainCreationPatterns: ['*', 'pr*'], // regex for branches that should auto register subdomains
      });

      domain.mapRoot(appSpecificBranch);
      domain.mapSubDomain(appSpecificBranch, 'www');

      // amplifyApp.grantPrincipal.addToPrincipalPolicy(amplifyIAMPolicy);

      this.amplifireAppID = amplifyApp.appId;
    }
  }

  // BEGIN GRAVEYARD OF BROKEN DREAMS
  // import * as amplify from '@aws-cdk/aws-ampl
  // import * as route53 from '@aws-cdk/aws-route53';

  // import * as targets from '@aws-cdk/aws-route53-targets';
  // import * as iam from '@aws-cdk/aws-iam';
  // import { Effect } from '@aws-cdk/aws-iam';
  // import * as codebuild from '@aws-cdk/aws-codebuild';
  // import * as codecommit from '@aws-cdk/aws-codecommit';

  // const amplifyIAMPolicy = new iam.PolicyStatement({
  //   effect: Effect.ALLOW,
  //   actions: [
  //     'cloudformation:CreateStack',
  //     'cloudformation:CreateStackSet',
  //     'cloudformation:DeleteStack',
  //     'cloudformation:DeleteStackSet',
  //     'cloudformation:DescribeStackEvents',
  //     'cloudformation:DescribeStackResource',
  //     'cloudformation:DescribeStackResources',
  //     'cloudformation:DescribeStackSet',
  //     'cloudformation:DescribeStackSetOperation',
  //     'cloudformation:DescribeStacks',
  //     'cloudformation:UpdateStack',
  //     'cloudformation:UpdateStackSet',
  //     'cloudfront:CreateCloudFrontOriginAccessIdentity',
  //     'cloudfront:CreateDistribution',
  //     'cloudfront:DeleteCloudFrontOriginAccessIdentity',
  //     'cloudfront:DeleteDistribution',
  //     'cloudfront:GetCloudFrontOriginAccessIdentity',
  //     'cloudfront:GetCloudFrontOriginAccessIdentityConfig',
  //     'cloudfront:GetDistribution',
  //     'cloudfront:GetDistributionConfig',
  //     'cloudfront:TagResource',
  //     'cloudfront:UntagResource',
  //     'cloudfront:UpdateCloudFrontOriginAccessIdentity',
  //     'cloudfront:UpdateDistribution',
  //     'events:DeleteRule',
  //     'events:DescribeRule',
  //     'events:PutRule',
  //     'events:PutTargets',
  //     'events:RemoveTargets',
  //     'iam:CreateRole',
  //     'iam:DeleteRole',
  //     'iam:DeleteRolePolicy',
  //     'iam:GetRole',
  //     'iam:GetUser',
  //     'iam:PassRole',
  //     'iam:PutRolePolicy',
  //     'iam:UpdateRole',
  //     'lambda:AddPermission',
  //     'lambda:CreateFunction',
  //     'lambda:DeleteFunction',
  //     'lambda:GetFunction',
  //     'lambda:GetFunctionConfiguration',
  //     'lambda:InvokeAsync',
  //     'lambda:InvokeFunction',
  //     'lambda:RemovePermission',
  //     'lambda:UpdateFunctionCode',
  //     'lambda:UpdateFunctionConfiguration',
  //     's3:*',
  //     'amplify:*',
  //     'medialive:*',
  //     'mediastore:*',
  //     'mediapackage:*',
  //   ],
  //   resources: ['*'],
  // });
  // const domain = amplifyApp.addDomain('')

  // amplifyApp.addDomain(
  //   `${props.serviceName}.${props.stage}.${props.rootDomain}`,
  //   {}
  // );

  // core.Tags.of(this).add(
  //   'ServiceName',
  //   `${props.serviceName}-${props.stage} }`
  // );

  // buildSpec: codebuild.BuildSpec.fromObject({
  //   // Alternatively add a `amplify.yml` to the repo
  //   version: '2.0',
  //   frontend: {
  //     phases: {
  //       preBuild: {
  //         commands: ['npm ci'],
  //       },
  //       build: {
  //         commands: ['yarn build'],
  //       },
  //     },
  //     artifacts: {
  //       baseDirectory: 'public',
  //       files: '**/*',
  //     },
  //   },
  // }),

  // new route53.ARecord(this, 'Alias', {
  //   zone: delegatedHostedZone.hostedZone,
  //   recordName: this.frontendUrl,
  //   target: route53.RecordTarget.fromAlias(
  //     new targets.CloudFrontTarget(this.distribution)
  //   ),
  // });
}
