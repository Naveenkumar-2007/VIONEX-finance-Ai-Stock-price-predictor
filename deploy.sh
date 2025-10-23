#!/bin/bash

###############################################################################
# VIONEX Finance - Automated Deployment Script
# This script deploys the stock prediction application to production
###############################################################################

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="vionex-stock-predictor"
DEPLOYMENT_TARGET="${1:-heroku}"  # heroku, aws, railway, docker
ENVIRONMENT="${2:-production}"

echo -e "${YELLOW}Deployment Target: $DEPLOYMENT_TARGET${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"

###############################################################################
# Step 1: Pre-deployment checks
###############################################################################
echo ""
echo "📋 Step 1: Pre-deployment checks..."

# Check if model exists
if [ ! -f "artifacts/stock_lstm_model.h5" ]; then
    echo -e "${RED}❌ Model file not found!${NC}"
    echo "Training model first..."
    python mlops/training_pipeline.py
fi

# Check dependencies
echo "Checking dependencies..."
pip list > /dev/null 2>&1 || {
    echo -e "${RED}❌ pip not found!${NC}"
    exit 1
}

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

###############################################################################
# Step 2: Run tests
###############################################################################
echo ""
echo "🧪 Step 2: Running tests..."

if [ -f "mlops/test_mlops.py" ]; then
    pytest mlops/test_mlops.py -v || {
        echo -e "${RED}❌ Tests failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠ No tests found, skipping...${NC}"
fi

###############################################################################
# Step 3: Build application
###############################################################################
echo ""
echo "🏗️ Step 3: Building application..."

# Create requirements if not exists
if [ ! -f "requirements.txt" ]; then
    pip freeze > requirements.txt
fi

echo -e "${GREEN}✅ Build completed${NC}"

###############################################################################
# Step 4: Deploy based on target
###############################################################################
echo ""
echo "🚀 Step 4: Deploying to $DEPLOYMENT_TARGET..."

case $DEPLOYMENT_TARGET in
    heroku)
        echo "Deploying to Heroku..."
        
        # Login to Heroku (requires HEROKU_API_KEY env var)
        if [ -z "$HEROKU_API_KEY" ]; then
            echo -e "${YELLOW}⚠ HEROKU_API_KEY not set. Attempting interactive login...${NC}"
            heroku login
        else
            echo "$HEROKU_API_KEY" | heroku auth:token
        fi
        
        # Create Heroku app if doesn't exist
        heroku apps:info --app $APP_NAME > /dev/null 2>&1 || {
            echo "Creating Heroku app..."
            heroku create $APP_NAME
        }
        
        # Set environment variables
        heroku config:set PYTHON_VERSION=3.10 --app $APP_NAME
        heroku config:set ENVIRONMENT=$ENVIRONMENT --app $APP_NAME
        
        # Deploy
        git push heroku main
        
        echo -e "${GREEN}✅ Deployed to Heroku: https://$APP_NAME.herokuapp.com${NC}"
        ;;
    
    aws)
        echo "Deploying to AWS EC2..."
        
        # Check AWS CLI
        aws --version > /dev/null 2>&1 || {
            echo -e "${RED}❌ AWS CLI not installed!${NC}"
            exit 1
        }
        
        # Deploy using SSH
        if [ -z "$EC2_HOST" ]; then
            echo -e "${RED}❌ EC2_HOST not set!${NC}"
            exit 1
        fi
        
        echo "Uploading files to EC2..."
        rsync -avz --exclude='.git' --exclude='venv' --exclude='__pycache__' \
            ./ $EC2_USER@$EC2_HOST:/home/$EC2_USER/$APP_NAME/
        
        echo "Running deployment on EC2..."
        ssh $EC2_USER@$EC2_HOST << 'EOF'
            cd /home/$EC2_USER/$APP_NAME
            source venv/bin/activate
            pip install -r requirements.txt
            sudo systemctl restart vionex-app
EOF
        
        echo -e "${GREEN}✅ Deployed to AWS EC2: http://$EC2_HOST${NC}"
        ;;
    
    railway)
        echo "Deploying to Railway..."
        
        # Install Railway CLI if not exists
        which railway > /dev/null 2>&1 || {
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        }
        
        # Deploy
        railway up
        
        echo -e "${GREEN}✅ Deployed to Railway${NC}"
        ;;
    
    docker)
        echo "Building Docker image..."
        
        # Build Docker image
        docker build -t $APP_NAME:latest .
        
        # Tag for registry
        if [ ! -z "$DOCKER_REGISTRY" ]; then
            docker tag $APP_NAME:latest $DOCKER_REGISTRY/$APP_NAME:latest
            docker push $DOCKER_REGISTRY/$APP_NAME:latest
        fi
        
        # Run container
        echo "Starting Docker container..."
        docker stop $APP_NAME > /dev/null 2>&1 || true
        docker rm $APP_NAME > /dev/null 2>&1 || true
        
        docker run -d \
            --name $APP_NAME \
            -p 5000:5000 \
            -e ENVIRONMENT=$ENVIRONMENT \
            --restart unless-stopped \
            $APP_NAME:latest
        
        echo -e "${GREEN}✅ Docker container running on http://localhost:5000${NC}"
        ;;
    
    *)
        echo -e "${RED}❌ Unknown deployment target: $DEPLOYMENT_TARGET${NC}"
        echo "Supported targets: heroku, aws, railway, docker"
        exit 1
        ;;
esac

###############################################################################
# Step 5: Post-deployment verification
###############################################################################
echo ""
echo "🏥 Step 5: Running health checks..."

sleep 10  # Wait for application to start

# Health check
case $DEPLOYMENT_TARGET in
    heroku)
        URL="https://$APP_NAME.herokuapp.com"
        ;;
    aws)
        URL="http://$EC2_HOST"
        ;;
    docker)
        URL="http://localhost:5000"
        ;;
    *)
        URL=""
        ;;
esac

if [ ! -z "$URL" ]; then
    echo "Checking $URL..."
    
    # Check if app is responding
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)
    
    if [ $HTTP_STATUS -eq 200 ]; then
        echo -e "${GREEN}✅ Application is healthy (HTTP $HTTP_STATUS)${NC}"
        
        # Test API endpoint
        API_RESPONSE=$(curl -s "$URL/api/stock_data/AAPL")
        if echo $API_RESPONSE | grep -q "success"; then
            echo -e "${GREEN}✅ API endpoint is working${NC}"
        else
            echo -e "${YELLOW}⚠ API endpoint might have issues${NC}"
        fi
    else
        echo -e "${RED}❌ Health check failed (HTTP $HTTP_STATUS)${NC}"
        exit 1
    fi
fi

###############################################################################
# Step 6: Deployment summary
###############################################################################
echo ""
echo "================================================"
echo -e "${GREEN}🎉 Deployment Successful!${NC}"
echo "================================================"
echo "Target: $DEPLOYMENT_TARGET"
echo "Environment: $ENVIRONMENT"
if [ ! -z "$URL" ]; then
    echo "URL: $URL"
fi
echo "Time: $(date)"
echo "================================================"

# Save deployment info
cat > deployment_info.json << EOF
{
  "target": "$DEPLOYMENT_TARGET",
  "environment": "$ENVIRONMENT",
  "url": "$URL",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)"
}
EOF

echo ""
echo "📝 Deployment info saved to deployment_info.json"
echo ""
echo -e "${GREEN}✨ All done!${NC}"
