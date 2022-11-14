import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { Product, ProductRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB, Lambda } from "aws-sdk";
import * as AwsSdk from "aws-sdk";
import * as AWSXray from "aws-xray-sdk";
import { ProductEvent, ProductEventType } from "/opt/nodejs/productEventsLayer";

AWSXray.captureAWS(AwsSdk);

const productsDdb = process.env.PRODUCTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();
const lambdaClient = new Lambda();
const productEventsFunctionName = process.env.PRODUCTS_EVENT_FUNCTION_NAME!;
const productRepository = new ProductRepository(ddbClient, productsDdb);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

	const lambdaRequestId = context.awsRequestId;
	const apiRequestId = event.requestContext.requestId;
	const method = event.httpMethod;
  
	console.log(`API Gateway Request Id: ${apiRequestId} - Lambda Request Id: ${lambdaRequestId}`);

	if(event.resource === "/products") {
		if(method === "POST") {
			const product = JSON.parse(event.body!) as Product;

			const createdProduct = await productRepository.createProduct(product);

			const response = await sendProductEvent(createdProduct, ProductEventType.CREATED, "testCreation@test.com", lambdaRequestId);
			console.log(response);

			return {
				statusCode: 201,
				body: JSON.stringify(createdProduct)
			};
		}
	}
	else if(event.resource === "/products/{id}") {
		const productId = event.pathParameters!.id as string;
		if (method === "PUT") {
			const newProduct = JSON.parse(event.body!) as Product;
			try{
				const productUpdated = await productRepository.updateProduct(productId, newProduct);

				const response = await sendProductEvent(productUpdated, ProductEventType.UPDATED, "testUpdate@test.com", lambdaRequestId);
				console.log(response);

				return {
					statusCode: 200,
					body: JSON.stringify(productUpdated)
				};
			}catch(ConditionalCheckFailedException){
				const errorMessage = "Product not found";
				console.error(errorMessage);
				return {
					statusCode: 404,
					body: errorMessage
				};
			}
		}
		else if (method === "DELETE") {
			try{
				const productDeleted = await productRepository.deleteProduct(productId);

				const response = await sendProductEvent(productDeleted, ProductEventType.DELETED, "testDeletion@test.com", lambdaRequestId);
				console.log(response);
        
				return {
					statusCode: 200,
					body: JSON.stringify(productDeleted)
				};
			}catch(error){
				const errorMessage = (<Error>error).message;
				console.error(errorMessage);
				return {
					statusCode: 404,
					body: errorMessage
				};
			}
		}
	}

	return {
		statusCode: 400,
		body: JSON.stringify({
			message: "Bad request",
		})
	};
}

const sendProductEvent = (
	product: Product,
	eventType: ProductEventType,
	email: string,
	lambdaRequestId: string
) => {
  
	const event: ProductEvent = {
		email,
		eventType,
		productId: product.id,
		productPrice: product.price,
		productCode: product.code,
		requestId: lambdaRequestId,
	};

	return lambdaClient.invoke({
		FunctionName: productEventsFunctionName,
		Payload: JSON.stringify(event),
		InvocationType: "RequestResponse"
	}).promise();
};