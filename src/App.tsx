import * as React from "react";
import { Amplify } from 'aws-amplify';
import styled from "styled-components"

import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';

import { Web3ContextProvider } from "./context/walletConnectContext";
import { Main } from "./components/Main";
import { getAppConfig } from "./config";

Amplify.configure(awsExports);

const SVersionNumber = styled.div`
  position: absolute;
  font-size: 12px;
  bottom: 6%;
  right: 0;
  opacity: 0.3;
  transform: rotate(-90deg);
`;


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

    return (
      <React.Fragment>
        <Web3ContextProvider>
          <Main />
        </Web3ContextProvider>
        {getAppConfig().styleOpts.showVersion && (
          <SVersionNumber>{`v${process.env.REACT_APP_VERSION}`} </SVersionNumber>
        )}
      </React.Fragment>
    );
  
}

export default withAuthenticator(App);
