# cdk8s-aws-lb-controller
![Release](https://github.com/opencdk8s/cdk8s-aws-lb-controller/workflows/Release/badge.svg?branch=development)
[![npm version](https://badge.fury.io/js/%40opencdk8s%2Fcdk8s-aws-lb-controller.svg)](https://badge.fury.io/js/%40opencdk8s%2Fcdk8s-aws-lb-controller)
[![PyPI version](https://badge.fury.io/py/cdk8s-aws-lb-controller.svg)](https://badge.fury.io/py/cdk8s-aws-lb-controller)
![npm](https://img.shields.io/npm/dt/@opencdk8s/cdk8s-aws-lb-controller?label=npm&color=green) 
![PyPi](https://img.shields.io/pypi/dm/cdk8s-aws-lb-controller?label=pypi&color=green) 

Synths an install manifest for [aws-load-balancer-controller](https://github.com/kubernetes-sigs/aws-load-balancer-controller), based off of [this repo](https://github.com/opencdk8s/cdk8s-aws-load-balancer-controller)

## Controller version : `v2.1.3`

## Overview

### `install.yaml` example

```typescript
import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { AwsLoadBalancerController } from '@opencdk8s/cdk8s-aws-lb-controller'

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    new AwsLoadBalancerController(this, 'example', {
      clusterName: 'example',
    })

  }
}

const app = new App();
new MyChart(app, 'example');
app.synth();
```

<details>
<summary>install.k8s.yaml</summary>

```yaml
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  annotations:
    controller-gen.kubebuilder.io/version: v0.4.0
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: targetgroupbindings.elbv2.k8s.aws
spec:
  additionalPrinterColumns:
    - JSONPath: .spec.serviceRef.name
      description: The Kubernetes Service's name
      name: SERVICE-NAME
      type: string
    - JSONPath: .spec.serviceRef.port
      description: The Kubernetes Service's port
      name: SERVICE-PORT
      type: string
    - JSONPath: .spec.targetType
      description: The AWS TargetGroup's TargetType
      name: TARGET-TYPE
      type: string
    - JSONPath: .spec.targetGroupARN
      description: The AWS TargetGroup's Amazon Resource Name
      name: ARN
      priority: 1
      type: string
    - JSONPath: .metadata.creationTimestamp
      name: AGE
      type: date
  group: elbv2.k8s.aws
  names:
    categories:
      - all
    kind: TargetGroupBinding
    listKind: TargetGroupBindingList
    plural: targetgroupbindings
    singular: targetgroupbinding
  scope: Namespaced
  subresources:
    status: {}
  validation:
    openAPIV3Schema:
      description: TargetGroupBinding is the Schema for the TargetGroupBinding API
      properties:
        apiVersion:
          description: "APIVersion defines the versioned schema of this representation of
            an object. Servers should convert recognized schemas to the latest
            internal value, and may reject unrecognized values. More info:
            https://git.k8s.io/community/contributors/devel/sig-architecture/ap\
            i-conventions.md#resources"
          type: string
        kind:
          description: "Kind is a string value representing the REST resource this object
            represents. Servers may infer this from the endpoint the client
            submits requests to. Cannot be updated. In CamelCase. More info:
            https://git.k8s.io/community/contributors/devel/sig-architecture/ap\
            i-conventions.md#types-kinds"
          type: string
        metadata:
          type: object
        spec:
          description: TargetGroupBindingSpec defines the desired state of
            TargetGroupBinding
          properties:
            networking:
              description: networking provides the networking setup for ELBV2 LoadBalancer to
                access targets in TargetGroup.
              properties:
                ingress:
                  description: List of ingress rules to allow ELBV2 LoadBalancer to access targets
                    in TargetGroup.
                  items:
                    properties:
                      from:
                        description: List of peers which should be able to access the targets in
                          TargetGroup. At least one NetworkingPeer should be
                          specified.
                        items:
                          description: NetworkingPeer defines the source/destination peer for networking
                            rules.
                          properties:
                            ipBlock:
                              description: IPBlock defines an IPBlock peer. If specified, none of the other
                                fields can be set.
                              properties:
                                cidr:
                                  description: CIDR is the network CIDR. Both IPV4 or IPV6 CIDR are accepted.
                                  type: string
                              required:
                                - cidr
                              type: object
                            securityGroup:
                              description: SecurityGroup defines a SecurityGroup peer. If specified, none of
                                the other fields can be set.
                              properties:
                                groupID:
                                  description: GroupID is the EC2 SecurityGroupID.
                                  type: string
                              required:
                                - groupID
                              type: object
                          type: object
                        type: array
                      ports:
                        description: List of ports which should be made accessible on the targets in
                          TargetGroup. If ports is empty or unspecified, it
                          defaults to all ports with TCP.
                        items:
                          properties:
                            port:
                              anyOf:
                                - type: integer
                                - type: string
                              description: The port which traffic must match. When NodePort endpoints(instance
                                TargetType) is used, this must be a numerical
                                port. When Port endpoints(ip TargetType) is
                                used, this can be either numerical or named port
                                on pods. if port is unspecified, it defaults to
                                all ports.
                              x-kubernetes-int-or-string: true
                            protocol:
                              description: The protocol which traffic must match. If protocol is unspecified,
                                it defaults to TCP.
                              enum:
                                - TCP
                                - UDP
                              type: string
                          type: object
                        type: array
                    required:
                      - from
                      - ports
                    type: object
                  type: array
              type: object
            serviceRef:
              description: serviceRef is a reference to a Kubernetes Service and ServicePort.
              properties:
                name:
                  description: Name is the name of the Service.
                  type: string
                port:
                  anyOf:
                    - type: integer
                    - type: string
                  description: Port is the port of the ServicePort.
                  x-kubernetes-int-or-string: true
              required:
                - name
                - port
              type: object
            targetGroupARN:
              description: targetGroupARN is the Amazon Resource Name (ARN) for the
                TargetGroup.
              type: string
            targetType:
              description: targetType is the TargetType of TargetGroup. If unspecified, it
                will be automatically inferred.
              enum:
                - instance
                - ip
              type: string
          required:
            - serviceRef
            - targetGroupARN
          type: object
        status:
          description: TargetGroupBindingStatus defines the observed state of
            TargetGroupBinding
          properties:
            observedGeneration:
              description: The generation observed by the TargetGroupBinding controller.
              format: int64
              type: integer
          type: object
      type: object
  version: v1alpha1
  versions:
    - name: v1alpha1
      served: true
      storage: false
    - name: v1beta1
      served: true
      storage: true
status:
  acceptedNames:
    kind: ""
    plural: ""
  conditions: []
  storedVersions: []
---
apiVersion: admissionregistration.k8s.io/v1beta1
kind: MutatingWebhookConfiguration
metadata:
  annotations:
    cert-manager.io/inject-ca-from: kube-system/aws-load-balancer-serving-cert
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-webhook
webhooks:
  - clientConfig:
      caBundle: Cg==
      service:
        name: aws-load-balancer-webhook-service
        namespace: kube-system
        path: /mutate-v1-pod
    failurePolicy: Fail
    name: mpod.elbv2.k8s.aws
    namespaceSelector:
      matchExpressions:
        - key: elbv2.k8s.aws/pod-readiness-gate-inject
          operator: In
          values:
            - enabled
    rules:
      - apiGroups:
          - ""
        apiVersions:
          - v1
        operations:
          - CREATE
        resources:
          - pods
    sideEffects: None
  - clientConfig:
      caBundle: Cg==
      service:
        name: aws-load-balancer-webhook-service
        namespace: kube-system
        path: /mutate-elbv2-k8s-aws-v1beta1-targetgroupbinding
    failurePolicy: Fail
    name: mtargetgroupbinding.elbv2.k8s.aws
    rules:
      - apiGroups:
          - elbv2.k8s.aws
        apiVersions:
          - v1beta1
        operations:
          - CREATE
          - UPDATE
        resources:
          - targetgroupbindings
    sideEffects: None
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller-leader-election-role
  namespace: kube-system
rules:
  - apiGroups:
      - ""
    resources:
      - configmaps
    verbs:
      - create
  - apiGroups:
      - ""
    resourceNames:
      - aws-load-balancer-controller-leader
    resources:
      - configmaps
    verbs:
      - get
      - update
      - patch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller-role
rules:
  - apiGroups:
      - ""
    resources:
      - endpoints
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - events
    verbs:
      - create
      - patch
  - apiGroups:
      - ""
    resources:
      - namespaces
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - nodes
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - pods/status
    verbs:
      - patch
      - update
  - apiGroups:
      - ""
    resources:
      - secrets
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - services
    verbs:
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - ""
    resources:
      - services/status
    verbs:
      - patch
      - update
  - apiGroups:
      - elbv2.k8s.aws
    resources:
      - targetgroupbindings
    verbs:
      - create
      - delete
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - elbv2.k8s.aws
    resources:
      - targetgroupbindings/status
    verbs:
      - patch
      - update
  - apiGroups:
      - extensions
    resources:
      - ingresses
    verbs:
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - extensions
    resources:
      - ingresses/status
    verbs:
      - patch
      - update
  - apiGroups:
      - networking.k8s.io
    resources:
      - ingresses
    verbs:
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - networking.k8s.io
    resources:
      - ingressclasses
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - networking.k8s.io
    resources:
      - ingresses/status
    verbs:
      - patch
      - update
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller-leader-election-rolebinding
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: aws-load-balancer-controller-leader-election-role
subjects:
  - kind: ServiceAccount
    name: aws-load-balancer-controller
    namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller-rolebinding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: aws-load-balancer-controller-role
subjects:
  - kind: ServiceAccount
    name: aws-load-balancer-controller
    namespace: kube-system
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-webhook-service
  namespace: kube-system
spec:
  ports:
    - port: 443
      targetPort: 9443
  selector:
    app.kubernetes.io/component: controller
    app.kubernetes.io/name: aws-load-balancer-controller
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/component: controller
      app.kubernetes.io/name: aws-load-balancer-controller
  template:
    metadata:
      labels:
        app.kubernetes.io/component: controller
        app.kubernetes.io/name: aws-load-balancer-controller
    spec:
      containers:
        - args:
            - --ingress-class=alb
            - --cluster-name=example
          image: amazon/aws-alb-ingress-controller:v2.1.3
          livenessProbe:
            failureThreshold: 2
            httpGet:
              path: /healthz
              port: 61779
              scheme: HTTP
            initialDelaySeconds: 30
            timeoutSeconds: 10
          name: controller
          ports:
            - containerPort: 9443
              name: webhook-server
              protocol: TCP
          resources:
            limits:
              cpu: 200m
              memory: 500Mi
            requests:
              cpu: 100m
              memory: 200Mi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
          volumeMounts:
            - mountPath: /tmp/k8s-webhook-server/serving-certs
              name: cert
              readOnly: true
      securityContext:
        fsGroup: 1337
      serviceAccountName: aws-load-balancer-controller
      terminationGracePeriodSeconds: 10
      volumes:
        - name: cert
          secret:
            defaultMode: 420
            secretName: aws-load-balancer-webhook-tls
---
apiVersion: cert-manager.io/v1alpha2
kind: Certificate
metadata:
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-serving-cert
  namespace: kube-system
spec:
  dnsNames:
    - aws-load-balancer-webhook-service.kube-system.svc
    - aws-load-balancer-webhook-service.kube-system.svc.cluster.local
  issuerRef:
    kind: Issuer
    name: aws-load-balancer-selfsigned-issuer
  secretName: aws-load-balancer-webhook-tls
---
apiVersion: cert-manager.io/v1alpha2
kind: Issuer
metadata:
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-selfsigned-issuer
  namespace: kube-system
spec:
  selfSigned: {}
---
apiVersion: admissionregistration.k8s.io/v1beta1
kind: ValidatingWebhookConfiguration
metadata:
  annotations:
    cert-manager.io/inject-ca-from: kube-system/aws-load-balancer-serving-cert
  labels:
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-webhook
webhooks:
  - clientConfig:
      caBundle: Cg==
      service:
        name: aws-load-balancer-webhook-service
        namespace: kube-system
        path: /validate-elbv2-k8s-aws-v1beta1-targetgroupbinding
    failurePolicy: Fail
    name: vtargetgroupbinding.elbv2.k8s.aws
    rules:
      - apiGroups:
          - elbv2.k8s.aws
        apiVersions:
          - v1beta1
        operations:
          - CREATE
          - UPDATE
        resources:
          - targetgroupbindings
    sideEffects: None
```

</details>

## Installation

### TypeScript

Use `yarn` or `npm` to install.

```sh
$ npm install @opencdk8s/cdk8s-aws-lb-controller
```

```sh
$ yarn add @opencdk8s/cdk8s-aws-lb-controller
```

### Python

```sh
$ pip install cdk8s-aws-lb-controller
```

## Contribution

1. Fork ([link](https://github.com/opencdk8s/cdk8s-aws-lb-controller/fork))
2. Bootstrap the repo:
  
    ```bash
    npx projen   # generates package.json 
    yarn install # installs dependencies
    ```
3. Development scripts:
   |Command|Description
   |-|-
   |`yarn compile`|Compiles typescript => javascript
   |`yarn watch`|Watch & compile
   |`yarn test`|Run unit test & linter through jest
   |`yarn test -u`|Update jest snapshots
   |`yarn run package`|Creates a `dist` with packages for all languages.
   |`yarn build`|Compile + test + package
   |`yarn bump`|Bump version (with changelog) based on [conventional commits]
   |`yarn release`|Bump + push to `master`
4. Create a feature branch
5. Commit your changes
6. Rebase your local changes against the master branch
7. Create a new Pull Request (use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for the title please)

## Licence

[Apache License, Version 2.0](./LICENSE)

## Author

[Hunter-Thompson](https://github.com/Hunter-Thompson)