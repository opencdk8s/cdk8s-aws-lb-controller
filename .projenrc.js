const { ConstructLibraryCdk8s } = require('projen/lib/cdk8s');

const CDK_VERSION = '2.8.0';

const project = new ConstructLibraryCdk8s({
  author: 'Hunter Thompson',
  authorAddress: 'aatman@auroville.org.in',
  cdk8sVersion: '2.1.23',
  constructsVersion: '10.0.5',
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
    `aws-cdk-lib@${CDK_VERSION}`,
  ],
  releaseEveryCommit: true,
  devDeps: [
    '@types/js-yaml@^3.12.5',
    'js-yaml@^3.14.0',
    `aws-cdk-lib@${CDK_VERSION}`,
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
