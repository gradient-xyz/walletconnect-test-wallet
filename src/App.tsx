import * as React from "react";
import { Amplify, Hub, Logger } from "aws-amplify";
import styled from "styled-components";

// import { withAuthenticator } from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css";
// import { CognitoHostedUIIdentityProvider, CognitoUser } from '@aws-amplify/auth';

import { Web3ContextProvider } from "./context/walletConnectContext";
import { Main } from "./components/Main";
import { getAppConfig } from "./config";
// import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

Amplify.configure({
  aws_cognito_region: "us-west-2", // (required) - Region where Amazon Cognito project was created
  aws_user_pools_id: "us-west-2_aROxhrnRw", // (optional) -  Amazon Cognito User Pool ID
  aws_user_pools_web_client_id: "48fars57hcget42e3pq5c0nccb", // (optional) - Amazon Cognito App Client ID (App client secret needs to be disabled)
  aws_cognito_identity_pool_id: "us-west-2:956b16c0-a11e-4b1f-8468-813e145590ea", // (optional) - Amazon Cognito Identity Pool ID
  aws_mandatory_sign_in: "enable", // (optional) - Users are not allowed to get the aws credentials unless they are signed in

  oauth: {
    domain: "bryan-test.auth.us-west-2.amazoncognito.com",
    scope: ["profile", "email", "openid"],
    redirectSignIn: "http://localhost:3000/",
    redirectSignOut: "http://localhost:3000/",
    clientId: "48fars57hcget42e3pq5c0nccb",
    responseType: "code", // or 'token', note that REFRESH token will only be generated when the responseType is code
  },
});

const SVersionNumber = styled.div`
  position: absolute;
  font-size: 12px;
  bottom: 6%;
  right: 0;
  opacity: 0.3;
  transform: rotate(-90deg);
`;

const logger = new Logger("My-Logger");

const listener = (data: any) => {
  switch (data.payload.event) {
    case "signIn":
      logger.info("user signed in", data);
      break;
    case "signUp":
      logger.info("user signed up", data);
      break;
    case "signOut":
      logger.info("user signed out", data);
      break;
    case "signIn_failure":
      logger.error("user sign in failed", data);
      break;
    case "tokenRefresh":
      logger.info("token refresh succeeded", data);
      break;
    case "tokenRefresh_failure":
      logger.error("token refresh failed", data);
      break;
    case "autoSignIn":
      logger.info("Auto Sign In after Sign Up succeeded", data);
      break;
    case "autoSignIn_failure":
      logger.error("Auto Sign In after Sign Up failed", data);
      break;
    case "configured":
      logger.info("the Auth module is configured", data);
  }
};

Hub.listen("auth", listener);

const App = () => {
  // const updateSession = async (sessionParams: { chainId?: number; activeIndex?: number }) => {
  //   const { connector, chainId, accounts, activeIndex } = state;
  //   const newChainId = sessionParams.chainId || chainId;
  //   const newActiveIndex = sessionParams.activeIndex || activeIndex;
  //   const address = accounts[newActiveIndex];
  //   if (connector) {
  //     connector.updateSession({
  //       chainId: newChainId,
  //       accounts: [address],
  //     });
  //   }
  //   await setState({
  //     connector,
  //     address,
  //     accounts,
  //     activeIndex: newActiveIndex,
  //     chainId: newChainId,
  //   });
  //   await getAppControllers().wallet.update(newActiveIndex, newChainId);
  //   await getAppConfig().events.update(state, bindedSetState);
  // };

  // const updateChain = async (chainId: number | string) => {
  //   await updateSession({ chainId: Number(chainId) });
  // };

  // const updateAddress = async (activeIndex: number) => {
  //   await updateSession({ activeIndex });
  // };

  // const openRequest = async (request: any) => {
  //   const payload = Object.assign({}, request);

  //   const params = payload.params[0];
  //   if (request.method === "eth_sendTransaction") {
  //     payload.params[0] = await getAppControllers().wallet.populateTransaction(params);
  //   }

  //   setState({
  //     payload,
  //   });
  // };

  // const closeRequest = async () => {
  //   const { requests, payload } = state;
  //   const filteredRequests = requests.filter(request => request.id !== payload.id);
  //   await setState({
  //     requests: filteredRequests,
  //     payload: null,
  //   });
  // };

  // const approveRequest = async () => {
  //   const { connector, payload } = state;

  //   try {
  //     await getAppConfig().rpcEngine.signer(payload, state, bindedSetState);
  //   } catch (error) {
  //     console.error(error);
  //     if (connector) {
  //       connector.rejectRequest({
  //         id: payload.id,
  //         error: { message: "Failed or Rejected Request" },
  //       });
  //     }
  //   }

  //   closeRequest();
  //   await setState({ connector });
  // };

  // const rejectRequest = async () => {
  //   const { connector, payload } = state;
  //   if (connector) {
  //     connector.rejectRequest({
  //       id: payload.id,
  //       error: { message: "Failed or Rejected Request" },
  //     });
  //   }
  //   await closeRequest();
  //   await setState({ connector });
  // };

  // const [user, setUser] = useState<CognitoUser | null>(null);
  // const [customState, setCustomState] = useState<any | null>(null);

  // useEffect(() => {
  //   const unsubscribe = Hub.listen("auth", ({ payload: { event, data } }) => {
  //     switch (event) {
  //       case "signIn":
  //         setUser(data);
  //         break;
  //       case "signOut":
  //         setUser(null);
  //         break;
  //       case "customOAuthState":
  //         setCustomState(data);
  //     }
  //   });

  //   Auth.currentAuthenticatedUser()
  //     .then(currentUser => setUser(currentUser))
  //     .catch(() => console.log("Not signed in"));

  //   return unsubscribe;
  // }, []);

  return (
    <React.Fragment>
      <Authenticator socialProviders={["google"]}>
        <Web3ContextProvider>
          <Main />
        </Web3ContextProvider>
      </Authenticator>
      {getAppConfig().styleOpts.showVersion && (
        <SVersionNumber>{`v${process.env.REACT_APP_VERSION}`} </SVersionNumber>
      )}
    </React.Fragment>
  );
};

export default App;
