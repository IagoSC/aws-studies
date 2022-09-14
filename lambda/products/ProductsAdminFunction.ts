import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

	const lambdaRequestId = context.awsRequestId;
	const apiRequestId = event.requestContext.requestId;
	const method = event.httpMethod;
	console.log(`API Gateway Request Id: ${apiRequestId} - Lambda Request Id: ${lambdaRequestId}`);

	if(event.resource === "/products") {
		if(method === "POST") {
			return {
				statusCode: 201,
				body: JSON.stringify ({
					message:"POST /products - OK"
				})
			};
		}
	}
	else if(event.resource === "/products/{id}") {
		const productId = event.pathParameters!.id;
		if (method === "PUT") {
			return {
				statusCode: 200,
				body: JSON.stringify ({
					message:`PUT /products ${productId} - OK`
				})
			};
		}
		else if (method === "DELETE") {
			return {
				statusCode: 200,
				body: JSON.stringify ({
					message:`DELETE /products ${productId} - OK`
				})
			};
		}
	}

	return {
		statusCode: 400,
		body: JSON.stringify({
			message: "Bad request",
		})
	};

}