import React, { createContext, ReactChild, useCallback, useContext, useReducer, useEffect } from "react";
import { getAppControllers } from "../controllers";
import { getAppConfig } from "../config";

import { DEFAULT_CHAIN_ID, DEFAULT_ACTIVE_INDEX } from "../constants/default";
import WalletConnect from "@walletconnect/client";
import { getCachedSession } from "src/helpers/utilities";
import { IClientMeta } from "@walletconnect/types";

export interface WCState {
    connect: ((uri: string) => Promise<void>) | null;
    approveSession: (() => void) | null;
    rejectSession: (() => void) | null;
    killSession: (() => void) | null;
    updateSession: ((chainId?: number, activeIndex?: number) => void) | null;
    openRequest: ((request: any) => void) | null;
    closeRequest: (() => void) | null;
    approveRequest: (() => void) | null;
    rejectRequest: (() => void) | null;

    loading: boolean;
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
    approveSession: null,
    rejectSession: null,
    killSession: null,
    updateSession: null,
    openRequest: null,
    closeRequest: null,
    approveRequest: null,
    rejectRequest: null,

    loading: false,
    connector: null,
    uri: "",
    peerMeta: null,
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
        chainId?: number,
        activeIndex?: number
    }
    | {
        type: 'setUri',
        uri: string
    }
    | {
        type: 'openRequest'
        payload: any
    }
    | {
        type: 'closeRequest'
    }
    | {
        type: 'removeRequest'
    }
    | {
        type: 'sessionRequest',
        peerMeta: any
    }
    | {
        type: 'reset'
    }
    | {
        type: 'connected',
        connector: WalletConnect
    }
    | {
        type: 'callRequest',
        payload: any
    }

const wcReducer = (state: WCState, action: WCAction): WCState => {
    switch(action.type) {
        case 'reset':
            return INITIAL_STATE

        case 'sessionRequest':
            return {
                ...state,
                peerMeta: action.peerMeta
            }

        case 'connected':
            return {
                ...state,
                connected: true,
                connector: action.connector,
                peerMeta: action.connector.peerMeta,
            }

        case 'updateSession':
            return {
                ...state,
                chainId: action.chainId || state.chainId,
                activeIndex: action.activeIndex || state.activeIndex,
                address: state.accounts[action.activeIndex || state.activeIndex]
            }

        case 'connect':
            return {
                ...state,
                uri: action.connector.uri,
                connector: action.connector,
                connected: false,
                peerMeta: action.connector.peerMeta,
            }

        case 'openRequest':
            return {
                ...state,
                payload: action.payload
            }

        case 'removeRequest':
            const { requests, payload } = state;
            const filteredRequests = requests.filter(request => request.id !== payload.id);
            return {
                ...state,
                requests: filteredRequests,
                payload: null
            }

        case 'closeRequest':
            return {
                ...state,
                payload: null
            }

        case 'callRequest':
            state.requests.push(action.payload)
            return {
                ...state,
                requests: state.requests
            }

        default:
            throw new Error('unhandled type in reducer ' + action.type)
    }
}

  const useWalletConnect = (): WCState => {
    const [state, dispatch] = useReducer(wcReducer, INITIAL_STATE)
    const { connector, activeIndex, chainId, address, payload, accounts } = state

    function subscribeToEvents(c: WalletConnect) {
        if (c) {
            console.log("ACTION", "subscribeToEvents");
            const handleSessionRequest = (error: any, payload: any) => {
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
            c.on("session_request", handleSessionRequest);

            const handleSessionUpdate = (error: any) => {
                console.log("EVENT", "session_update");

                if (error) {
                    throw error;
                }
            }

            c.on("session_update", handleSessionUpdate);

            const handleCallRequest = async (error: any, payload: any) => {
                // tslint:disable-next-line
                console.log("EVENT", "call_request", "method", payload.method);
                console.log("EVENT", "call_request", "params", payload.params);

                if (error) {
                    throw error;
                }

                dispatch({
                    type: 'callRequest',
                    payload,
                })

                // await getAppConfig().rpcEngine.router(payload, state, bindedSetState);
            }
            c.on("call_request", handleCallRequest);

            const handleConnect = (error: any, payload: any) => {
                console.log("EVENT", "connect");

                if (error) {
                    throw error;
                }

                dispatch({
                    type: 'connected',
                    connector: c
                })
            }
            c.on("connect", handleConnect);

            const handleDisconnect = (error: any, payload: any) => {
                console.log("EVENT", "disconnect");

                if (error) {
                    throw error;
                }

                dispatch({
                    type: 'reset'
                })
            }
            c.on("disconnect", handleDisconnect);

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

            // return () => {
            //     connector.off("session_request")
            //     connector.off("session_update")
            //     connector.off("call_request")
            //     connector.off("connect")
            //     connector.off("disconnect")
            // }
        }
    }

    useEffect(() => {
        // re-establsh session if there is an existing one
        const session = getCachedSession();

        if (!session) {
            // TODO replace with API call to get wallets
            getAppControllers().wallet.init(activeIndex, chainId);
        } else if(!connector) {
            const connector = new WalletConnect({ session });
            subscribeToEvents(connector)

            const { accounts } = connector;

            const address = accounts[0];

            const activeIndex = accounts.indexOf(address);
            const chainId = connector.chainId;

            dispatch({
                type: 'connected',
                connector
            })

            getAppControllers().wallet.init(activeIndex, chainId);
        }
    }, [connector])

    const connect = useCallback(async (uri: string) => {
        console.log("ACTION", "connect", uri);

        try {
          const connector = new WalletConnect({ uri });
          subscribeToEvents(connector)
    
          if (!connector.connected) {
            await connector.createSession();
          }

          dispatch({
            type: 'connect',
            connector
          })
        } catch (error) {
    
          throw error;
        }
    }, [])

    const approveSession = useCallback(() => {
        console.log("ACTION", "approveSession");
        if (connector) {
          connector.approveSession({ chainId, accounts: [address] });
        }
    }, [connector, chainId, address]);

    const rejectSession = useCallback(() => {
        console.log("ACTION", "rejectSession");
        if (connector) {
          connector.rejectSession();
          dispatch({
            type: 'rejectSession'
          })
        }
    }, [connector]);

    const killSession = useCallback(() => {
        console.log("ACTION", "killSession");
        if (connector) {
          connector.killSession();
        }
    }, [connector]);

    const updateSession = useCallback((chainId?: number, activeIndex?: number ) => {
        const newChainId = chainId || state.chainId
        const newActiveIndex = activeIndex || state.activeIndex
        const address = accounts[newActiveIndex]

        if(connector) {
            connector.updateSession({
                chainId: newChainId,
                accounts: [address]
            })
        }

        getAppControllers().wallet.update(newActiveIndex, newChainId)

        dispatch({
            type: 'updateSession',
            chainId,
            activeIndex
        })

    }, [connector])

    const openRequest = async (request: any) => {
        const payload = Object.assign({}, request);
        console.log("ACTION", "openRequest", payload)

        const params = payload.params[0];
        if (request.method === "eth_sendTransaction") {
            payload.params[0] = await getAppControllers().wallet.populateTransaction(params);
        }

        dispatch({
            type: 'openRequest',
            payload
        })
    };

    const closeRequest = useCallback(() => {
        dispatch({
            type: 'closeRequest'
        })
    }, []);

    const rejectRequest = useCallback(() => {
        if (connector) {
            connector.rejectRequest({
              id: payload.id,
              error: { message: "Failed or Rejected Request" },
            });
          }

          dispatch({
            type: 'removeRequest'
          })

    }, [connector, payload])

    const approveRequest = useCallback(() => {
        if (connector) {
            connector.approveRequest({
              id: payload.id,
            });
          }

          dispatch({
            type: 'removeRequest'
          })
    }, [connector, payload])
    
    // useEffect(() => {
    //     // setup event listeners when there is a wallet connect session
    //     // subscribeToEvents(connector)

    //     //  else {
    //     //     // return () => null
    //     // }
    // }, [connector, connected])

    return {
        ...state,
        connect,
        approveSession,
        rejectSession,
        killSession,
        updateSession,
        openRequest,
        closeRequest,
        rejectRequest,
        approveRequest
    }
}

const WalletConnectContext = createContext(INITIAL_STATE)

export const useWalletConnectContext = () => useContext(WalletConnectContext)

export interface WalletConnectContextProviderProps {
    children: ReactChild
}

export const Web3ContextProvider = ({ children }: WalletConnectContextProviderProps) => {
    const wcState = useWalletConnect()

    return (
        <WalletConnectContext.Provider value= { wcState } >
        { children }
        </WalletConnectContext.Provider>
    )
  }