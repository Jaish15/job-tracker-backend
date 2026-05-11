# Deployment Guide

## Architecture

```
[React App] ──► [S3 + CloudFront]
                       │
                       ▼
              [API Gateway (HTTP API)]
                       │
                       ▼
               [AWS Lambda Function]
                       │
                       ▼
          [PostgreSQL on EC2 (private subnet)]
```

---

## Prerequisites

- AWS account (free tier: https://aws.amazon.com)
- AWS CLI installed: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html
- Node.js 20+

---

## Step 1: Configure AWS Credentials

```bash
aws configure
# AWS Access Key ID:     <from IAM → Users → Security credentials>
# AWS Secret Access Key: <from IAM>
# Default region:        us-east-1
# Default output format: json
```

To get credentials: AWS Console → IAM → Users → your user → Security credentials → Create access key.

---

## Step 2: Launch EC2 for PostgreSQL

1. AWS Console → **EC2 → Launch Instance**
2. Name: `job-tracker-db`
3. AMI: **Amazon Linux 2023** (free tier eligible)
4. Instance type: **t2.micro** (free tier)
5. Key pair: Create new → download `.pem` file
6. Security Group — add inbound rules:
   - SSH: port 22, source = My IP
   - PostgreSQL: port 5432, source = `0.0.0.0/0` (or restrict to Lambda's IP range)
7. Click **Launch Instance**

---

## Step 3: Install PostgreSQL on EC2

```bash
# SSH in (replace with your actual IP and key path)
ssh -i ~/Downloads/your-key.pem ec2-user@<EC2-PUBLIC-IP>

# Install PostgreSQL 15
sudo dnf install postgresql15-server postgresql15 -y

# Initialize and start
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create DB and user
sudo -u postgres psql
```

Inside psql:
```sql
CREATE DATABASE job_tracker;
CREATE USER jobuser WITH ENCRYPTED PASSWORD 'StrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE job_tracker TO jobuser;
ALTER DATABASE job_tracker OWNER TO jobuser;
\q
```

Allow password auth and remote connections:
```bash
# Edit pg_hba.conf — change "ident" to "md5" for local IPv4 line
sudo sed -i 's/host    all             all             127.0.0.1\/32            ident/host    all             all             0.0.0.0\/0               md5/' /var/lib/pgsql/data/pg_hba.conf

# Edit postgresql.conf — allow remote connections
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /var/lib/pgsql/data/postgresql.conf

sudo systemctl restart postgresql
```

---

## Step 4: Deploy API to AWS Lambda

### Set environment variables

Create a `.env.prod` file (never commit this):

```bash
# .env.prod
DB_HOST=<EC2-PUBLIC-IP-or-PRIVATE-IP>
DB_PORT=5432
DB_USERNAME=jobuser
DB_PASSWORD=StrongPassword123!
DB_NAME=job_tracker
JWT_SECRET=a-very-long-random-secret-string-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-s3-or-cloudfront-url.com
```

### Deploy

```bash
# From job-tracker-backend/job-tracker-backend/

# Build + deploy to dev stage
npm run deploy:dev

# Or deploy to prod stage
npm run deploy:prod
```

This runs `nest build` then `serverless deploy` automatically.

After deploy, Serverless prints the API endpoint URL:
```
endpoint: ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api/{proxy+}
```

Copy that URL — you'll need it for the frontend.

### Set env vars on Lambda (after first deploy)

Option A — via AWS Console:
1. Lambda → Functions → `job-tracker-api-prod-api`
2. Configuration → Environment variables → Edit
3. Add all variables from `.env.prod`

Option B — via CLI:
```bash
aws lambda update-function-configuration \
  --function-name job-tracker-api-prod-api \
  --environment "Variables={DB_HOST=<ip>,DB_PASSWORD=<pw>,JWT_SECRET=<secret>,DB_USERNAME=jobuser,DB_NAME=job_tracker,NODE_ENV=production,FRONTEND_URL=<url>}"
```

---

## Step 5: Deploy Frontend to S3

```bash
# From job-tracker-frontend/job-tracker-frontend/

# Update .env with the Lambda API URL
echo "VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api" > .env

# Build
npm run build

# Create S3 bucket (use a unique name)
aws s3 mb s3://job-tracker-frontend-yourname --region us-east-1

# Enable static website hosting
aws s3 website s3://job-tracker-frontend-yourname \
  --index-document index.html \
  --error-document index.html

# Upload
aws s3 sync dist/ s3://job-tracker-frontend-yourname --delete

# Make publicly readable
aws s3api put-bucket-policy \
  --bucket job-tracker-frontend-yourname \
  --policy '{
    "Version":"2012-10-17",
    "Statement":[{
      "Effect":"Allow",
      "Principal":"*",
      "Action":"s3:GetObject",
      "Resource":"arn:aws:s3:::job-tracker-frontend-yourname/*"
    }]
  }'
```

Your app is live at:
`http://job-tracker-frontend-yourname.s3-website-us-east-1.amazonaws.com`

---

## Step 6: Test Locally with serverless-offline

To test the Lambda handler locally before deploying:

```bash
npm run offline
# API available at http://localhost:3000
```

---

## Common Deployment Errors

| Error | Fix |
|-------|-----|
| `credentials not found` | Run `aws configure` |
| `Cannot connect to DB` | Check EC2 security group allows port 5432; check DB_HOST is correct |
| `Internal server error` on Lambda | Check Lambda CloudWatch logs: AWS Console → Lambda → Monitor → View logs |
| `handler not found` | Make sure `npm run build` ran before deploy — `dist/lambda.js` must exist |
| `CORS error` in browser | Set `FRONTEND_URL` env var on Lambda to your S3/CloudFront URL |
| `401 Unauthorized` | JWT_SECRET on Lambda must match what was used to sign tokens |

---

## End-to-End Validation Checklist

- [ ] `npm run build` completes with no errors
- [ ] `npm run offline` starts and responds at `http://localhost:3000/api`
- [ ] `POST /api/auth/register` creates a user
- [ ] `POST /api/auth/login` returns a JWT token
- [ ] `GET /api/jobs` with Bearer token returns jobs list
- [ ] Lambda deployed — endpoint URL printed by serverless
- [ ] Lambda CloudWatch logs show no errors
- [ ] Frontend `.env` updated with Lambda URL, rebuilt, re-uploaded to S3
- [ ] Register/login works end-to-end in browser
- [ ] Create, edit, delete a job application
- [ ] Admin panel visible when logged in as admin role
