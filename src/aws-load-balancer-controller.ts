import * as path from 'path';
import * as cdk8s from 'cdk8s';
import { Construct } from 'constructs';
import * as k8s from './imports/k8s';

export interface EnvVar {
  /**
     * Name of the environment variable. Must be a C_IDENTIFIER.
     *
     * @schema io.k8s.api.core.v1.EnvVar#name
     */
  readonly name: string;

  /**
     * Variable references $(VAR_NAME) are expanded using the previous defined environment variables in the container and any service environment variables. If a variable cannot be resolved, the reference in the input string will be unchanged. The $(VAR_NAME) syntax can be escaped with a double $$, ie: $$(VAR_NAME). Escaped references will never be expanded, regardless of whether the variable exists or not. Defaults to "".
     *
     * @default .
     * @schema io.k8s.api.core.v1.EnvVar#value
     */
  readonly value?: string;
}

export interface AwsLoadBalancerControllerOptions {
  /**
   * Install cert-manager
   * @default - true
   */
  readonly certManager?: boolean;
  /**
   * Extra labels to associate with resources.
   * @default - none
   */
  readonly labels?: { [name: string]: string };
  /**
   * Default Namespace for aws-load-balancer-controller.
   * @default - kube-system
   */
  readonly namespace?: string ;
  /**
   * Kubernetes Cluster Name for aws-load-balancer-controller.
   * @default - None
   */
  readonly clusterName: string ;
  /**
   * service account for aws-load-balancer-controller.
   *
   * @default - true
   */
  readonly createServiceAccount?: boolean;
  /**
   * Service Account Name for aws-load-balancer-controller.
   * @default - aws-load-balancer-controller
   */
  readonly serviceAccountName: string;
  /**
   * Default image for aws-load-balancer-controller.
   * @default - docker.io/amazon/aws-aws-load-balancer-controller:v1.1.9
   */
  readonly image?: string;
  /**
   * Another Args for aws-load-balancer-controller.
   * @default - None
   */
  readonly args?: string[];
  /**
   * Another Args for aws-load-balancer-controller.
   * @default - None
   */
  readonly env?: EnvVar[];
  /**
   * Replicas for aws-load-balancer-controller.
   * @default - 1
   */
  readonly replicas?: number;
  /**
   * Add an annotation so that ArgoCD ignores mutatingwebhook
   */
  readonly argoCertIgnore?: boolean;
}
/**
 * Generate aws-load-balancer-controller config yaml.
 * see https://github.com/kubernetes-sigs/aws-aws-load-balancer-controller/blob/master/docs/install/v2_0_0_full.yaml
*/
export class AwsLoadBalancerController extends Construct {
  /**
   * Install cert manager
   *
   * @default - true
   */
  public readonly certManager?: boolean;
  /**
   * service account for aws-load-balancer-controller.
   *
   * @default - true
   */
  public readonly createServiceAccount?: boolean;
  /**
   * Service Account Name for aws-load-balancer-controller.
   */
  public readonly serviceAccountName: string;
  /**
   * Kubernetes Cluster Name for aws-load-balancer-controller.
   */
  public readonly clusterName: string;
  /**
   * Kubernetes Deployment Name for aws-load-balancer-controller.
   */
  public readonly deploymentName: string;
  /**
   * Namespace for aws-load-balancer-controller.
   * @default - kube-system
   */
  public readonly namespace: string ;
  constructor(scope: Construct, id: string, options: AwsLoadBalancerControllerOptions) {
    super(scope, id);
    this.serviceAccountName = options?.serviceAccountName ?? 'aws-load-balancer-controller';
    this.deploymentName = 'aws-load-balancer-controller';
    this.clusterName = options.clusterName;
    this.namespace = options?.namespace ?? 'kube-system';
    this.createServiceAccount = options?.createServiceAccount ?? true;
    this.certManager = options?.certManager ?? true;

    if (this.certManager === true) {
      new cdk8s.Include(this, 'certificate-manager', {
        url: 'https://raw.githubusercontent.com/Hunter-Thompson/my-etcd/main/cert-manager-v1.0.2.yaml',
      });
    }

    new cdk8s.Include(this, 'alb-crds', {
      url: path.join(__dirname, '../crds.yaml'),
    });

    const webhookAnnotations: {[key: string]: string} = options.argoCertIgnore ? { 'cert-manager.io/inject-ca-from': 'kube-system/aws-load-balancer-serving-cert', 'argocd.argoproj.io/compare-options': 'IgnoreExtraneous', 'argocd.argoproj.io/hook': 'Skip' } : { 'cert-manager.io/inject-ca-from': 'kube-system/aws-load-balancer-serving-cert' };


    new k8s.KubeMutatingWebhookConfigurationV1Beta1(this, 'aws-load-balancer-webhook', {
      metadata: {
        annotations: webhookAnnotations,
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-webhook',
      },
      webhooks: [
        {
          clientConfig: {
            caBundle: 'Cg==',
            service: {
              name: 'aws-load-balancer-webhook-service',
              namespace: this.namespace,
              path: '/mutate-v1-pod',
            },
          },
          failurePolicy: 'Fail',
          name: 'mpod.elbv2.k8s.aws',
          namespaceSelector: {
            matchExpressions: [
              {
                key: 'elbv2.k8s.aws/pod-readiness-gate-inject',
                operator: 'In',
                values: ['enabled'],
              },
            ],
          },
          rules: [{
            apiGroups: [''],
            apiVersions: ['v1'],
            operations: [
              'CREATE',
            ],
            resources: ['pods'],
          }],
          sideEffects: 'None',
        },
        {
          clientConfig: {
            caBundle: 'Cg==',
            service: {
              name: 'aws-load-balancer-webhook-service',
              namespace: this.namespace,
              path: '/mutate-elbv2-k8s-aws-v1beta1-targetgroupbinding',
            },
          },
          failurePolicy: 'Fail',
          name: 'mtargetgroupbinding.elbv2.k8s.aws',
          rules: [{
            apiGroups: ['elbv2.k8s.aws'],
            apiVersions: ['v1beta1'],
            operations: [
              'CREATE',
              'UPDATE',
            ],
            resources: ['targetgroupbindings'],
          }],
          sideEffects: 'None',
        },
      ],
    });
    if (options.createServiceAccount === true) {
      new k8s.KubeServiceAccount(this, 'aws-load-balancer-controller-sa', {
        metadata: {
          labels: {
            'app.kubernetes.io/component': 'controller',
            'app.kubernetes.io/name': this.serviceAccountName,
            ...options.labels,
          },
          name: this.serviceAccountName,
          namespace: this.namespace,
        },
      });
    }

    new k8s.KubeRole(this, 'aws-load-balancer-controller-leader-election-role', {
      metadata: {
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-controller-leader-election-role',
        namespace: this.namespace,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['configmaps'],
          verbs: ['create'],
        }, {
          apiGroups: [''],
          resources: ['configmaps'],
          resourceNames: ['aws-load-balancer-controller-leader'],
          verbs: ['get', 'update', 'patch'],
        },
      ],
    });

    new cdk8s.ApiObject(this, 'leader-cluster-role', {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRole',
      metadata: {
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: `${this.serviceAccountName}-role`,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['endpoints'],
          verbs: [
            'get',
            'list',
            'watch',
          ],
        },
        {
          apiGroups: [''],
          resources: ['events'],
          verbs: [
            'create',
            'patch',
          ],
        },
        {
          apiGroups: [''],
          resources: ['namespaces'],
          verbs: [
            'get',
            'list',
            'watch',
          ],
        },
        {
          apiGroups: [''],
          resources: ['nodes'],
          verbs: [
            'get',
            'list',
            'watch',
          ],
        },
        {
          apiGroups: [''],
          resources: ['pods'],
          verbs: [
            'get',
            'list',
            'watch',
          ],
        },
        {
          apiGroups: [''],
          resources: ['pods/status'],
          verbs: [
            'patch',
            'update',
          ],
        },
        {
          apiGroups: [''],
          resources: ['secrets'],
          verbs: [
            'get',
            'list',
            'watch',
          ],
        },
        {
          apiGroups: [''],
          resources: ['services'],
          verbs: [
            'get',
            'list',
            'patch',
            'update',
            'watch',
          ],
        },
        {
          apiGroups: [''],
          resources: ['services/status'],
          verbs: [
            'patch',
            'update',
          ],
        },
        {
          apiGroups: ['elbv2.k8s.aws'],
          resources: ['ingressclassparams'],
          verbs: [
            'get',
            'list',
            'watch',
          ],
        },
        {
          apiGroups: ['elbv2.k8s.aws'],
          resources: ['targetgroupbindings'],
          verbs: [
            'create',
            'delete',
            'get',
            'list',
            'patch',
            'update',
            'watch',
          ],
        },
        {
          apiGroups: ['elbv2.k8s.aws'],
          resources: ['targetgroupbindings/status'],
          verbs: [
            'patch',
            'update',
          ],
        },
        {
          apiGroups: ['extensions'],
          resources: ['ingresses'],
          verbs: [
            'get',
            'list',
            'patch',
            'update',
            'watch',
          ],
        },
        {
          apiGroups: ['extensions'],
          resources: ['ingresses/status'],
          verbs: [
            'patch',
            'update',
          ],
        },
        {
          apiGroups: ['networking.k8s.io'],
          resources: ['ingressclasses'],
          verbs: [
            'get',
            'list',
            'watch',
          ],
        },
        {
          apiGroups: ['networking.k8s.io'],
          resources: ['ingresses'],
          verbs: [
            'get',
            'list',
            'patch',
            'update',
            'watch',
          ],
        },
        {
          apiGroups: ['networking.k8s.io'],
          resources: ['ingresses/status'],
          verbs: [
            'patch',
            'update',
          ],
        },
      ],
    });

    new k8s.KubeRoleBinding(this, 'aws-load-balancer-controller-leader-election-rolebinding', {
      metadata: {
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-controller-leader-election-rolebinding',
        namespace: this.namespace,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: 'aws-load-balancer-controller-leader-election-role',
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: this.serviceAccountName,
          namespace: this.namespace,
        },
      ],
    });

    new k8s.KubeClusterRoleBinding(this, 'aws-load-balancer-controller-rolebinding', {
      metadata: {
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-controller-rolebinding',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: `${this.serviceAccountName}-role`,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          namespace: this.namespace,
          name: this.serviceAccountName,
        },
      ],
    });

    new k8s.KubeService(this, 'aws-load-balancer-webhook-service', {
      metadata: {
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-webhook-service',
        namespace: this.namespace,
      },
      spec: {
        ports: [
          {
            port: 443,
            targetPort: 9443,
          },
        ],
        selector: {
          'app.kubernetes.io/component': 'controller',
          'app.kubernetes.io/name': this.serviceAccountName,
        },
      },
    });

    new k8s.KubeDeployment(this, 'aws-load-balancer-controller-deployment', {
      metadata: {
        labels: {
          'app.kubernetes.io/component': 'controller',
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        namespace: this.namespace,
        name: this.deploymentName,
      },
      spec: {
        replicas: options?.replicas ?? 1,
        selector: {
          matchLabels: {
            'app.kubernetes.io/component': 'controller',
            'app.kubernetes.io/name': this.serviceAccountName,
            ...options.labels,
          },
        },
        template: {
          metadata: {
            labels: {
              'app.kubernetes.io/component': 'controller',
              'app.kubernetes.io/name': this.serviceAccountName,
              ...options.labels,
            },
          },
          spec: {
            containers: [{
              name: 'controller',
              image: options?.image ?? 'amazon/aws-alb-ingress-controller:v2.2.0',
              args: this.argsFunc(options.args),
              env: this.envFunc(options.env),
              livenessProbe: {
                failureThreshold: 2,
                httpGet: {
                  path: '/healthz',
                  port: 61779,
                  scheme: 'HTTP',
                },
                initialDelaySeconds: 30,
                timeoutSeconds: 10,
              },
              ports: [
                {
                  containerPort: 9443,
                  name: 'webhook-server',
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  cpu: '200m',
                  memory: '500Mi',
                },
                requests: {
                  cpu: '100m',
                  memory: '200Mi',
                },
              },
              securityContext: {
                allowPrivilegeEscalation: false,
                readOnlyRootFilesystem: true,
                runAsNonRoot: true,
              },
              volumeMounts: [
                {
                  mountPath: '/tmp/k8s-webhook-server/serving-certs',
                  name: 'cert',
                  readOnly: true,
                },
              ],
            }],
            securityContext: {
              fsGroup: 1337,
            },
            serviceAccountName: `${this.serviceAccountName}`,
            terminationGracePeriodSeconds: 10,
            priorityClassName: 'system-cluster-critical',
            volumes: [{
              name: 'cert',
              secret: {
                defaultMode: 420,
                secretName: 'aws-load-balancer-webhook-tls',
              },
            }],
          },
        },
      },
    });

    new cdk8s.ApiObject(this, 'aws-load-balancer-serving-cert', {
      apiVersion: 'cert-manager.io/v1alpha2',
      kind: 'Certificate',
      metadata: {
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-serving-cert',
        namespace: this.namespace,
      },
      spec: {
        dnsNames: [
          'aws-load-balancer-webhook-service.kube-system.svc',
          'aws-load-balancer-webhook-service.kube-system.svc.cluster.local',
        ],
        issuerRef: {
          kind: 'Issuer',
          name: 'aws-load-balancer-selfsigned-issuer',
        },
        secretName: 'aws-load-balancer-webhook-tls',
      },
    });

    new cdk8s.ApiObject(this, 'aws-load-balancer-selfsigned-issuer', {
      apiVersion: 'cert-manager.io/v1alpha2',
      kind: 'Issuer',
      metadata: {
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-selfsigned-issuer',
        namespace: this.namespace,
      },
      spec: {
        selfSigned: {},
      },
    });


    new k8s.KubeValidatingWebhookConfigurationV1Beta1(this, 'aws-load-balancer-selfsigned-issuer-valid', {
      metadata: {
        annotations: webhookAnnotations,
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
          ...options.labels,
        },
        name: 'aws-load-balancer-webhook',
      },
      webhooks: [
        {
          clientConfig: {
            caBundle: 'Cg==',
            service: {
              name: 'aws-load-balancer-webhook-service',
              namespace: this.namespace,
              path: '/validate-elbv2-k8s-aws-v1beta1-targetgroupbinding',
            },
          },
          failurePolicy: 'Fail',
          name: 'vtargetgroupbinding.elbv2.k8s.aws',
          rules: [{
            apiGroups: ['elbv2.k8s.aws'],
            apiVersions: ['v1beta1'],
            operations: [
              'CREATE',
              'UPDATE',
            ],
            resources: ['targetgroupbindings'],
          }],
          sideEffects: 'None',
        },
      ],
    });

  }
  private argsFunc(args?: string[]):string[] {
    const defaultArgs = ['--ingress-class=alb', `--cluster-name=${this.clusterName}`];
    if (args) {
      args.forEach(e => defaultArgs.push(e));
    }
    return defaultArgs;
  }
  private envFunc(envSet?: EnvVar[] | undefined):EnvVar[] | undefined {
    return envSet;
  }
}
