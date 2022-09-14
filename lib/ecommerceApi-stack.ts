import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cwlogs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface ECommerceApiProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJS.NodejsFunction,
  productsAdminHandler: lambdaNodeJS.NodejsFunction
}

export class ECommerceApiStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: ECommerceApiProps){
		super(scope, id, props);

		const logGroup = new cwlogs.LogGroup(this, "ECommerceApiLogs");

		const api = new apigateway.RestApi(this, "ECommerceApi", {
			restApiName: "ECommerceApi",
			deployOptions: {
				accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
				accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
					httpMethod: true,
					ip: true,
					user: true,
					status: true,
					caller: true,
					requestTime: true,
					protocol: true,
					resourcePath: true,
					responseLength: true,
				})
			}
		});

		const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler);

		// "/products"
		const productsResource = api.root.addResource("products");
		// "/products/{id}"
		const productsIdResource = productsResource.addResource("{id}");

		productsResource.addMethod("GET", productsFetchIntegration);
		productsIdResource.addMethod("GET", productsFetchIntegration);

    
		const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler);

		productsResource.addMethod("POST", productsAdminIntegration);
		productsIdResource.addMethod("DELETE", productsAdminIntegration);
		productsIdResource.addMethod("PUT", productsAdminIntegration);


	}
}