import { useAuthenticator } from "@aws-amplify/ui-react";
import * as React from "react";
import { useWalletConnectContext } from "src/context/walletConnectContext";
import styled from "styled-components";
import Dropdown from "../components/Dropdown";
import { IChainData } from "../helpers/types";
import { ellipseAddress, getViewportDimensions } from "../helpers/utilities";
import { responsive } from "../styles";
import Blockie from "./Blockie";

const SSection = styled.div`
  width: 100%;
`;

const SBlockie = styled(Blockie)`
  margin-right: 5px;
  @media screen and (${responsive.xs.max}) {
    margin-right: 1vw;
  }
`;

const SAddressDropdownWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface IAccountDetailsProps {
  chains: IChainData[];
}

const AccountDetails = (props: IAccountDetailsProps) => {
  const { chains } = props;
  const { chainId, address, activeIndex, accounts, updateSession } = useWalletConnectContext();
  const windowWidth = getViewportDimensions().x;
  const maxWidth = 468;
  const maxChar = 12;
  const ellipseLength =
    windowWidth > maxWidth ? maxChar : Math.floor(windowWidth * (maxChar / maxWidth));
  const accountsMap = accounts.map((addr: string, index: number) => ({
    index,
    display_address: ellipseAddress(addr, ellipseLength),
  }));

  function updateAddress(activeIndex: number) {
    if (updateSession) {
      updateSession(undefined, activeIndex);
    }
  }

  function updateChain(chainId: number | string) {
    if (updateSession) {
      updateSession(Number(chainId), undefined);
    }
  }

  const { user } = useAuthenticator(context => [context.user]);

  if (address) {
    return (
      <React.Fragment>
        <SSection>
          <h6>
            {"Account"} {user.username}
          </h6>
          <SAddressDropdownWrapper>
            <SBlockie size={40} address={address} />
            <Dropdown
              monospace
              selected={activeIndex}
              options={accountsMap}
              displayKey={"display_address"}
              targetKey={"index"}
              onChange={updateAddress}
            />
          </SAddressDropdownWrapper>
        </SSection>
        <SSection>
          <h6>{"Network"}</h6>
          <Dropdown
            selected={chainId}
            options={chains}
            displayKey={"name"}
            targetKey={"chain_id"}
            onChange={updateChain}
          />
        </SSection>
      </React.Fragment>
    );
  } else {
    return <></>;
  }
};
export default AccountDetails;
