// Simplified infrastructure sketch for the Booking API.
//
// REVIEW ARTIFACT ONLY — not deployed, not validated in CI. It is meant to give
// something concrete to read and critique. Do not create real resources from it.

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

const provider = new aws.Provider("aws", {
  region: "us-east-1",
});

// Networking -----------------------------------------------------------------

const vpc = new aws.ec2.Vpc("vpc", {
  cidrBlock: "10.0.0.0/16",
});

const subnet = new aws.ec2.Subnet("subnet", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  mapPublicIpOnLaunch: true,
});

const sg = new aws.ec2.SecurityGroup("sg", {
  vpcId: vpc.id,
  ingress: [
    { protocol: "tcp", fromPort: 3000, toPort: 3000, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 5432, toPort: 5432, cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
});

// Database -------------------------------------------------------------------

const db = new aws.rds.Instance("db", {
  engine: "postgres",
  engineVersion: "16",
  instanceClass: "db.t3.micro",
  allocatedStorage: 20,
  dbName: "platform_interview",
  username: "app",
  password: config.get("dbPassword") ?? "changeme",
  publiclyAccessible: true,
  skipFinalSnapshot: true,
  backupRetentionPeriod: 0,
  vpcSecurityGroupIds: [sg.id],
});

// Container service ----------------------------------------------------------

const cluster = new aws.ecs.Cluster("cluster", {});

const taskRole = new aws.iam.Role("taskRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: { Service: "ecs-tasks.amazonaws.com" },
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment("taskRoleAdmin", {
  role: taskRole.name,
  policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
});

const taskDef = new aws.ecs.TaskDefinition("task", {
  family: "task",
  cpu: "256",
  memory: "512",
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  taskRoleArn: taskRole.arn,
  containerDefinitions: pulumi.interpolate`[
    {
      "name": "app",
      "image": "${config.get("containerImage") ?? "platform-interview-api:latest"}",
      "portMappings": [{ "containerPort": 3000 }],
      "environment": [
        { "name": "DATABASE_URL", "value": "postgres://app:${config.get("dbPassword") ?? "changeme"}@${db.address}:5432/platform_interview" }
      ]
    }
  ]`,
});

const svc = new aws.ecs.Service("svc", {
  cluster: cluster.arn,
  desiredCount: 1,
  launchType: "FARGATE",
  taskDefinition: taskDef.arn,
  networkConfiguration: {
    assignPublicIp: true,
    subnets: [subnet.id],
    securityGroups: [sg.id],
  },
});

export const dbEndpoint = db.address;
export const serviceName = svc.name;
