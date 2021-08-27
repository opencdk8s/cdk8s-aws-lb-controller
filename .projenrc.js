const { ConstructLibraryCdk8s } = require('projen');

const CDK_VERSION = '1.113.0';

const project = new ConstructLibraryCdk8s({
  author: 'Hunter Thompson',
  authorAddress: 'aatman@auroville.org.in',
  cdk8sVersion: '1.0.0-beta.11',
  cdk8sPlusVersion: '1.0.0-beta.15',
  constructsVersion: '3.3.134',
  constructsVersionPinning: true,
  cdk8sPlusVersionPinning: true,
  cdk8sVersionPinning: true,
  defaultReleaseBranch: 'development',
  stability: 'experimental',
  jsiiFqn: 'projen.ConstructLibraryCdk8s',
  name: '@opencdk8s/cdk8s-aws-lb-controller',
  keywords: ['aws', 'cdk8s', 'aws-load-balancer-controller', 'cdk'],
  npmAccess: 'public',
  repositoryUrl: 'https://github.com/opencdk8s/cdk8s-aws-lb-controller',
  python: {
    distName: 'cdk8s-aws-lb-controller',
    module: 'cdk8s_aws_lb_controller',
  },
  peerDeps: [
    `@aws-cdk/aws-iam@${CDK_VERSION}`,
    `@aws-cdk/core@${CDK_VERSION}`,
  ],
  releaseEveryCommit: true,
  devDeps: [
    '@types/js-yaml@^3.12.5',
    'js-yaml@^3.14.0',
    `@aws-cdk/aws-iam@${CDK_VERSION}`,
    `@aws-cdk/core@${CDK_VERSION}`,
  ],
  bundledDeps: [
    '@types/js-yaml@^3.12.5',
    'js-yaml@^3.14.0',
  ],
  dependabot: false,
  pullRequestTemplate: false,
  codeCov: true,
  clobber: false,
  readme: true,
  mergify: true,
});

const common_exclude = ['cdk.out', 'package.json', 'yarn-error.log', 'coverage', '.DS_Store', '.idea', '.vs_code'];
project.gitignore.exclude(...common_exclude);

project.npmignore.include('crds.yaml');
project.synth();
