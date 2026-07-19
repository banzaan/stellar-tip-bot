import { TransactionBuilder, rpc, Keypair, Contract, Address, nativeToScVal, Horizon } from '@stellar/stellar-sdk';

const sorobanRpc = new rpc.Server('https://soroban-testnet.stellar.org');
const networkPassphrase = 'Test SDF Network ; September 2015';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { tgData, xdr, action, userAddress } = req.body;
  const botSecret = process.env.BOT_OPERATOR_SECRET;
  const botKeyPair = Keypair.fromSecret(botSecret);
  const registryContractId = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID;

  try {
    // 1. action
    if (action === 'PREPARE') {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(userAddress);
      
      const registryContract = new Contract(registryContractId);
      const tx = new TransactionBuilder(account, { fee: '150000', networkPassphrase })
        .addOperation(registryContract.call('link_address', 
          Address.fromString(botKeyPair.publicKey()).toScVal(),
          nativeToScVal(tgData.username, { type: 'string' }),
          Address.fromString(userAddress).toScVal()
        ))
        .setTimeout(30)
        .build();

      const preparedTx = await sorobanRpc.prepareTransaction(tx);
      return res.status(200).json({ xdr: preparedTx.toXDR() });
    } 
    
else if (action === 'FINALIZE') {
  if (!xdr) return res.status(400).json({ error: "XDR is missing" });

  try {
    const tx = TransactionBuilder.fromXDR(xdr, process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015");

    if (!tx.signatures || tx.signatures.length === 0) {
        throw new Error("Transaction has no signatures");
    }

    const sendTxResult = await sorobanRpc.sendTransaction(tx);
    
    return res.status(200).json({ success: true, hash: sendTxResult.hash });

  } catch (e) {
    console.error("Critical Failure in Finalize:", e);
    return res.status(500).json({ error: e.message });
  }
}
// ... sendTransaction
  const sendTxResult = await sorobanRpc.sendTransaction(tx);
  
  if (sendTxResult.status === 'PENDING') {
      // 
      let transactionStatus;
      let retries = 0;
      
      while (retries < 5) {
          transactionStatus = await sorobanRpc.getTransaction(sendTxResult.hash);
          if (transactionStatus.status === 'SUCCESS') {
              return res.status(200).json({ success: true, hash: sendTxResult.hash });
          }
          await new Promise(r => setTimeout(r, 2000)); // 
          retries++;
      }
      return res.status(202).json({ success: true, hash: sendTxResult.hash, status: 'Processing' });
  }

    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error("🚨 Full Error Detail:", error);
    try {
      const sendTxResult = await sorobanRpc.sendTransaction(tx);
      console.log("Full Result:", JSON.stringify(sendTxResult, null, 2)); 
      
      if (sendTxResult.status === 'ERROR') {
          console.log("Error Detail:", sendTxResult.errorResult); 
      }
    } catch (e) {
      console.log("Network/RPC Error:", e);
    }
    return res.status(500).json({ error: error.message });
  }
}