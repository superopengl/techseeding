import { Stack, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Repository, TagMutability } from "aws-cdk-lib/aws-ecr";

export class KidPlayAiRepoStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.appRepo = new Repository(this, "AppRepo", {
      repositoryName: "kpai",
      imageScanOnPush: true,
      imageTagMutability: TagMutability.MUTABLE,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    new CfnOutput(this, "EcrRepositoryUri", { value: this.appRepo.repositoryUri });
    new CfnOutput(this, "EcrRepositoryName", { value: this.appRepo.repositoryName });
  }
}
