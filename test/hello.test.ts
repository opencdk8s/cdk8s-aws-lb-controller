import { Chart, Testing } from 'cdk8s';
import { AwsLoadBalancerController } from '../src/index';

test('lb-controller', () => {
  const app = Testing.app();
  const chart = new Chart(app, 'test');
  new AwsLoadBalancerController(chart, 'es', {
    clusterName: 'cluster',
    certManager: true,
    serviceAccountName: 'aws-load-balancer-controller',
    createServiceAccount: false,
    argoCertIgnore: true,
    
  });
  expect(Testing.synth(chart)).toMatchSnapshot();
});
