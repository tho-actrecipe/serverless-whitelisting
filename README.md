# Serverless Whitelisting

Create a whitelist for IP addresses, CIDR for a serverless application, using serverless resource policies.

This plugin requires serverless 3.18 or higher.

## Private and Public Stages

IP addresses, CIDR are whitelisted by stages and `publicPaths`.

- `privateStages`: Private to whitelisted CIDR and IP addresses. In the example below, `staging` and `production` stages are `privateStages`, so only those CIDR and IP addresses can access `staging` and `production`.
- `publicStages`: No whitelisting necessary. These stages are public to all CIDR and IP addresses.
- `publicPaths`: No whitelisting necessary regardless stages.

## How to Use

1. Install in your serverless application: `npm install --save serverless-whitelisting`
2. In your `serverless.yml` file, add the `serverless-whitelisting` to `plugins`, for example:
   ```
   plugins:
   - serverless-whitelisting
   ```
3. Within the `provider` block, add a `stage` variable:
   ```
   provider:
     stage: ${opt:stage, 'dev'}
   ```
4. Within a `custom` block, add:
   ```
   custom:
     serverless-whitelisting:
       stage: ${self:provider.stage}
       privateStages:
         - staging
         - production
       publicStages:
         - test
       netblocks:
         - 212.204.161.60/24
         - 68.159.185.46
       publicPaths:
         - oauth
         - oauth-test
   ```

> The `netblocks` object will contain the list of whitelisted IPs.

### Full Example

```
# serverless.yml

service: my-service-name

plugins:
  - serverless-whitelisting

provider:
  stage: ${opt:stage, 'test'}

custom:
  serverless-whitelisting:
    stage: ${self:provider.stage}
    privateStages:
      - staging
      - production
    publicStages:
      - test
    netblocks:
      - 212.204.161.60/24
      - 68.159.185.46
    publicPaths:
      - oauth
      - oauth-test
```
