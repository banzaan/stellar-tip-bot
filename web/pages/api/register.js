import { TransactionBuilder, rpc, Keypair, Contract, Address, nativeToScVal, Horizon } from '@stellar/stellar-sdk';
import crypto from 'crypto';

const sorobanRpc = new rpc.Server('https://soroban-testnet.stellar.org');
const networkPassphrase = 'Test SDF Network ; September 2015';


function verifyTelegramAuth(tgData, botToken) {
  if (!tgData || !tgData.hash) return false;

  const { hash, ...dataToCheck } = tgData;
  

  const checkString = Object.keys(dataToCheck)
    .sort()
    .map(key => `${key}=${dataToCheck[key]}`)
    .join('\n');


  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return hmac === hash;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { tgData, xdr, action, userAddress } = req.body;
  const botSecret = process.env.BOT_OPERATOR_SECRET;
  const botToken = process.env.TELEGRAM_BOT_TOKEN; 
  const registryContractId = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID;

  if (!botSecret || !botToken || !registryContractId) {
    return res.status(500).json({ error: 'Server environment variables are missing.' });
  }

  try {
    const botKeyPair = Keypair.fromSecret(botSecret);

    if (action === 'PREPARE') {
      if (!tgData || !userAddress) {
        return res.status(400).json({ error: 'Telegram data or user address is missing.' });
      }


      const isValidTelegram = verifyTelegramAuth(tgData, botToken);
      if (!isValidTelegram) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Telegram signature! Security check failed.' });
      }

      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(userAddress);
      
      const registryContract = new Contract(registryContractId);
      const tx = new TransactionBuilder(account, { fee: '150000', networkPassphrase })
        .addOperation(registryContract.call('link_address', 
          Address.fromString(botKeyPair.publicKey()).toScVal(),
          nativeToScVal(tgData.username || tgData.first_name, { type: 'string' }),
          Address.fromString(userAddress).toScVal()
        ))
        .setTimeout(30)
        .build();

      const preparedTx = await sorobanRpc.prepareTransaction(tx);
      return res.status(200).json({ xdr: preparedTx.toXDR() });
    } 
    
    else if (action === 'FINALIZE') {
      if (!xdr) return res.status(400).json({ error: "XDR is missing" });

      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);

      if (!tx.signatures || tx.signatures.length === 0) {
        throw new Error("Transaction has no signatures");
      }

      const sendTxResult = await sorobanRpc.sendTransaction(tx);
      

      if (sendTxResult.status === 'PENDING') {
        let retries = 0;
        while (retries < 5) {
          const transactionStatus = await sorobanRpc.getTransaction(sendTxResult.hash);
          if (transactionStatus.status === 'SUCCESS') {
            return res.status(200).json({ success: true, hash: sendTxResult.hash });
          } else if (transactionStatus.status === 'FAILED') {
            throw new Error("Soroban transaction execution failed on-chain.");
          }
          await new Promise(r => setTimeout(r, 2000));
          retries++;
        }
        return res.status(202).json({ success: true, hash: sendTxResult.hash, status: 'Processing' });
      } 
      
      if (sendTxResult.status === 'ERROR') {
        throw new Error(`Transaction error: ${JSON.stringify(sendTxResult.errorResult)}`);
      }

      return res.status(200).json({ success: true, hash: sendTxResult.hash });
    } 
    
    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error("🚨 Full Error Detail:", error);
    return res.status(500).json({ error: error.message });
  }
}