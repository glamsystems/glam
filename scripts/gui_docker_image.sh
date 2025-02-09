#!/bin/bash

# Detect the operating system
OS=$(uname)

# Define variables for Dockerfile path and image tags
DOCKERFILE_PATH="./gui/Dockerfile"
IMAGE_NAME="glam-pg"
REGISTRY_URL="us-west1-docker.pkg.dev/glam-playground/default"
BUILD_ARGS=""

# Check if the OS is macOS
if [[ "$OS" == "Darwin" ]]; then
    echo "macOS detected. Using Docker Buildx for multi-platform builds."
    BUILD_ARGS="buildx build --platform linux/amd64"
elif [[ "$OS" == "Linux" ]]; then
    echo "Linux detected. Using standard Docker build."
    BUILD_ARGS="build"
else
    echo "Unsupported operating system: $OS"
    exit 1
fi

docker $BUILD_ARGS -f $DOCKERFILE_PATH -t $IMAGE_NAME . --load && \
    docker tag $IMAGE_NAME:latest $REGISTRY_URL/$IMAGE_NAME:latest && \
    docker push $REGISTRY_URL/$IMAGE_NAME:latest