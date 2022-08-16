import * as React from "react";
import styled from "styled-components";
import WalletConnect from "@walletconnect/client";
import Button from "./components/Button";
import Card from "./components/Card";
import Input from "./components/Input";
import Header from "./components/Header";
import Column from "./components/Column";
import PeerMeta from "./components/PeerMeta";
import RequestDisplay from "./components/RequestDisplay";
import RequestButton from "./components/RequestButton";
import AccountDetails from "./components/AccountDetails";
import QRCodeScanner, { IQRCodeValidateResponse } from "./components/QRCodeScanner";
import { getCachedSession } from "./helpers/utilities";


import { Amplify } from 'aws-amplify';

import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import awsExports from './aws-exports';
Amplify.configure(awsExports);

const SContainer = styled.div`
  display: flex;
  flex-direction: column;

  width: 100%;
  min-height: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
`;

const SVersionNumber = styled.div`
  position: absolute;
  font-size: 12px;
  bottom: 6%;
  right: 0;
  opacity: 0.3;
  transform: rotate(-90deg);
`;

const SContent = styled.div`
  width: 100%;
  flex: 1;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const SLogo = styled.div`
  padding: 10px 0;
  display: flex;
  max-height: 100px;
  & img {
    width: 100%;
  }
`;

const SActions = styled.div`
  margin: 0;
  margin-top: 20px;

  display: flex;
  justify-content: space-around;
  & > * {
    margin: 0 5px;
  }
`;

const SActionsColumn = styled(SActions as any)`
  flex-direction: row;
  align-items: center;

  margin: 24px 0 6px;

  & > p {
    font-weight: 600;
  }
`;

const SButton = styled(Button)`
  width: 50%;
  height: 40px;
`;

const SInput = styled(Input)`
  width: 50%;
  margin: 10px;
  font-size: 14px;
  height: 40px;
`;

const SConnectedPeer = styled.div`
  display: flex;
  align-items: center;
  & img {
    width: 40px;
    height: 40px;
  }
  & > div {
    margin-left: 10px;
  }
`;

const SRequestButton = styled(RequestButton)`
  margin-bottom: 10px;
`;



const App = () => {
  
  const state = INITIAL_STATE;

  const init = async () => {
    let { activeIndex, chainId } = state;

    const session = getCachedSession();

    if (!session) {
      await getAppControllers().wallet.init(activeIndex, chainId);
    } else {
      const connector = new WalletConnect({ session });

      const { connected, accounts, peerMeta } = connector;

      const address = accounts[0];

      activeIndex = accounts.indexOf(address);
      chainId = connector.chainId;

      await getAppControllers().wallet.init(activeIndex, chainId);

      await setState({
        connected,
        connector,
        address,
        activeIndex,
        accounts,
        chainId,
        peerMeta,
      });

      subscribeToEvents();
    }
    await getAppConfig().events.init(state, bindedSetState);
  };

  React.useEffect(() => {
    init()
  })

  const bindedSetState = (newState: Partial<IAppState>) => setState(newState);



  const approveSession = () => {
    console.log("ACTION", "approveSession");
    const { connector, chainId, address } = state;
    if (connector) {
      connector.approveSession({ chainId, accounts: [address] });
    }
    setState({ connector });
  };

  const rejectSession = () => {
    console.log("ACTION", "rejectSession");
    const { connector } = state;
    if (connector) {
      connector.rejectSession();
    }
    setState({ connector });
  };

  const killSession = () => {
    console.log("ACTION", "killSession");
    const { connector } = state;
    if (connector) {
      connector.killSession();
    }
    resetApp();
  };

  const resetApp = async () => {
    await setState({ ...INITIAL_STATE });
    init();
  };

  

  const updateSession = async (sessionParams: { chainId?: number; activeIndex?: number }) => {
    const { connector, chainId, accounts, activeIndex } = state;
    const newChainId = sessionParams.chainId || chainId;
    const newActiveIndex = sessionParams.activeIndex || activeIndex;
    const address = accounts[newActiveIndex];
    if (connector) {
      connector.updateSession({
        chainId: newChainId,
        accounts: [address],
      });
    }
    await setState({
      connector,
      address,
      accounts,
      activeIndex: newActiveIndex,
      chainId: newChainId,
    });
    await getAppControllers().wallet.update(newActiveIndex, newChainId);
    await getAppConfig().events.update(state, bindedSetState);
  };

  const updateChain = async (chainId: number | string) => {
    await updateSession({ chainId: Number(chainId) });
  };

  const updateAddress = async (activeIndex: number) => {
    await updateSession({ activeIndex });
  };

  const toggleScanner = () => {
    console.log("ACTION", "toggleScanner");
    setState({ scanner: !state.scanner });
  };

  const onQRCodeValidate = (data: string): IQRCodeValidateResponse => {
    const res: IQRCodeValidateResponse = {
      error: null,
      result: null,
    };
    try {
      res.result = data;
    } catch (error) {
      res.error = error;
    }

    return res;
  };

  const onQRCodeScan = async (data: any) => {
    const uri = typeof data === "string" ? data : "";
    if (uri) {
      await setState({ uri });
      await initWalletConnect();
      toggleScanner();
    }
  };

  const onURIPaste = async (e: any) => {
    const data = e.target.value;
    const uri = typeof data === "string" ? data : "";
    if (uri) {
      await setState({ uri });
      await initWalletConnect();
    }
  };

  const onQRCodeError = (error: Error) => {
    throw error;
  };

  const onQRCodeClose = () => toggleScanner();

  const openRequest = async (request: any) => {
    const payload = Object.assign({}, request);

    const params = payload.params[0];
    if (request.method === "eth_sendTransaction") {
      payload.params[0] = await getAppControllers().wallet.populateTransaction(params);
    }

    setState({
      payload,
    });
  };

  const closeRequest = async () => {
    const { requests, payload } = state;
    const filteredRequests = requests.filter(request => request.id !== payload.id);
    await setState({
      requests: filteredRequests,
      payload: null,
    });
  };

  const approveRequest = async () => {
    const { connector, payload } = state;

    try {
      await getAppConfig().rpcEngine.signer(payload, state, bindedSetState);
    } catch (error) {
      console.error(error);
      if (connector) {
        connector.rejectRequest({
          id: payload.id,
          error: { message: "Failed or Rejected Request" },
        });
      }
    }

    closeRequest();
    await setState({ connector });
  };

  const rejectRequest = async () => {
    const { connector, payload } = state;
    if (connector) {
      connector.rejectRequest({
        id: payload.id,
        error: { message: "Failed or Rejected Request" },
      });
    }
    await closeRequest();
    await setState({ connector });
  };

  const render() {
    const {
      peerMeta,
      scanner,
      connected,
      activeIndex,
      accounts,
      address,
      chainId,
      requests,
      payload,
    } = state;
    return (
      <React.Fragment>
        <SContainer>
          <Header
            connected={connected}
            address={address}
            chainId={chainId}
            killSession={killSession}
          />
          <SContent>
            <Card maxWidth={400}>
              <SLogo>
                <img src={getAppConfig().logo} alt={getAppConfig().name} />
              </SLogo>
              {!connected ? (
                peerMeta && peerMeta.name ? (
                  <Column>
                    <PeerMeta peerMeta={peerMeta} />
                    <SActions>
                      <Button onClick={approveSession}>{`Approve`}</Button>
                      <Button onClick={rejectSession}>{`Reject`}</Button>
                    </SActions>
                  </Column>
                ) : (
                  <Column>
                    <AccountDetails
                      chains={getAppConfig().chains}
                      address={address}
                      activeIndex={activeIndex}
                      chainId={chainId}
                      accounts={accounts}
                      updateAddress={updateAddress}
                      updateChain={updateChain}
                    />
                    <SActionsColumn>
                      <SButton onClick={toggleScanner}>{`Scan`}</SButton>
                      {getAppConfig().styleOpts.showPasteUri && (
                        <>
                          <p>{"OR"}</p>
                          <SInput onChange={onURIPaste} placeholder={"Paste wc: uri"} />
                        </>
                      )}
                    </SActionsColumn>
                  </Column>
                )
              ) : !payload ? (
                <Column>
                  <AccountDetails
                    chains={getAppConfig().chains}
                    address={address}
                    activeIndex={activeIndex}
                    chainId={chainId}
                    accounts={accounts}
                    updateAddress={updateAddress}
                    updateChain={updateChain}
                  />
                  {peerMeta && peerMeta.name && (
                    <>
                      <h6>{"Connected to"}</h6>
                      <SConnectedPeer>
                        <img src={peerMeta.icons[0]} alt={peerMeta.name} />
                        <div>{peerMeta.name}</div>
                      </SConnectedPeer>
                    </>
                  )}
                  <h6>{"Pending Call Requests"}</h6>
                  {requests.length ? (
                    requests.map(request => (
                      <SRequestButton key={request.id} onClick={() => openRequest(request)}>
                        <div>{request.method}</div>
                      </SRequestButton>
                    ))
                  ) : (
                    <div>
                      <div>{"No pending requests"}</div>
                    </div>
                  )}
                </Column>
              ) : (
                <RequestDisplay
                  payload={payload}
                  peerMeta={peerMeta}
                  renderPayload={(payload: any) => getAppConfig().rpcEngine.render(payload)}
                  approveRequest={approveRequest}
                  rejectRequest={rejectRequest}
                />
              )}
            </Card>
          </SContent>
          {scanner && (
            <QRCodeScanner
              onValidate={onQRCodeValidate}
              onScan={onQRCodeScan}
              onError={onQRCodeError}
              onClose={onQRCodeClose}
            />
          )}
        </SContainer>
        {getAppConfig().styleOpts.showVersion && (
          <SVersionNumber>{`v${process.env.REACT_APP_VERSION}`} </SVersionNumber>
        )}
      </React.Fragment>
    );
  }
}

export default withAuthenticator(App);
