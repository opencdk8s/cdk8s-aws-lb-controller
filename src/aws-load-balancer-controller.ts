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
        url: 'https://github.com/jetstack/cert-manager/releases/download/v1.1.1/cert-manager.yaml',
      });

      new k8s.KubeMutatingWebhookConfigurationV1Beta1(this, 'aws-load-balancer-webhook', {
        metadata: {
          annotations: {
            'cert-manager.io/inject-ca-from': 'kube-system/aws-load-balancer-serving-cert',
          },
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
                image: options?.image ?? 'amazon/aws-alb-ingress-controller:v2.1.3',
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
          annotations: {
            'cert-manager.io/inject-ca-from': 'kube-system/aws-load-balancer-serving-cert',
          },
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
    } else {
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
                image: options?.image ?? 'amazon/aws-alb-ingress-controller:v2.1.3',
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
              }],
              securityContext: {
                fsGroup: 1337,
              },
              serviceAccountName: `${this.serviceAccountName}`,
              terminationGracePeriodSeconds: 10,
            },
          },
        },
      });

    }

    new cdk8s.ApiObject(this, 'aws-load-balancer-controller-crd', {
      apiVersion: 'apiextensions.k8s.io/v1beta1',
      kind: 'CustomResourceDefinition',
      metadata: {
        annotations: {
          'controller-gen.kubebuilder.io/version': 'v0.4.0',
        },
        labels: {
          'app.kubernetes.io/name': this.serviceAccountName,
        },
        name: 'targetgroupbindings.elbv2.k8s.aws',
      },
      spec: {
        additionalPrinterColumns: [
          {
            JSONPath: '.spec.serviceRef.name',
            description: "The Kubernetes Service's name",
            name: 'SERVICE-NAME',
            type: 'string',
          },
          {
            JSONPath: '.spec.serviceRef.port',
            description: "The Kubernetes Service's port",
            name: 'SERVICE-PORT',
            type: 'string',
          },
          {
            JSONPath: '.spec.targetType',
            description: "The AWS TargetGroup's TargetType",
            name: 'TARGET-TYPE',
            type: 'string',
          },
          {
            JSONPath: '.spec.targetGroupARN',
            description: "The AWS TargetGroup's Amazon Resource Name",
            name: 'ARN',
            priority: 1,
            type: 'string',
          },
          {
            JSONPath: '.metadata.creationTimestamp',
            name: 'AGE',
            type: 'date',
          },
        ],
        group: 'elbv2.k8s.aws',
        names: {
          categories: [
            'all',
          ],
          kind: 'TargetGroupBinding',
          listKind: 'TargetGroupBindingList',
          plural: 'targetgroupbindings',
          singular: 'targetgroupbinding',
        },
        scope: 'Namespaced',
        subresources: {
          status: {
          },
        },
        validation: {
          openAPIV3Schema: {
            description: 'TargetGroupBinding is the Schema for the TargetGroupBinding API',
            properties: {
              apiVersion: {
                description: 'APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources',
                type: 'string',
              },
              kind: {
                description: 'Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds',
                type: 'string',
              },
              metadata: {
                type: 'object',
              },
              spec: {
                description: 'TargetGroupBindingSpec defines the desired state of TargetGroupBinding',
                properties: {
                  networking: {
                    description: 'networking provides the networking setup for ELBV2 LoadBalancer to access targets in TargetGroup.',
                    properties: {
                      ingress: {
                        description: 'List of ingress rules to allow ELBV2 LoadBalancer to access targets in TargetGroup.',
                        items: {
                          properties: {
                            from: {
                              description: 'List of peers which should be able to access the targets in TargetGroup. At least one NetworkingPeer should be specified.',
                              items: {
                                description: 'NetworkingPeer defines the source/destination peer for networking rules.',
                                properties: {
                                  ipBlock: {
                                    description: 'IPBlock defines an IPBlock peer. If specified, none of the other fields can be set.',
                                    properties: {
                                      cidr: {
                                        description: 'CIDR is the network CIDR. Both IPV4 or IPV6 CIDR are accepted.',
                                        type: 'string',
                                      },
                                    },
                                    required: [
                                      'cidr',
                                    ],
                                    type: 'object',
                                  },
                                  securityGroup: {
                                    description: 'SecurityGroup defines a SecurityGroup peer. If specified, none of the other fields can be set.',
                                    properties: {
                                      groupID: {
                                        description: 'GroupID is the EC2 SecurityGroupID.',
                                        type: 'string',
                                      },
                                    },
                                    required: [
                                      'groupID',
                                    ],
                                    type: 'object',
                                  },
                                },
                                type: 'object',
                              },
                              type: 'array',
                            },
                            ports: {
                              description: 'List of ports which should be made accessible on the targets in TargetGroup. If ports is empty or unspecified, it defaults to all ports with TCP.',
                              items: {
                                properties: {
                                  port: {
                                    'anyOf': [
                                      {
                                        type: 'integer',
                                      },
                                      {
                                        type: 'string',
                                      },
                                    ],
                                    'description': 'The port which traffic must match. When NodePort endpoints(instance TargetType) is used, this must be a numerical port. When Port endpoints(ip TargetType) is used, this can be either numerical or named port on pods. if port is unspecified, it defaults to all ports.',
                                    'x-kubernetes-int-or-string': true,
                                  },
                                  protocol: {
                                    description: 'The protocol which traffic must match. If protocol is unspecified, it defaults to TCP.',
                                    enum: [
                                      'TCP',
                                      'UDP',
                                    ],
                                    type: 'string',
                                  },
                                },
                                type: 'object',
                              },
                              type: 'array',
                            },
                          },
                          required: [
                            'from',
                            'ports',
                          ],
                          type: 'object',
                        },
                        type: 'array',
                      },
                    },
                    type: 'object',
                  },
                  serviceRef: {
                    description: 'serviceRef is a reference to a Kubernetes Service and ServicePort.',
                    properties: {
                      name: {
                        description: 'Name is the name of the Service.',
                        type: 'string',
                      },
                      port: {
                        'anyOf': [
                          {
                            type: 'integer',
                          },
                          {
                            type: 'string',
                          },
                        ],
                        'description': 'Port is the port of the ServicePort.',
                        'x-kubernetes-int-or-string': true,
                      },
                    },
                    required: [
                      'name',
                      'port',
                    ],
                    type: 'object',
                  },
                  targetGroupARN: {
                    description: 'targetGroupARN is the Amazon Resource Name (ARN) for the TargetGroup.',
                    type: 'string',
                  },
                  targetType: {
                    description: 'targetType is the TargetType of TargetGroup. If unspecified, it will be automatically inferred.',
                    enum: [
                      'instance',
                      'ip',
                    ],
                    type: 'string',
                  },
                },
                required: [
                  'serviceRef',
                  'targetGroupARN',
                ],
                type: 'object',
              },
              status: {
                description: 'TargetGroupBindingStatus defines the observed state of TargetGroupBinding',
                properties: {
                  observedGeneration: {
                    description: 'The generation observed by the TargetGroupBinding controller.',
                    format: 'int64',
                    type: 'integer',
                  },
                },
                type: 'object',
              },
            },
            type: 'object',
          },
        },
        version: 'v1alpha1',
        versions: [
          {
            name: 'v1alpha1',
            served: true,
            storage: false,
          },
          {
            name: 'v1beta1',
            served: true,
            storage: true,
          },
        ],
      },
      status: {
        acceptedNames: {
          kind: '',
          plural: '',
        },
        conditions: [],
        storedVersions: [],
      },
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

    new k8s.KubeClusterRole(this, 'aws-load-balancer-controller-cluster-role', {
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
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['events'],
          verbs: ['create', 'patch'],
        },
        {
          apiGroups: [''],
          resources: ['namespaces'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['nodes'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['pods'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['pods/status'],
          verbs: ['patch', 'update'],
        },
        {
          apiGroups: [''],
          resources: ['secrets'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['services'],
          verbs: ['get', 'list', 'patch', 'update', 'watch'],
        },
        {
          apiGroups: [''],
          resources: ['services/status'],
          verbs: ['patch', 'update'],
        },
        {
          apiGroups: ['elbv2.k8s.aws'],
          resources: ['targetgroupbindings'],
          verbs: ['create', 'delete', 'get', 'list', 'patch', 'update', 'watch'],
        },
        {
          apiGroups: ['elbv2.k8s.aws'],
          resources: ['targetgroupbindings/status'],
          verbs: ['patch', 'update'],
        },
        {
          apiGroups: ['extensions'],
          resources: ['ingresses'],
          verbs: ['get', 'list', 'patch', 'update', 'watch'],
        },
        {
          apiGroups: ['extensions'],
          resources: ['ingresses/status'],
          verbs: ['patch', 'update'],
        },
        {
          apiGroups: ['networking.k8s.io'],
          resources: ['ingresses'],
          verbs: ['get', 'list', 'patch', 'update', 'watch'],
        },
        {
          apiGroups: ['networking.k8s.io'],
          resources: ['ingressclasses'],
          verbs: ['get', 'list', 'watch'],
        },
        {
          apiGroups: ['networking.k8s.io'],
          resources: ['ingresses/status'],
          verbs: ['patch', 'update'],
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