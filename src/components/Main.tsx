import React from "react";
import styled from "styled-components";
import { useWalletConnectContext } from "src/context/walletConnectContext";
import Header from "./Header";
import Card from "./Card";
import { getAppConfig } from "src/config";
import { PeerDataCol } from "./PeerDataCol";
import AccountDetails from "./AccountDetails";
import Column from "./Column";
import QRCodeScanner, { IQRCodeValidateResponse } from "./QRCodeScanner";
import RequestButton from "./RequestButton";
import RequestDisplay from "./RequestDisplay";
import Button from "./Button";
import Input from "./Input";

const SContainer = styled.div`
  display: flex;
  flex-direction: column;

  width: 100%;
  min-height: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
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

export const Main = () => {
  const {
    connected,
    requests,
    peerMeta,
    payload,
    connect,
    openRequest,
    approveRequest,
    rejectRequest,
  } = useWalletConnectContext();

  const [scanner, setScanner] = React.useState(false);
  const toggleScanner = () => {
    console.log("ACTION", "toggleScanner");
    setScanner(!scanner);
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
      await connect!(uri);
      toggleScanner();
    }
  };

  const onURIPaste = async (e: any) => {
    const data = e.target.value;
    const uri = typeof data === "string" ? data : "";
    if (uri && connect) {
      await connect(uri);
    } else {
      console.log("wc not initialized");
    }
  };

  const onQRCodeError = (error: Error) => {
    throw error;
  };

  const onQRCodeClose = () => toggleScanner();

  const ConnectionSection = () => {
    if (peerMeta) {
      return <PeerDataCol />;
    } else {
      return (
        <Column>
          <AccountDetails chains={getAppConfig().chains} />
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
      );
    }
  };

  const RequestSection = () => {
    if (connected) {
      if (payload) {
        return (
          <RequestDisplay
            payload={payload}
            peerMeta={peerMeta}
            renderPayload={(payload: any) => getAppConfig().rpcEngine.render(payload)}
            approveRequest={approveRequest}
            rejectRequest={rejectRequest}
          />
        );
      } else {
        return (
          <Column>
            <AccountDetails chains={getAppConfig().chains} />
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
                <SRequestButton key={request.id} onClick={() => openRequest!(request)}>
                  <div>{request.method}</div>
                </SRequestButton>
              ))
            ) : (
              <div>
                <div>{"No pending requests"}</div>
              </div>
            )}
          </Column>
        );
      }
    } else {
      return <></>;
    }
  };

  return (
    <SContainer>
      <Header />
      <SContent>
        <Card maxWidth={400}>
          <SLogo>
            <img src={getAppConfig().logo} alt={getAppConfig().name} />
          </SLogo>
          <ConnectionSection />
          <RequestSection />
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
  );
};
