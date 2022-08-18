# walletconnect-test-wallet

Test Wallet (Web)

## Setup INFURA project id

An INFURA project id is required to run this project. [Signup for a free INFURA project id here](https://infura.io/product/ethereum).

Once you have the project id, setup the environment variable in file `.env.local` as follow.

```
REACT_APP_INFURA_PROJECT_ID=<your infura project id>
```

## Setup Amplify CLI Globally

[Amplify setup](https://docs.amplify.aws/cli/start/install/).
Initially configured with AWS Profile named `amplify`. Reference: [Named profiles for the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).

### Functions

Incorporated Typescript following [this guide](https://docs.amplify.aws/cli/function/build-options/)

## Develop

```bash
npm run start
```

## Test

```bash
npm run test
```

## Build

```bash
npm run build
```
