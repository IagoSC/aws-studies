import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export class ProductsAppStack extends cdk.Stack {
  
	readonly productsFetchHandler : lambdaNodeJS.NodejsFunction;
	readonly productsAdminHandler : lambdaNodeJS.NodejsFunction;
	readonly productsDdb: dynamodb.Table;

	constructor(scope: Construct, id: string, props?: cdk.StackProps){
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
				tracing: lambda.Tracing.ACTIVE
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
					PRODUCTS_DDB: this.productsDdb.tableName
				},
				layers: [productsLayer],
				tracing: lambda.Tracing.ACTIVE  
			}
		);
		this.productsDdb.grantWriteData(this.productsAdminHandler);
	}
}