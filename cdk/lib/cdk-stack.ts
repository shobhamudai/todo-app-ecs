import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class EcsTodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- BACKEND RESOURCES ---

    const ecsTodoTable = new dynamodb.Table(this, 'EcsTodoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'EcsTodos',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
        },
      },
      publicLoadBalancer: true,
      // FIX: Set a grace period that is longer than the time needed for the health check
      healthCheckGracePeriod: cdk.Duration.seconds(150),
    });

    ecsTodoTable.grantReadWriteData(fargateService.taskDefinition.taskRole);

    // FIX: Configure the Target Group health check to be less strict
    fargateService.targetGroup.configureHealthCheck({
      path: '/actuator/health',
      interval: cdk.Duration.seconds(30), // Check more frequently
      healthyThresholdCount: 2, // Require fewer successful checks
      timeout: cdk.Duration.seconds(5),
    });

    // --- FRONTEND RESOURCES (SECURE PATTERN) ---

    const websiteBucket = new s3.Bucket(this, 'EcsWebsiteBucket', {
      websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'EcsOAI');
    websiteBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'EcsDistribution', {
        defaultBehavior: {
            origin: new origins.S3Origin(websiteBucket, {
                originAccessIdentity: originAccessIdentity,
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: 'index.html',
    });

    // --- STACK OUTPUTS ---

    new cdk.CfnOutput(this, 'EcsLoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'EcsRepositoryUri', { value: repository.repositoryUri });
    new cdk.CfnOutput(this, 'EcsBucketName', { value: websiteBucket.bucketName });
    new cdk.CfnOutput(this, 'EcsDistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'EcsDistributionDomainName', { value: distribution.distributionDomainName });
  }
}
