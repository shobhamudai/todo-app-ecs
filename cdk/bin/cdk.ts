#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { EcsTodoStack } from '../lib/cdk-stack'; // The file is cdk-stack.ts, but the class inside is EcsTodoStack

const app = new cdk.App();

// Instantiate the new, fully-containerized ECS stack
new EcsTodoStack(app, 'EcsTodoStack', {
  /* 
   * It's a good practice to specify the environment for your stacks.
   * This makes them region and account-specific.
   * Uncomment the next line to use the AWS CLI's default profile.
   */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
