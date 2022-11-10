// import * as cdk from "aws-cdk-lib";
import * as AwsSdk from "aws-sdk";
import * as AWSXray from "aws-xray-sdk";
import { Callback, Context } from "aws-lambda";
import { ProductEvent } from "./layers/productsLayer/productEventsLayer/productEvents";
import { DynamoDB } from "aws-sdk";

AWSXray.captureAWS(AwsSdk);

const eventsDdb = process.env.EVENTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();

export async function handler (event: ProductEvent, context: Context, callback:Callback):Promise<void> {
	console.log(event);

	console.log(`Lambda requetId: ${context.awsRequestId}`);
  
	await createEvent(event);
  
	callback(null, JSON.stringify({
		productCreatedEvent: true,
		message: "OK"  
	}));
}

async function createEvent (event: ProductEvent) {
	const timestamp = Date.now();
	const ttl = ~~(timestamp/1000 + 5*60);

	return ddbClient.put({
		TableName: eventsDdb,
		Item: {
			pk: `#product_${event.productCode}`,
			sk: `${event.eventType}#${timestamp}`,
			email: event.email,
			createdAt: timestamp,
			requestId: event.requestId,
			eventType: event.eventType,
			info: {
				productId: event.productId,
				price: event.productPrice
			},
			ttl,
			timestamp, 
		}
	}).promise();
}