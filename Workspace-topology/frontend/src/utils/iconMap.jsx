import React from 'react';
import {
  AmazonApiGateway,
  AmazonCloudFront,
  AmazonCloudWatch,
  AmazonDocumentDb,
  AmazonDynamoDb,
  AmazonEc2,
  AmazonElastiCache,
  AmazonElasticBlockStore,
  AmazonElasticContainerService,
  AmazonElasticKubernetesService,
  AmazonOpenSearchService,
  AmazonRds,
  AmazonRedshift,
  AmazonRoute53,
  AmazonSageMaker,
  AmazonSimpleNotificationService,
  AmazonSimpleQueueService,
  AmazonSimpleStorageService,
  AmazonVirtualPrivateCloud,
  AwsElasticBeanstalk,
  AwsIdentityAndAccessManagement,
  AwsLambda,
  AwsNetworkFirewall,
  AwsShield,
  AwsTransitGateway,
  ElasticLoadBalancing
} from '@aws-icons/react/architecture-service';
import { AmazonVpcInternetGateway } from '@aws-icons/react/resource';

// Tailwind Themes mapping strictly to Service Colors (No Health Colors)
const themes = {
  route53:      { text: 'text-violet-500',  bg: '#8B5CF6' },
  cloudFront:   { text: 'text-indigo-500',  bg: '#6366F1' },
  loadBalancer: { text: 'text-blue-500',    bg: '#3B82F6' },
  targetGroup:  { text: 'text-rose-500',    bg: '#F43F5E' },
  compute:      { text: 'text-orange-500',  bg: '#F97316' },
  network:      { text: 'text-cyan-500',    bg: '#06B6D4' },
  security:     { text: 'text-emerald-500', bg: '#10B981' },
  database:     { text: 'text-blue-500',    bg: '#3B82F6' },
  storage:      { text: 'text-emerald-500', bg: '#10B981' },
  monitoring:   { text: 'text-pink-500',    bg: '#EC4899' },
  external:     { text: 'text-slate-400',   bg: '#94A3B8' },
};

// Centralized mapping of all AWS resource types (keys must be fully lowercase, no spaces or underscores)
export const RESOURCE_MAP = {
  // Compute
  'instance': { icon: AmazonEc2, ...themes.compute },
  'ec2': { icon: AmazonEc2, ...themes.compute },
  'ekscluster': { icon: AmazonElasticKubernetesService, ...themes.compute },
  'eksnodegroup': { icon: AmazonEc2, ...themes.compute },
  'ecscluster': { icon: AmazonElasticContainerService, ...themes.compute },
  'autoscalinggroup': { icon: AmazonEc2, ...themes.compute },
  'asg': { icon: AmazonEc2, ...themes.compute },
  'elasticbeanstalkenvironment': { icon: AwsElasticBeanstalk, ...themes.compute },
  'batchcomputeenvironment': { icon: AmazonElasticContainerService, ...themes.compute },
  'apprunnervpcconnector': { icon: AwsElasticBeanstalk, ...themes.compute },
  'workspace': { icon: AmazonEc2, ...themes.compute },
  'application': { icon: AwsElasticBeanstalk, ...themes.compute },

  // Database
  'rdsinstance': { icon: AmazonRds, ...themes.database },
  'rds': { icon: AmazonRds, ...themes.database },
  'redshiftcluster': { icon: AmazonRedshift, ...themes.database },
  'documentdbcluster': { icon: AmazonDocumentDb, ...themes.database },
  'memorydbcluster': { icon: AmazonElastiCache, ...themes.database },
  'neptunecluster': { icon: AmazonDynamoDb, ...themes.database },
  'elasticachenode': { icon: AmazonElastiCache, ...themes.database },
  'directoryservice': { icon: AwsIdentityAndAccessManagement, ...themes.database },

  // Storage
  's3bucket': { icon: AmazonSimpleStorageService, ...themes.storage },
  'ebsvolume': { icon: AmazonElasticBlockStore, ...themes.storage },
  'ebs': { icon: AmazonElasticBlockStore, ...themes.storage },
  'efsmounttarget': { icon: AmazonElasticBlockStore, ...themes.storage },
  'fsxfilesystem': { icon: AmazonElasticBlockStore, ...themes.storage },

  // Analytics & ML
  'sagemakernotebook': { icon: AwsLambda, ...themes.compute },
  'emrcluster': { icon: AwsLambda, ...themes.compute },
  'glueconnection': { icon: AwsLambda, ...themes.compute },
  'lambdafunction': { icon: AwsLambda, ...themes.compute },
  'lambda': { icon: AwsLambda, ...themes.compute },

  // Messaging & Monitoring
  'regionalqueue': { icon: AmazonSimpleQueueService, ...themes.monitoring },
  'sqs': { icon: AmazonSimpleQueueService, ...themes.monitoring },
  'amazonmqbroker': { icon: AmazonSimpleQueueService, ...themes.monitoring },
  'mskcluster': { icon: AmazonSimpleQueueService, ...themes.monitoring },
  'sns': { icon: AmazonSimpleNotificationService, ...themes.monitoring },
  'snstopic': { icon: AmazonSimpleNotificationService, ...themes.monitoring },
  'cloudwatchalarm': { icon: AmazonCloudWatch, ...themes.monitoring },
  'cloudwatchlogs': { icon: AmazonCloudWatch, ...themes.monitoring },
  'eventbridge': { icon: AmazonCloudWatch, ...themes.monitoring },

  // Security
  'securitygroup': { icon: AwsShield, ...themes.security },
  'networkfirewall': { icon: AwsNetworkFirewall, ...themes.security },
  'networkacl': { icon: AwsShield, ...themes.security },
  'iamrole': { icon: AwsIdentityAndAccessManagement, ...themes.security },
  'instanceprofile': { icon: AwsIdentityAndAccessManagement, ...themes.security },
  'securityandcompliance': { icon: AwsIdentityAndAccessManagement, ...themes.security },

  // Networking Core
  'routetable': { icon: AwsTransitGateway, ...themes.network },
  'subnet': { icon: AmazonVirtualPrivateCloud, ...themes.network },
  'vpcendpoint': { icon: AwsTransitGateway, ...themes.network },
  'gwlbendpoint': { icon: AwsTransitGateway, ...themes.network },
  'networkfirewallendpoint': { icon: AwsTransitGateway, ...themes.network },
  'route53resolverendpoint': { icon: AmazonRoute53, ...themes.network },
  'peeringconnection': { icon: AwsTransitGateway, ...themes.network },
  'vpnconnection': { icon: AwsTransitGateway, ...themes.network },
  'hybridconnectivity': { icon: AwsTransitGateway, ...themes.network },
  'transitgatewayroutetable': { icon: AwsTransitGateway, ...themes.network },

  // Networking Gateways & VPC
  'internetgateway': { icon: AmazonVpcInternetGateway, ...themes.network },
  'igw': { icon: AmazonVpcInternetGateway, ...themes.network },
  'egressonlyinternetgateway': { icon: AmazonVpcInternetGateway, ...themes.network },
  'natgateway': { icon: AmazonVpcInternetGateway, ...themes.network },
  'vpngateway': { icon: AwsTransitGateway, ...themes.network },
  'transitgatewayattachment': { icon: AwsTransitGateway, ...themes.network },
  'carriergateway': { icon: AwsTransitGateway, ...themes.network },
  'gatewayloadbalancer': { icon: AwsTransitGateway, ...themes.network },
  'vpc': { icon: AmazonVirtualPrivateCloud, ...themes.network },

  // Load Balancers & Target Groups
  'loadbalancer': { icon: ElasticLoadBalancing, ...themes.loadBalancer },
  'alb': { icon: ElasticLoadBalancing, ...themes.loadBalancer },
  'nlb': { icon: ElasticLoadBalancing, ...themes.loadBalancer },
  'targetgroup': { icon: ElasticLoadBalancing, ...themes.targetGroup },

  // Global & Edge
  'cloudfrontdistribution': { icon: AmazonCloudFront, ...themes.cloudFront },
  'opensearchdomain': { icon: AmazonOpenSearchService, ...themes.cloudFront },
  'route53hostedzone': { icon: AmazonRoute53, ...themes.route53 },
  'route53': { icon: AmazonRoute53, ...themes.route53 },

  // Miscelleneous
  'elasticip': { icon: AmazonVirtualPrivateCloud, ...themes.external },
  'unclassifiedeni': { icon: AmazonVirtualPrivateCloud, ...themes.external },
  'dhcpoption': { icon: AmazonVirtualPrivateCloud, ...themes.external },

  // Fallbacks
  'default': { icon: AmazonCloudWatch, ...themes.external }
};

export const normalizeType = (type) => {
  if (!type) return 'default';
  
  // Lowercase and strip all spaces and underscores for exact matching
  let norm = type.toLowerCase().replace(/[\s_]+/g, '');
  
  // Handle plurals unless they naturally end in 's'
  const exceptions = ['dhcpoptions', 'elasticips', 'route53resolverendpoints', 'vpcs', 'rds'];
  if (norm.endsWith('s') && !exceptions.includes(norm)) {
    norm = norm.slice(0, -1);
  }
  
  return norm;
};

export const getIcon = (type, size = 14, customClass = null) => {
  const norm = normalizeType(type);
  const config = RESOURCE_MAP[norm] || RESOURCE_MAP['default'];
  const IconComponent = config.icon;
  // If a custom class is provided, use it exclusively, else fallback to the config's text color
  const className = customClass !== null ? customClass : config.text;
  // Use both size (lucide) and width/height (aws-icons) for compatibility
  return <IconComponent size={size} width={size} height={size} className={className} />;
};

export const getColorClasses = (type) => {
  const norm = normalizeType(type);
  return RESOURCE_MAP[norm] || RESOURCE_MAP['default'];
};

export const getGlowColors = (type) => {
  return ['rgba(0,0,0,0)', 'rgba(0,0,0,0)']; // Disabling dynamic glow in favor of health-based static colors
};
