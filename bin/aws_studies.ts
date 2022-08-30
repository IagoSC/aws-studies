#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ECommerceApiStack } from '../lib/ecommerceApi-stack';
import { ProductsAppStack } from '../lib/productsApp-stack';

const app = new cdk.App();

const tags = {
  cost: "aws_studies",
  team: "iago_dev"
}

const env: cdk.Environment = {
  region: "us-east-1",
  account: "466237633381"
}

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {tags, env})

const eCommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.fetchProductsHandler,
  tags,
  env
})
eCommerceApiStack.addDependency(productsAppStack)