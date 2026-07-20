import 'dotenv/config';
import { Bot } from 'grammy';
import { Horizon, TransactionBuilder, Contract, rpc, scValToNative, nativeToScVal, Keypair, Address } from '@stellar/stellar-sdk';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const server = new Horizon.Server("https://horizon-testnet.stellar.org");
const sorobanRpc = new rpc.Server('https://soroban-testnet.stellar.org');
const networkPassphrase = 'Test SDF Network ; September 2015';
const botKeyPair = Keypair.fromSecret(process.env.BOT_OPERATOR_SECRET);

async function getWalletByUsername(username) {
  try {
    const registryContract = new Contract(process.env.REGISTRY_CONTRACT_ID);
    const formattedUsername = username.toLowerCase().replace('@', '').trim();
    
    let account = await server.loadAccount(botKeyPair.publicKey());
    const tx = new TransactionBuilder(account, { fee: '10000', networkPassphrase })
      .addOperation(registryContract.call('get_address', nativeToScVal(formattedUsername, { type: 'string' })))
      .setTimeout(30)
      .build();

    const result = await sorobanRpc.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result?.retval) {
      return scValToNative(result.result.retval);
    }
    return null;
  } catch (err) {
    console.error(`❌ Error fetching wallet:`, err);
    return null;
  }
}

bot.command('tip', async (ctx) => {
  let targetUsername = null;
  let amount = 0;

  if (ctx.message.reply_to_message) {
    targetUsername = ctx.message.reply_to_message.from?.username;
    
    const parts = ctx.message.text.split(/\s+/);
    amount = parseFloat(parts[1]); 
  } else {
  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 3) return ctx.reply('❌ Format: /tip amount');
  const targetUsername = parts[1].replace('@', '').trim();
  const amount = parseFloat(parts[2]);
  if (isNaN(amount) || amount <= 0) return ctx.reply('❌ Invalid amount.');
  }

  if (!targetUsername) return ctx.reply('❌ Could not find the username to tip.');
  if (isNaN(amount) || amount <= 0) return ctx.reply('❌ Invalid amount.');
  try {
    const senderWallet = await getWalletByUsername(ctx.from.username);
    const targetWallet = await getWalletByUsername(targetUsername);
    if (!senderWallet || !targetWallet) return ctx.reply('❌ User not registered.');

    const processorContract = new Contract(process.env.PROCESSOR_CONTRACT_ID);
    const botAccount = await server.loadAccount(botKeyPair.publicKey());
    const tipAmount = BigInt(Math.floor(amount * 10000000));

    const tx = new TransactionBuilder(botAccount, { fee: '30000', networkPassphrase })
      .addOperation(processorContract.call(
        'process_tip',
        Address.fromString(process.env.REGISTRY_CONTRACT_ID).toScVal(),
        Address.fromString(process.env.TOKEN_CONTRACT_ID).toScVal(),
        Address.fromString(botKeyPair.publicKey()).toScVal(),
        Address.fromString(process.env.FEE_RECEIVER_ADDRESS || botKeyPair.publicKey()).toScVal(),
        nativeToScVal(ctx.from.username, { type: 'string' }),
        nativeToScVal(targetUsername, { type: 'string' }),
        nativeToScVal(tipAmount, { type: 'i128' })
      ))
      .setTimeout(30)
      .build();

    const preparedTx = await sorobanRpc.prepareTransaction(tx);
    preparedTx.sign(botKeyPair);
    const simulation = await sorobanRpc.simulateTransaction(preparedTx);
    console.log("SIMULATION RESULT:", JSON.stringify(simulation, null, 2));

if (simulation.result?.auth) {
    console.log("REQUIRED AUTH ENTRIES:", JSON.stringify(simulation.result.auth, null, 2));
}
    const sendTxResult = await sorobanRpc.sendTransaction(preparedTx);
   
    if (sendTxResult.status !== 'ERROR') {
      ctx.reply(`🎉 Tip Successful! Tx: ${sendTxResult.hash}`);
    } else {
      ctx.reply(`❌ Blockchain Error.`);
    }
  } catch (error) {
    ctx.reply(`❌ Error:you shout approve limit before tiping`);
  }
});

bot.start();
console.log('🚀 Stellar Tip Bot is running...');
