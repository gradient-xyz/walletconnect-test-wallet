import * as ethers from "ethers";
// import { signTypedData_v4 } from "eth-sig-util";
import {
  DEFAULT_ACTIVE_INDEX,
  DEFAULT_CHAIN_ID,
} from "../constants/default";
import { getAppConfig } from "../config";
import AWS from "aws-sdk";
import { Auth } from "aws-amplify";
import { KMSSigner } from "@rumblefishdev/eth-signer-kms";

export class WalletController {
  public path: string;
  public wallet: ethers.Signer;

  public activeIndex: number = DEFAULT_ACTIVE_INDEX;
  public activeChainId: number = DEFAULT_CHAIN_ID;

  constructor() {   
    this.path = this.getPath();
    this.wallet = this.init();
  }

  public isActive() {
    if (!this.wallet) {
      return this.wallet;
    }
    return null;
  }

  public getIndex() {
    return this.activeIndex;
  }

  public getWallet(index?: number, chainId?: number): ethers.Signer {
    if (!this.wallet || this.activeIndex === index || this.activeChainId === chainId) {
      return this.init(index, chainId);
    }
    return this.wallet;
  }

  public async getAccounts() {
    const creds = await Auth.currentUserCredentials()
    AWS.config.credentials = creds
    const kms = new AWS.KMS({ region: "us-west-2" })

    // const resp = await kmsClient.listKeys().promise()
    // console.log(resp)

    const signer = new KMSSigner(ethers.getDefaultProvider(), '8543057e-ea5c-4518-9cb6-41c6eb34abb8', kms)
    const address = await signer.getAddress()
    this.wallet = signer
    // const accounts = [];
    // let wallet = null;
    // for (let i = 0; i < count; i++) {
    //   wallet = this.generateWallet(i);
    //   accounts.push(wallet.address);
    // }
    return [address];
  }

  public getPath(index: number = this.activeIndex) {
    this.path = `${getAppConfig().derivationPath}/${index}`;
    return this.path;
  }

  public init(index = DEFAULT_ACTIVE_INDEX, chainId = DEFAULT_CHAIN_ID): ethers.Signer {
    return this.update(index, chainId);
  }

  public update(index: number, chainId: number): ethers.Signer {
    // TODO setup wallet switching
    // const firstUpdate = typeof this.wallet === "undefined";
    // this.activeIndex = index;
    // this.activeChainId = chainId;
    // const rpcUrl = getChainData(chainId).rpc_url;
    // const wallet = this.generateWallet(index);
    // const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    // this.wallet = wallet.connect(provider);
    // if (!firstUpdate) {
    //   // update another controller if necessary here
    // }
    return this.wallet;
  }

  public async populateTransaction(transaction: any) {
    let tx = Object.assign({}, transaction);
    if (this.wallet) {
      if (tx.gas) {
        tx.gasLimit = tx.gas;
        delete tx.gas;
      }
      if (tx.from) {
        tx.from = ethers.utils.getAddress(tx.from);
      }

      try {
        tx = await this.wallet.populateTransaction(tx);
        tx.gasLimit = ethers.BigNumber.from(tx.gasLimit).toHexString();
        tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toHexString();
        tx.nonce = ethers.BigNumber.from(tx.nonce).toHexString();
      } catch (err) {
        console.error("Error populating transaction", tx, err);
      }
    }

    return tx;
  }

  public async formatTransaction(transaction: any) {
    let tx = Object.assign({}, transaction);
    if (this.wallet) {
      if (tx.gas) {
        tx.gasLimit = tx.gas;
        delete tx.gas;
      }
      if (tx.from) {
        tx.from = ethers.utils.getAddress(tx.from);
      }

      try {
        tx = await this.wallet.populateTransaction(tx);
        tx.gasLimit = ethers.BigNumber.from(tx.gasLimit);
        tx.gasPrice = ethers.BigNumber.from(tx.gasPrice);
        tx.nonce = ethers.BigNumber.from(tx.nonce);
      } catch (err) {
        console.error("Error populating transaction", tx, err);
      }
    }

    return tx;
  }

  public async sendTransaction(transaction: any) {
    if (this.wallet) {
      const address = await this.wallet.getAddress()
      if (
        transaction.from &&
        transaction.from.toLowerCase() !== address.toLowerCase()
      ) {
        console.error("Transaction request From doesn't match active account");
      }

      if (transaction.from) {
        delete transaction.from;
      }

      // ethers.js expects gasLimit instead
      if ("gas" in transaction) {
        transaction.gasLimit = transaction.gas;
        delete transaction.gas;
      }

      delete transaction.gasPrice
      const txn = await this.wallet.populateTransaction(transaction)

      const result = await this.wallet.sendTransaction(txn);
      return result.hash;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signTransaction(data: any) {
    if (this.wallet) {
      if (data && data.from) {
        delete data.from;
      }
      data.gasLimit = data.gas;
      data.maxFeePerGas = 0
      delete data.gas;
      delete data.gasPrice
      const txn = await this.wallet.populateTransaction(data)
      const result = await this.wallet.signTransaction(txn);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signMessage(data: any) {
    if (this.wallet) {
      return this.wallet.signMessage(data)
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signPersonalMessage(message: any) {
    if (this.wallet) {
      const result = await this.wallet.signMessage(
        ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : message,
      );
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signTypedData(data: any) {
    if (this.wallet) {
      return this.wallet.signMessage(data)
      // const result = signTypedData_v4(Buffer.from(this.wallet.privateKey.slice(2), "hex"), {
      //   data: JSON.parse(data),
      // });
      // return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }
}

export function getWalletController() {
  return new WalletController();
}
