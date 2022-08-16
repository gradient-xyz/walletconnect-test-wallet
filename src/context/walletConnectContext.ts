import React, { createContext, ReactChild, useCallback, useContext, useEffect, useReducer, useState } from "react";
import { getAppControllers } from "../controllers";
import { getAppConfig } from "../config";

import { DEFAULT_CHAIN_ID, DEFAULT_ACTIVE_INDEX } from "../constants/default";
import WalletConnect from "@walletconnect/client";
import { getCachedSession } from "src/helpers/utilities";
import { IClientMeta } from "@walletconnect/types";

interface WCState {
    connect: ((uri: string) => Promise<void>) | null;
    approveSession: (() => void) | null;
    rejectSession: (() => void) | null;

    loading: boolean;
    scanner: boolean;
    connector: WalletConnect | null;
    uri: string;
    peerMeta: IClientMeta | null;
    connected: boolean;
    chainId: number;
    accounts: string[];
    activeIndex: number;
    address: string;
    requests: any[];
    results: any[];
    payload: any;
}

const DEFAULT_ACCOUNTS = getAppControllers().wallet.getAccounts();
const DEFAULT_ADDRESS = DEFAULT_ACCOUNTS[DEFAULT_ACTIVE_INDEX];

const INITIAL_STATE: WCState = {
    connect: null,

    loading: false,
    scanner: false,
    connector: null,
    uri: "",
    peerMeta: {
        description: "",
        url: "",
        icons: [],
        name: "",
        ssl: false,
    },
    connected: false,
    chainId: getAppConfig().chainId || DEFAULT_CHAIN_ID,
    accounts: DEFAULT_ACCOUNTS,
    address: DEFAULT_ADDRESS,
    activeIndex: DEFAULT_ACTIVE_INDEX,
    requests: [],
    results: [],
    payload: null,
};

type WCAction =
    | {
        type: 'connect',
        connector: WalletConnect
    }
    | {
        type: 'approveSession'
    }
    | {
        type: 'rejectSession'
    }
    | {
        type: 'killSession'
    }
    | {
        type: 'updateSession',
        chainId: number,
        activeIndex: number
    }
    | {
        type: 'setUri',
        uri: string
    }
    | {
        type: 'openRequest'
        request: any
    }
    | {
        type: 'closeRequest'
    }
    | {
        type: 'approveRequest'
    }
    | {
        type: 'rejectRequest'
    }
    | {
        type: 'sessionRequest',
        peerMeta: any
    }
    | {
        type: 'reset'
    }

const wcReducer = (state: WCState, action: WCAction): WCState => {
    switch(action.type) {
        case 'reset':
            return INITIAL_STATE

        case 'updateSession':
            return {
                ...state,
                chainId: action.chainId,
                activeIndex: action.activeIndex,
                address: state.accounts[action.activeIndex]
            }

        case 'connect':
            return {
                ...state,
                uri: action.connector.uri,
                connector: action.connector,
                connected: action.connector.connected,
                peerMeta: action.connector.peerMeta,
                loading: false
            }

        default:
            throw new Error('unhandled type in reducer ' + action)
    }
}

  const useWalletConnect = (): WCState => {
    const [state, dispatch] = useReducer(wcReducer, INITIAL_STATE)
    const { connector, connected, activeIndex, chainId, address } = state

    useEffect(() => {
        // re-establsh session if there is an existing one
        const session = getCachedSession();

        if (!session) {
            // TODO replace with API call to get wallets
            await getAppControllers().wallet.init(activeIndex, chainId);
        } else {
            const connector = new WalletConnect({ session });

            const { accounts } = connector;

            const address = accounts[0];

            const activeIndex = accounts.indexOf(address);
            const chainId = connector.chainId;

            dispatch({
                type: 'connect',
                connector
            })

            dispatch({
                type: 'updateSession',
                activeIndex: activeIndex,
                chainId: chainId
            })

            await getAppControllers().wallet.init(activeIndex, chainId);
        }
    })

    const connect = useCallback(async (uri: string) => {
        // setState({ loading: true });

        try {
          const connector = new WalletConnect({ uri });
    
          if (!connector.connected) {
            await connector.createSession();
          }

          dispatch({
            type: 'connect',
            connector
          } as WCAction)

        } catch (error) {
        //   setState({ loading: false });
    
          throw error;
        }
    }, [])

    const approveSession = useCallback(() => {
        console.log("ACTION", "approveSession");
        const { connector, chainId, address } = state;
        if (connector) {
          connector.approveSession({ chainId, accounts: [address] });
        }
    }, [connector, chainId, address]);

    const rejectSession = useCallback(() => {
        console.log("ACTION", "rejectSession");
        const { connector } = state;
        if (connector) {
          connector.rejectSession();
          dispatch({
            type: 'rejectSession'
          })
        }
    }, [connector]);

    const killSession = useCallback(() => {
        console.log("ACTION", "killSession");
        const { connector } = state;
        if (connector) {
          connector.killSession();
        }

        dispatch({
            type: 'reset'
        })
    }, [connector]);
    
    useEffect(() => {
        // setup event listeners when there is a wallet connect session

        if (connector) {
            console.log("ACTION", "subscribeToEvents");
            const handleSessionRequest = (error, payload) => {
                console.log("EVENT", "session_request");

                if (error) {
                    throw error;
                }
                console.log("SESSION_REQUEST", payload.params);
                const { peerMeta } = payload.params[0];
                dispatch({
                    type: 'sessionRequest',
                    peerMeta
                })
            }
            connector.on("session_request", handleSessionRequest);

            const handleSessionUpdate = error => {
                console.log("EVENT", "session_update");

                if (error) {
                    throw error;
                }
            }

            connector.on("session_update", handleSessionUpdate);

            const handleCallRequest = async (error, payload) => {
                // tslint:disable-next-line
                console.log("EVENT", "call_request", "method", payload.method);
                console.log("EVENT", "call_request", "params", payload.params);

                if (error) {
                    throw error;
                }

                await getAppConfig().rpcEngine.router(payload, state, bindedSetState);
            }
            connector.on("call_request", handleCallRequest);

            const handleConnect = (error, payload) => {
                console.log("EVENT", "connect");

                if (error) {
                    throw error;
                }

                setState({ connected: true });
            }
            connector.on("connect", handleConnect);

            const handleDisconnect = (error, payload) => {
                console.log("EVENT", "disconnect");

                if (error) {
                    throw error;
                }

                resetApp();
            }
            connector.on("disconnect", handleDisconnect);

            //   if (connector.connected) {
            //     const { chainId, accounts } = connector;
            //     const index = 0;
            //     const address = accounts[index];
            //     getAppControllers().wallet.update(index, chainId);
            //     setState({
            //       connected: true,
            //       address,
            //       chainId,
            //     });
            //   }

            return () => {
                connector.removeListener("session_request", handleSessionRequest)
                connector.removeListener("session_update", handleSessionUpdate)
                connector.removeListener("call_request", handleCallRequest)
                connector.removeListener("connect", handleConnect)
                connector.removeListener("disconnect", handleDisconnect)

            }
        }
    }, [connector, connected])

    return {
        ...state,
        connect,
        approveSession,
        rejectSession,
        killSession,
    }
}

const WalletConnectContext = createContext(INITIAL_STATE)

export const useWalletConnectContext = () => useContext(WalletConnectContext)

export type WalletConnectContextProviderProps = {
    children: ReactChild
}

export const Web3ContextProvider = ({ children }: WalletConnectContextProviderProps) => {
    const wcState = useWalletConnect()

    return (
        <WalletConnectContext.Provider value= { wcState } >
        { children }
        < /WalletConnectContext.Provider>
    )
  }