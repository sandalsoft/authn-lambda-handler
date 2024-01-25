

## Notes



### Datazone info
-  GetUserProfile is the call to fetch user information - https://docs.aws.amazon.com/datazone/latest/APIReference/API_GetUserProfile.html

- Datazone running with configured domain and valid users
- authn webhook running as lambda

# Pre-Requisites
### Bun.js Layer
- If you want to use bun, follow instructions here: https://github.com/oven-sh/bun/tree/main/packages/bun-lambda

- If not, create a Lambda using a different method and modify the build and deploy scripts to upload the lambda code as appropriate


# Usage
### Install node dependencies
1. `npm install`

### This will build the code into a zip file that runs in Lambda.
2. `bun run build`

###  This will copy the zip file to your AWS Lambda
3. `bun run deploy`



