import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface ProductsAppStackProps extends cdk.StackProps {
  eventsDdb: dynamodb.Table
}
export class ProductsAppStack extends cdk.Stack {
  
	readonly productsFetchHandler : lambdaNodeJS.NodejsFunction;
	readonly productsAdminHandler : lambdaNodeJS.NodejsFunction;
	readonly productsDdb: dynamodb.Table;

	constructor(scope: Construct, id: string, props: ProductsAppStackProps){
		super(scope, id, props);

		this.productsDdb = new dynamodb.Table(this, "ProductsDdb", {
			tableName: "products",
			partitionKey: {
				name: "id",
				type: dynamodb.AttributeType.STRING
			},
			billingMode: dynamodb.BillingMode.PROVISIONED,
			writeCapacity: 1,
			readCapacity: 1
		});

		const productsEventsHandler = new lambdaNodeJS.NodejsFunction(
			this,
			"ProductEventsFunction",
			{
				functionName: "ProductEventsFunction",
				entry: "lambda/products/ProductEventsFunction.ts",
				handler: "handler",
				memorySize: 128,
				timeout: cdk.Duration.seconds(2),
				bundling: {
					minify: true,
					sourceMap: false
				},
				environment: {
					EVENTS_DDB: props.eventsDdb.tableName
				},
				tracing: lambda.Tracing.ACTIVE,
				insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_135_0

			}
		);
		props.eventsDdb.grantWriteData(productsEventsHandler);

		const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayerVersionArn");
		const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayerVersionArn", productsLayerArn);

		this.productsFetchHandler = new lambdaNodeJS.NodejsFunction(
			this,
			"ProductsFetchFunction",
			{
				functionName: "ProductsFetchFunction",
				entry: "lambda/products/ProductsFetchFunction.ts",
				handler: "handler",
				memorySize: 128,
				timeout: cdk.Duration.seconds(2),
				bundling: {
					minify: true,
					sourceMap: false
				},
				environment: {
					PRODUCTS_DDB: this.productsDdb.tableName
				},
				layers: [productsLayer],
				tracing: lambda.Tracing.ACTIVE,
				insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_135_0
			}
		);
		this.productsDdb.grantReadData(this.productsFetchHandler);

		this.productsAdminHandler = new lambdaNodeJS.NodejsFunction(
			this,
			"ProductsAdminFunction",
			{
				functionName: "ProductsAdminFunction",
				entry: "lambda/products/ProductsAdminFunction.ts",
				handler: "handler",
				memorySize: 128,
				timeout: cdk.Duration.seconds(2),
				bundling: {
					minify: true,
					sourceMap: false
				},
				environment: {
					PRODUCTS_DDB: this.productsDdb.tableName,
					PRODUCTS_EVENT_FUNCTION_NAME: productsEventsHandler.functionName
				},
				layers: [productsLayer],
				tracing: lambda.Tracing.ACTIVE,
				insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_135_0
			}
		);
		this.productsDdb.grantWriteData(this.productsAdminHandler);
		productsEventsHandler.grantInvoke(this.productsAdminHandler);
	}
}