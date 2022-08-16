import React from "react"
import styled from "styled-components"
import { useWalletConnectContext } from "src/context/walletConnectContext"
import Column from "./Column"
import PeerMeta from "./PeerMeta"
import Button from "./Button"

const SActions = styled.div`
  margin: 0;
  margin-top: 20px;

  display: flex;
  justify-content: space-around;
  & > * {
    margin: 0 5px;
  }
`;

export const PeerDataCol = () => {
    const { peerMeta, approveSession, rejectSession } = useWalletConnectContext()
    return (
        peerMeta && peerMeta.name ? (
          <Column>
            <PeerMeta peerMeta={peerMeta} />
            <SActions>
              <Button onClick={approveSession}>{`Approve`}</Button>
              <Button onClick={rejectSession}>{`Reject`}</Button>
            </SActions>
          </Column>
        )
}