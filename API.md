# API Reference

**Classes**

Name|Description
----|-----------
[AwsLoadBalancerController](#opencdk8s-cdk8s-aws-lb-controller-awsloadbalancercontroller)|Generate aws-load-balancer-controller config yaml.
[AwsLoadBalancerPolicy](#opencdk8s-cdk8s-aws-lb-controller-awsloadbalancerpolicy)|awsLoadBalancerPolicy class ,help you add policy to your Iam Role for service account.


**Structs**

Name|Description
----|-----------
[AwsLoadBalancerControllerOptions](#opencdk8s-cdk8s-aws-lb-controller-awsloadbalancercontrolleroptions)|*No description*
[EnvVar](#opencdk8s-cdk8s-aws-lb-controller-envvar)|*No description*


**Enums**

Name|Description
----|-----------
[VersionsLists](#opencdk8s-cdk8s-aws-lb-controller-versionslists)|*No description*



## class AwsLoadBalancerController 🔹 <a id="opencdk8s-cdk8s-aws-lb-controller-awsloadbalancercontroller"></a>

Generate aws-load-balancer-controller config yaml.

see https://github.com/kubernetes-sigs/aws-aws-load-balancer-controller/blob/master/docs/install/v2_0_0_full.yaml

__Implements__: [IConstruct](#constructs-iconstruct)
__Extends__: [Construct](#constructs-construct)

### Initializer




```ts
new AwsLoadBalancerController(scope: Construct, id: string, options: AwsLoadBalancerControllerOptions)
```

* **scope** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **options** (<code>[AwsLoadBalancerControllerOptions](#opencdk8s-cdk8s-aws-lb-controller-awsloadbalancercontrolleroptions)</code>)  *No description*
  * **clusterName** (<code>string</code>)  Kubernetes Cluster Name for aws-load-balancer-controller. 
  * **serviceAccountName** (<code>string</code>)  Service Account Name for aws-load-balancer-controller. 
  * **argoCertIgnore** (<code>boolean</code>)  Add an annotation so that ArgoCD ignores mutatingwebhook. __*Optional*__
  * **args** (<code>Array<string></code>)  Another Args for aws-load-balancer-controller. __*Default*__: None
  * **certManager** (<code>boolean</code>)  Install cert-manager. __*Default*__: true
  * **createServiceAccount** (<code>boolean</code>)  service account for aws-load-balancer-controller. __*Default*__: true
  * **env** (<code>Array<[EnvVar](#opencdk8s-cdk8s-aws-lb-controller-envvar)></code>)  Another Args for aws-load-balancer-controller. __*Default*__: None
  * **image** (<code>string</code>)  Default image for aws-load-balancer-controller. __*Default*__: docker.io/amazon/aws-aws-load-balancer-controller:v1.1.9
  * **labels** (<code>Map<string, string></code>)  Extra labels to associate with resources. __*Default*__: none
  * **namespace** (<code>string</code>)  Default Namespace for aws-load-balancer-controller. __*Default*__: kube-system
  * **replicas** (<code>number</code>)  Replicas for aws-load-balancer-controller. __*Default*__: 1



### Properties


Name | Type | Description 
-----|------|-------------
**clusterName**🔹 | <code>string</code> | Kubernetes Cluster Name for aws-load-balancer-controller.
**deploymentName**🔹 | <code>string</code> | Kubernetes Deployment Name for aws-load-balancer-controller.
**namespace**🔹 | <code>string</code> | Namespace for aws-load-balancer-controller.
**serviceAccountName**🔹 | <code>string</code> | Service Account Name for aws-load-balancer-controller.
**certManager**?🔹 | <code>boolean</code> | Install cert manager.<br/>__*Default*__: true
**createServiceAccount**?🔹 | <code>boolean</code> | service account for aws-load-balancer-controller.<br/>__*Default*__: true



## class AwsLoadBalancerPolicy 🔹 <a id="opencdk8s-cdk8s-aws-lb-controller-awsloadbalancerpolicy"></a>

awsLoadBalancerPolicy class ,help you add policy to your Iam Role for service account.


### Initializer




```ts
new AwsLoadBalancerPolicy()
```



### Methods


#### *static* addPolicy(version, role)🔹 <a id="opencdk8s-cdk8s-aws-lb-controller-awsloadbalancerpolicy-addpolicy"></a>



```ts
static addPolicy(version: string, role: any): any
```

* **version** (<code>string</code>)  *No description*
* **role** (<code>any</code>)  *No description*

__Returns__:
* <code>any</code>



## struct AwsLoadBalancerControllerOptions 🔹 <a id="opencdk8s-cdk8s-aws-lb-controller-awsloadbalancercontrolleroptions"></a>






Name | Type | Description 
-----|------|-------------
**clusterName**🔹 | <code>string</code> | Kubernetes Cluster Name for aws-load-balancer-controller.
**serviceAccountName**🔹 | <code>string</code> | Service Account Name for aws-load-balancer-controller.
**argoCertIgnore**?🔹 | <code>boolean</code> | Add an annotation so that ArgoCD ignores mutatingwebhook.<br/>__*Optional*__
**args**?🔹 | <code>Array<string></code> | Another Args for aws-load-balancer-controller.<br/>__*Default*__: None
**certManager**?🔹 | <code>boolean</code> | Install cert-manager.<br/>__*Default*__: true
**createServiceAccount**?🔹 | <code>boolean</code> | service account for aws-load-balancer-controller.<br/>__*Default*__: true
**env**?🔹 | <code>Array<[EnvVar](#opencdk8s-cdk8s-aws-lb-controller-envvar)></code> | Another Args for aws-load-balancer-controller.<br/>__*Default*__: None
**image**?🔹 | <code>string</code> | Default image for aws-load-balancer-controller.<br/>__*Default*__: docker.io/amazon/aws-aws-load-balancer-controller:v1.1.9
**labels**?🔹 | <code>Map<string, string></code> | Extra labels to associate with resources.<br/>__*Default*__: none
**namespace**?🔹 | <code>string</code> | Default Namespace for aws-load-balancer-controller.<br/>__*Default*__: kube-system
**replicas**?🔹 | <code>number</code> | Replicas for aws-load-balancer-controller.<br/>__*Default*__: 1



## struct EnvVar 🔹 <a id="opencdk8s-cdk8s-aws-lb-controller-envvar"></a>






Name | Type | Description 
-----|------|-------------
**name**🔹 | <code>string</code> | Name of the environment variable.
**value**?🔹 | <code>string</code> | Variable references $(VAR_NAME) are expanded using the previous defined environment variables in the container and any service environment variables.<br/>__*Default*__: .



## enum VersionsLists 🔹 <a id="opencdk8s-cdk8s-aws-lb-controller-versionslists"></a>



Name | Description
-----|-----
**AWS_LOAD_BALANCER_CONTROLLER_POLICY_V2** 🔹|


