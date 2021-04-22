/* eslint-disable @typescript-eslint/no-non-null-assertion */
//TODO: Need to add linter and prettier configs to this POS
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { PolicyStatement } from '@aws-cdk/aws-iam';
// import * as core from '@aws-cdk/core';
import {
  CfnOutput,
  CfnResource,
  Construct,
  SecretValue,
  Stack,
  StackProps,
  Stage,
  StageProps,
  Token,
  Fn,
} from '@aws-cdk/core';
import {
  CdkPipeline,
  ShellScriptAction,
  SimpleSynthAction,
} from '@aws-cdk/pipelines';
import { config, Organizations, SharedIniFileCredentials } from 'aws-sdk';
import { NeosAmplifireInfraStack } from '../gruv-neos-infra-amplifire-stack';

export class AmplifireStage extends Stage {
  public readonly appStackID: CfnOutput;

  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    console.log('ID IS ', id);
    console.log('PROPS are: ', props);

    new NeosAmplifireInfraStack(this, 'AmplifireAppStack', {
      ...props,
      stage: id.toLowerCase(),
    });
  }
}

export class AmplifirePipeline extends Stack {
  public readonly consoleURL: CfnOutput;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const pipeline = new CdkPipeline(this, 'AmplifirePipeline', {
      //Defines a repo, and an action on the source repo we should listen for
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        branch: this.node.tryGetContext('github_repo_branch'),
        oauthToken: SecretValue.secretsManager('GITHUB_TOKEN'),
        owner: this.node.tryGetContext('github_alias'),
        repo: this.node.tryGetContext('github_repo_name'),
      }),

      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        // If we are using the mono repo examples then adding the proper prefix
        subdirectory: 'infra',
        // buildCommand: 'npm run build:all',
        buildCommand: 'npm run build',
        rolePolicyStatements: [
          new PolicyStatement({
            actions: [
              'organizations:ListAccounts',
              'organizations:ListTagsForResource',
            ],
            resources: ['*'],
          }),
        ],
      }),
      cloudAssemblyArtifact: cloudAssemblyArtifact,
    });

    new CfnOutput(this, 'PipelineConsoleUrl', {
      value: `https://${
        Stack.of(this).region
      }.console.aws.amazon.com/codesuite/codepipeline/pipelines/${
        pipeline.codePipeline.pipelineName
      }/view?region=${Stack.of(this).region}`,
    });

    const AWS_PROFILE = 'cicd';
    if (!process.env.CODEBUILD_BUILD_ID) {
      config.credentials = new SharedIniFileCredentials({
        profile: AWS_PROFILE,
      });
    }

    const orgClient = new Organizations({ region: 'us-east-1' });

    orgClient
      .listAccounts()
      .promise()
      .then(async (results) => {
        const stagesDetails = [];
        if (results.Accounts) {
          for (const account of results.Accounts) {
            const tags = (
              await orgClient
                .listTagsForResource({ ResourceId: account.Id! })
                .promise()
            ).Tags;
            if (tags && tags.length > 0) {
              const accountType = tags.find((tag) => tag.Key === 'AccountType')!
                .Value;

              // if (accountType === 'PLAYGROUND') {
              //   pipeline.
              // }

              if (accountType === 'STAGE') {
                const stageName = tags.find((tag) => tag.Key === 'StageName')!
                  .Value;
                const stageOrder = tags.find((tag) => tag.Key === 'StageOrder')!
                  .Value;
                stagesDetails.push({
                  name: stageName,
                  accountId: account.Id,
                  order: parseInt(stageOrder),
                });
              }
            }
          }
        }
        stagesDetails.sort((a, b) => (a.order > b.order ? 1 : -1));
        for (const stageDetailsIndex in stagesDetails) {
          const stageDetails = stagesDetails[stageDetailsIndex];
          console.log('stageDetails, ', stageDetails);
          pipeline.addApplicationStage(
            new AmplifireStage(this, stageDetails.name, {
              env: { account: stageDetails.accountId },
            })
          );
        }
      })
      .catch((error) => {
        switch (error.code) {
          case 'CredentialsError': {
            console.error(
              '\x1b[31m',
              `Failed to get credentials for "${AWS_PROFILE}" profile. Make sure to run "aws configure sso --profile ${AWS_PROFILE} && aws sso login --profile ${AWS_PROFILE} && npx cdk-sso-sync ${AWS_PROFILE}"\n\n`
            );
            break;
          }
          case 'ExpiredTokenException': {
            console.error(
              '\x1b[31m',
              `Token expired, run "aws sso login --profile ${AWS_PROFILE} && npx cdk-sso-sync ${AWS_PROFILE}"\n\n`
            );
            break;
          }
          case 'AccessDeniedException': {
            console.error(
              '\x1b[31m',
              `Unable to call the AWS Organizations ListAccounts API. Make sure to add a PolicyStatement with the organizations:ListAccounts action to your synth action`
            );
            break;
          }
          default: {
            console.error(error.message);
          }
        }
        //force CDK to fail in case of an unknown exception
        // process.exit(1);
      });
  }
}
