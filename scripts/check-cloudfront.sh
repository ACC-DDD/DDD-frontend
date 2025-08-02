#!/bin/bash

# Script to check your existing CloudFront distribution

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking your CloudFront distributions...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# List all CloudFront distributions
echo -e "${BLUE}📋 Your CloudFront distributions:${NC}"
aws cloudfront list-distributions --query 'DistributionList.Items[*].{Id:Id,DomainName:DomainName,Status:Status,Origins:Origins[0].DomainName}' --output table

echo -e "${YELLOW}💡 Look for the distribution with origin: ddd-acc-next-frontend.s3.ap-northeast-2.amazonaws.com${NC}"
echo -e "${YELLOW}📝 Copy the Distribution ID and update it in your deployment scripts${NC}"