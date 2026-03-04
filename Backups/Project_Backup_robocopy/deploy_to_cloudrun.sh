#!/bin/bash

# Deployment script for Cloud Run
# This script builds and deploys the application to Google Cloud Run

set -e  # Exit on error

echo "🚀 Starting Cloud Run Deployment..."
echo ""

# Configuration
PROJECT_ID="padlas-fodem-szigeteles"
SERVICE_NAME="padlas-fodem-szigeteles"
REGION="europe-west1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
VERSION="v11_libreoffice_verified"

echo "📋 Configuration:"
echo "   Project ID: ${PROJECT_ID}"
echo "   Service: ${SERVICE_NAME}"
echo "   Region: ${REGION}"
echo "   Image: ${IMAGE_NAME}:${VERSION}"
echo ""

# Step 1: Build Docker image
echo "🔨 Step 1: Building Docker image..."
docker build -t ${IMAGE_NAME}:${VERSION} -t ${IMAGE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker image built successfully"
echo ""

# Step 2: Push to Google Container Registry
echo "📤 Step 2: Pushing image to GCR..."
docker push ${IMAGE_NAME}:${VERSION}
docker push ${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
    echo "❌ Docker push failed!"
    exit 1
fi

echo "✅ Image pushed successfully"
echo ""

# Step 3: Deploy to Cloud Run
echo "🚢 Step 3: Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:${VERSION} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production,PORT=8080,FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app"

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Service URL: https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app"
echo ""
echo "📊 Next steps:"
echo "   1. Check logs: gcloud run services logs read ${SERVICE_NAME} --region ${REGION}"
echo "   2. Test the application at the URL above"
echo "   3. Verify LibreOffice functionality by generating a document"
echo ""
