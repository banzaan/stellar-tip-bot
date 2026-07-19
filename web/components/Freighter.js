// web/components/Freighter.js
import {
  signTransaction,
  setAllowed,
  getAddress,
  requestAccess,
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org",
);

export const checkConnection = async () => {
  return await setAllowed();
};

export const getRequestAccess = async () => {
  return await requestAccess();
};

export const retrievePublicKey = async () => {
  const { address } = await getAddress();
  return address;
};

export const getBalance = async () => {
  await setAllowed();
  const { address } = await getAddress();
  const account = await server.loadAccount(address);
  const xlm = account.balances.find((b) => b.asset_type === "native");
  return xlm?.balance || "0";
};

export const userSignTransaction = async (xdr) => {
  try {
    const signedTx = await signTransaction(xdr, {
      networkPassphrase: "Test SDF Network ; September 2015"
    });
    

    return typeof signedTx === 'object' && signedTx.signedTxXdr 
           ? signedTx.signedTxXdr 
           : signedTx;
           
  } catch (err) {
    console.error("Freighter signing error:", err);
    throw err;
  }
};