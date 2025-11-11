# Todo Application on AWS ECS

This project is a full-stack Todo application. The backend is a Java Spring Boot application deployed as a containerized service on Amazon ECS with AWS Fargate. The frontend is a React application hosted on Amazon S3 and distributed globally via Amazon CloudFront. The entire infrastructure is managed as code using the AWS Cloud Development Kit (CDK).

## Architecture

- **Backend**: A Spring Boot application running in a Docker container, managed by ECS with Fargate.
- **Frontend**: A React single-page application (SPA) hosted in an S3 bucket.
- **API**: An Application Load Balancer (ALB) routes traffic to the backend ECS service.
- **CDN**: Amazon CloudFront serves the frontend content from S3 for low-latency access.
- **Database**: Amazon DynamoDB provides a NoSQL database for storing application data.
- **Authentication**: Amazon Cognito manages user sign-up and sign-in.
- **Infrastructure as Code**: AWS CDK defines all cloud resources in TypeScript.

---

## Prerequisites

- **AWS CLI**: Configured with an active AWS account.
- **Node.js and npm**: For running the AWS CDK and the frontend application.
- **AWS CDK Toolkit**: `npm install -g aws-cdk`
- **Java 17+ & Maven**: For building the backend application.
- **Docker**: For building and publishing the backend container image.

---

## First-Time Installation

Follow these steps to deploy the entire application from scratch.

### 1. Bootstrap AWS Environment for CDK

If you have never used CDK in your AWS account/region before, you must bootstrap it first.

```bash
# Navigate to the cdk directory
cd cdk
npm install
cdk bootstrap
```

### 2. Deploy the Infrastructure

From the `cdk` directory, deploy all the backend and frontend infrastructure.

```bash
# Still in the cdk directory
cdk deploy
```

This command will take several minutes. After it completes, **copy the outputs** from the terminal into a text file. You will need them for the next steps.

### 3. Configure and Deploy the Frontend

Now, set up the React application to communicate with your new backend.

```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install
```

Next, **edit the `src/App.js` file**. Replace the placeholder `API_URL` with the `EcsLoadBalancerDNS` output from the CDK deployment.

Now, build the frontend application and sync it to the S3 bucket.

```bash
# Build the React application
npm run build

# Sync the build directory to the S3 bucket
# Replace <EcsBucketName> with the output from the CDK deployment
aws s3 sync build/ s3://<EcsBucketName>
```

### 4. Build and Deploy the Backend

Finally, build and push the container image for your Spring Boot application.

```bash
# Navigate to the backend directory
cd ../backend

# Build the Java application
mvn clean package

# Log Docker into your AWS ECR repository
# Replace <REGION> and <EcsRepositoryUri> with the outputs from the CDK deployment
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <EcsRepositoryUri>

# Build the Docker image
docker build -t ecs-todo-app-backend .

# Tag the image for the ECR repository
docker tag ecs-todo-app-backend:latest <EcsRepositoryUri>:latest

# Push the image to ECR
docker push <EcsRepositoryUri>:latest
```

Once the image is pushed, the ECS service will automatically pull it and start the backend task. Your application is now fully deployed! You can access it via the `EcsDistributionDomainName` (CloudFront URL) from the CDK outputs.

---

## How to Update the Application

### Updating the Backend

If you change the backend Java code, you must rebuild and redeploy the container.

1.  **Build the application**: `cd backend && mvn clean package`
2.  **Build and push the new Docker image**: Follow step 4 from the first-time setup to build and push the new image to ECR.
3.  **Force a new deployment**: To make ECS pull the latest image, run the following command. (You only need to do this once to get the cluster/service names).

    ```bash
    aws ecs update-service --cluster <CLUSTER_NAME> --service <SERVICE_NAME> --force-new-deployment
    ```

### Updating the Frontend

If you change the frontend React code, you must rebuild and redeploy to S3, then invalidate the CloudFront cache.

1.  **Build the application**: `cd frontend && npm run build`
2.  **Sync to S3**: `aws s3 sync build/ s3://<EcsBucketName>`
3.  **Invalidate CloudFront Cache**: This ensures users get the latest version of your site.

    ```bash
    aws cloudfront create-invalidation --distribution-id <EcsDistributionId> --paths "/*"
    ```
