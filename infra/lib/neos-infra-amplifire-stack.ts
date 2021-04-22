import { CfnOutput, Construct, Stack, StackProps, Tags } from '@aws-cdk/core';
import { AmplifireStack } from './frontend-stacks/amplifire-stack';
export interface NeosAmplifireInfraStackProps extends StackProps {
  stage: string;
}

export class NeosAmplifireInfraStack extends Stack {
  public readonly appStackID: CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    props: NeosAmplifireInfraStackProps
  ) {
    super(scope, id, props);

    console.log('PROPS INSIDE ARE: ', props);

    Tags.of(this).add('ServiceName', 'ArubaniWeb');

    const amplifire = new AmplifireStack(this, 'AmplifireStack', {
      serviceName: this.node.tryGetContext('amplifire_service_name'),
      stage: props.stage,
      rootDomain: `${this.node.tryGetContext('root_domain')}`,
    });

    this.appStackID = new CfnOutput(this, 'nestedAppStackID', {
      value: amplifire.amplifireAppID,
    });
  }
}
