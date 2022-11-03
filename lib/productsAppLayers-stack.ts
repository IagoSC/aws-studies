import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export class ProductsAppLayersStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps){
		super(scope, id, props);
   
		const productsLayer = new lambda.LayerVersion(this, "ProductsLayers", {
			compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
			code: lambda.Code.fromAsset("lambda/products/layers/productsLayer"),
			removalPolicy: cdk.RemovalPolicy.RETAIN,
			layerVersionName: "ProductsLayers"
		});

		new ssm.StringParameter(this, "ProductsLayerVersionArn", {
			parameterName: "ProductsLayerVersionArn",
			stringValue: productsLayer.layerVersionArn
		});

		const productEventsLayer = new lambda.LayerVersion(this, "ProductEventsLayer", {
			compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
			code: lambda.Code.fromAsset("lambda/products/layers/productEventsLayer"),
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			layerVersionName: "ProductEventsLayer"
		});

		new ssm.StringParameter(this, "ProductsLayerVersionArn", {
			parameterName: "ProductEventsLayerVersionArn",
			stringValue: productEventsLayer.layerVersionArn
		});
	}
}
