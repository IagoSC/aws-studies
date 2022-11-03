#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ECommerceApiStack } from "../lib/ecommerceApi-stack";
import { ProductsAppStack } from "../lib/productsApp-stack";
import { ProductsAppLayersStack } from "../lib/productsAppLayers-stack";
import { EventsDdbStack } from "../lib/eventsDdb-stack";

const app = new cdk.App();

const tags = {
	cost: "aws_studies",
	team: "iago_dev"
};

const env: cdk.Environment = {
	region: "us-east-1",
	account: "466237633381"
};

const productsAppLayersStack = new ProductsAppLayersStack(app, "ProductsAppLayers", {tags, env});

const eventsDdbStack = new EventsDdbStack(app, "EventsDdbStack", {tags, env});

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
	eventsDdb: eventsDdbStack.table,
	tags,
	env
});
productsAppStack.addDependency(productsAppLayersStack);
productsAppStack.addDependency(eventsDdbStack);

const eCommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
	productsFetchHandler: productsAppStack.productsFetchHandler,
	productsAdminHandler: productsAppStack.productsAdminHandler,
	tags,
	env
});
eCommerceApiStack.addDependency(productsAppStack);