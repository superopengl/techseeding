import { Stack, CfnOutput } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";

export class KidPlayAiCdnCertStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const { domainName, hostedZoneName } = props;

    const zone = HostedZone.fromLookup(this, "Zone", { domainName: hostedZoneName });

    this.certificate = new Certificate(this, "Cert", {
      domainName,
      validation: CertificateValidation.fromDns(zone),
    });

    new CfnOutput(this, "CertArn", { value: this.certificate.certificateArn });
  }
}
