import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class EcsTodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- USER AUTHENTICATION RESOURCES ---
    const ecsUserPool = new cognito.UserPool(this, 'EcsTodoUserPool', {
      userPoolName: 'EcsTodoUserPool',
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
    });

    const ecsUserPoolClient = new cognito.UserPoolClient(this, "EcsUserPoolClient", {
        userPool: ecsUserPool,
    });


    // --- BACKEND RESOURCES ---

    const ecsTodoTable = new dynamodb.Table(this, 'EcsTodoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'EcsTodos',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    // Add the GSI for querying by userId
    ecsTodoTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    const repository = new ecr.Repository(this, 'EcsTodoAppRepository', {
      repositoryName: 'ecs-todo-app-backend',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    const cluster = new ecs.Cluster(this, 'EcsTodoCluster', {});

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'EcsTodoFargateService', {
      cluster: cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
        containerPort: 8080,
        environment: {
          TABLE_NAME: ecsTodoTable.tableName,
          // FIX: Add the missing environment variable for the Cognito Issuer URI
          SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: `https://cognito-idp.${this.region}.amazonaws.com/${ecsUserPool.userPoolId}`,
        },
      },
      publicLoadBalancer: true,
      healthCheckGracePeriod: cdk.Duration.seconds(150),
    });

    ecsTodoTable.grantReadWriteData(fargateService.taskDefinition.taskRole);

    fargateService.targetGroup.configureHealthCheck({
      path: '/actuator/health',
      interval: cdk.Duration.seconds(30),
      healthyThresholdCount: 2,
      timeout: cdk.Duration.seconds(5),
    });

    // --- FRONTEND RESOURCES (SECURE PATTERN) ---

    const websiteBucket = new s3.Bucket(this, 'EcsWebsiteBucket', {
      websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'EcsOAI');
    websiteBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'EcsDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket,
            originAccessIdentity: originAccessIdentity,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
          ],
        },
        {
          customOriginSource: {
            domainName: fargateService.loadBalancer.loadBalancerDnsName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [
            {
              pathPattern: '/api/*',
              viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
              forwardedValues: {
                queryString: true,
                cookies: { forward: 'all' },
                headers: ['*'],
              },
              defaultTtl: cdk.Duration.seconds(0),
              minTtl: cdk.Duration.seconds(0),
              maxTtl: cdk.Duration.seconds(0),
            },
          ],
        },
      ],
    });


    // --- STACK OUTPUTS ---

    new cdk.CfnOutput(this, 'EcsLoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'EcsRepositoryUri', { value: repository.repositoryUri });
    new cdk.CfnOutput(this, 'EcsBucketName', { value: websiteBucket.bucketName });
    new cdk.CfnOutput(this, 'EcsDistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'EcsDistributionDomainName', { value: distribution.distributionDomainName });
    new cdk.CfnOutput(this, "EcsUserPoolId", { value: ecsUserPool.userPoolId });
    new cdk.CfnOutput(this, "EcsUserPoolClientId", { value: ecsUserPoolClient.userPoolClientId });
  }
}
