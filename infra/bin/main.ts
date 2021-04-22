#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import 'source-map-support/register';
import { AmplifirePipeline } from '../lib/cicd-stacks/cicd-pipeline-stack-amplifire';
import { AddPermissionsBoundaryToRoles } from '../lib/utils/permission-boundary';

// Declare the app
const app = new cdk.App();

const permissionBoundaryArn = cdk.Fn.importValue(
  'CICDPipelinePermissionsBoundaryArn'
);

// Instantiate pipeline
// Respect cdk bootstrap policy insuring pipelines construct can't create more than what it needs for CI/CD pipeline creation
const amplifirePipelineStack = new AmplifirePipeline(app, 'AmplifirePipeline');

cdk.Aspects.of(amplifirePipelineStack).add(
  new AddPermissionsBoundaryToRoles(permissionBoundaryArn)
);
