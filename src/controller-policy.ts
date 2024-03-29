import * as iam from 'aws-cdk-lib/aws-iam';
export enum VersionsLists {
  /*
  * AWS Load Balancer Controller Policy Version 2 for version after version 2.0.0 (include 2.0.0).
  */
  AWS_LOAD_BALANCER_CONTROLLER_POLICY_V2 = 'v2',
}

const awsLoadBalancerControllerPolicyV2 = [

  {
    Effect: 'Allow',
    Action: [
      'iam:CreateServiceLinkedRole',
      'ec2:DescribeAccountAttributes',
      'ec2:DescribeAddresses',
      'ec2:DescribeAvailabilityZones',
      'ec2:DescribeInternetGateways',
      'ec2:DescribeVpcs',
      'ec2:DescribeSubnets',
      'ec2:DescribeSecurityGroups',
      'ec2:DescribeInstances',
      'ec2:DescribeNetworkInterfaces',
      'ec2:DescribeTags',
      'ec2:GetCoipPoolUsage',
      'ec2:DescribeCoipPools',
      'elasticloadbalancing:DescribeLoadBalancers',
      'elasticloadbalancing:DescribeLoadBalancerAttributes',
      'elasticloadbalancing:DescribeListeners',
      'elasticloadbalancing:DescribeListenerCertificates',
      'elasticloadbalancing:DescribeSSLPolicies',
      'elasticloadbalancing:DescribeRules',
      'elasticloadbalancing:DescribeTargetGroups',
      'elasticloadbalancing:DescribeTargetGroupAttributes',
      'elasticloadbalancing:DescribeTargetHealth',
      'elasticloadbalancing:DescribeTags',
    ],
    Resource: '*',
  },
  {
    Effect: 'Allow',
    Action: [
      'cognito-idp:DescribeUserPoolClient',
      'acm:ListCertificates',
      'acm:DescribeCertificate',
      'iam:ListServerCertificates',
      'iam:GetServerCertificate',
      'waf-regional:GetWebACL',
      'waf-regional:GetWebACLForResource',
      'waf-regional:AssociateWebACL',
      'waf-regional:DisassociateWebACL',
      'wafv2:GetWebACL',
      'wafv2:GetWebACLForResource',
      'wafv2:AssociateWebACL',
      'wafv2:DisassociateWebACL',
      'shield:GetSubscriptionState',
      'shield:DescribeProtection',
      'shield:CreateProtection',
      'shield:DeleteProtection',
    ],
    Resource: '*',
  },
  {
    Effect: 'Allow',
    Action: [
      'ec2:AuthorizeSecurityGroupIngress',
      'ec2:RevokeSecurityGroupIngress',
    ],
    Resource: '*',
  },
  {
    Effect: 'Allow',
    Action: [
      'ec2:CreateSecurityGroup',
    ],
    Resource: '*',
  },
  {
    Effect: 'Allow',
    Action: [
      'ec2:CreateTags',
    ],
    Resource: 'arn:aws:ec2:*:*:security-group/*',
    Condition: {
      StringEquals: {
        'ec2:CreateAction': 'CreateSecurityGroup',
      },
      Null: {
        'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
      },
    },
  },
  {
    Effect: 'Allow',
    Action: [
      'ec2:CreateTags',
      'ec2:DeleteTags',
    ],
    Resource: 'arn:aws:ec2:*:*:security-group/*',
    Condition: {
      Null: {
        'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
        'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
      },
    },
  },
  {
    Effect: 'Allow',
    Action: [
      'ec2:AuthorizeSecurityGroupIngress',
      'ec2:RevokeSecurityGroupIngress',
      'ec2:DeleteSecurityGroup',
    ],
    Resource: '*',
    Condition: {
      Null: {
        'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
      },
    },
  },
  {
    Effect: 'Allow',
    Action: [
      'elasticloadbalancing:CreateLoadBalancer',
      'elasticloadbalancing:CreateTargetGroup',
    ],
    Resource: '*',
    Condition: {
      Null: {
        'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
      },
    },
  },
  {
    Effect: 'Allow',
    Action: [
      'elasticloadbalancing:CreateListener',
      'elasticloadbalancing:DeleteListener',
      'elasticloadbalancing:CreateRule',
      'elasticloadbalancing:DeleteRule',
    ],
    Resource: '*',
  },
  {
    Effect: 'Allow',
    Action: [
      'elasticloadbalancing:AddTags',
      'elasticloadbalancing:RemoveTags',
    ],
    Resource: [
      'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
      'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
      'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*',
    ],
    Condition: {
      Null: {
        'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
        'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
      },
    },
  },
  {
    Effect: 'Allow',
    Action: [
      'elasticloadbalancing:AddTags',
      'elasticloadbalancing:RemoveTags',
    ],
    Resource: [
      'arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*',
      'arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*',
      'arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*',
      'arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*',
    ],
  },
  {
    Effect: 'Allow',
    Action: [
      'elasticloadbalancing:ModifyLoadBalancerAttributes',
      'elasticloadbalancing:SetIpAddressType',
      'elasticloadbalancing:SetSecurityGroups',
      'elasticloadbalancing:SetSubnets',
      'elasticloadbalancing:DeleteLoadBalancer',
      'elasticloadbalancing:ModifyTargetGroup',
      'elasticloadbalancing:ModifyTargetGroupAttributes',
      'elasticloadbalancing:DeleteTargetGroup',
    ],
    Resource: '*',
    Condition: {
      Null: {
        'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
      },
    },
  },
  {
    Effect: 'Allow',
    Action: [
      'elasticloadbalancing:RegisterTargets',
      'elasticloadbalancing:DeregisterTargets',
    ],
    Resource: 'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
  },
  {
    Effect: 'Allow',
    Action: [
      'elasticloadbalancing:SetWebAcl',
      'elasticloadbalancing:ModifyListener',
      'elasticloadbalancing:AddListenerCertificates',
      'elasticloadbalancing:RemoveListenerCertificates',
      'elasticloadbalancing:ModifyRule',
    ],
    Resource: '*',


  },

];

/**
 * awsLoadBalancerPolicy class ,help you add policy to your Iam Role for service account.
 */
export class AwsLoadBalancerPolicy {
  public static addPolicy(version: string, role: any) :any {
    if (version == 'v2') {
      awsLoadBalancerControllerPolicyV2.forEach(element => {
        role.addToPolicy(iam.PolicyStatement.fromJson(element));
      });
      return role;
    }
  }
};