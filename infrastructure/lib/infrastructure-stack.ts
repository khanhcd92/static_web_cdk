import * as cdk from '@aws-cdk/core';
import { BlockPublicAccess, Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { CloudFrontWebDistribution, OriginAccessIdentity } from '@aws-cdk/aws-cloudfront';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';


export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const myBucket = new Bucket(this, "static-website-bucket", {
      bucketName: 'static-web-sample-s3',
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: "index.html"
    });

    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });

    const policyStatement = new PolicyStatement();
    policyStatement.addActions('s3:GetObject');
    policyStatement.addResources(`${myBucket.bucketArn}/*`);
    policyStatement.addCanonicalUserPrincipal(oia.cloudFrontOriginAccessIdentityS3CanonicalUserId);
    myBucket.addToResourcePolicy(policyStatement);

    new CloudFrontWebDistribution(this, 'static-website-cf', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: myBucket,
            originAccessIdentity: oia
          },
          behaviors: [
            { isDefaultBehavior: true }
          ]
        }
      ]
    });

    const deployment = new s3Deployment.BucketDeployment(this, "deployStaticWebsite", {
      sources: [s3Deployment.Source.asset("../angular-sample-web/dist")],
      destinationBucket: myBucket,
    });
  }
}
