// web/pages/index.js
import { useState, useEffect } from 'react';
import { Contract, TransactionBuilder, rpc, nativeToScVal, Horizon, Address } from '@stellar/stellar-sdk';
import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit';

export default function Home() {
  const [tgUser, setTgUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0); 
  const [allowancePercent, setAllowancePercent] = useState(50); 
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); 
  const [telegramLoginUrl, setTelegramLoginUrl] = useState('#');

  const sorobanRpc = new rpc.Server('https://soroban-testnet.stellar.org');
  const networkPassphrase = 'Test SDF Network ; September 2015';

  const [kit] = useState(() => new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules(),
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    const first_name = queryParams.get('first_name');
    const username = queryParams.get('username');
    const auth_date = queryParams.get('auth_date');
    const hash = queryParams.get('hash');

    if (id && hash) {
      const userObj = { id, first_name, username, auth_date, hash };
      setTgUser(userObj);
      updateStatus('✅ Telegram authentication verified on client!', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "";
    if (botId) {
      const originUrl = window.location.origin;
      const currentUrl = window.location.href.split('?')[0];
      setTelegramLoginUrl(
        `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(originUrl)}&return_to=${encodeURIComponent(currentUrl)}`
      );
    }
  }, []);

  const updateStatus = (message, type = 'info') => {
    setStatus(message);
    setStatusType(type);
  };

  const fetchWalletBalance = async (pubKey) => {
    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const accountInfo = await server.loadAccount(pubKey);
      const nativeBalance = accountInfo.balances.find(b => b.asset_type === 'native');
      if (nativeBalance) {
        setBalance(parseFloat(nativeBalance.balance));
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const connectWallet = async () => {
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id);
            const publicKey = await kit.getPublicKey();
            setWalletAddress(publicKey);
            updateStatus(`✅ Connected to ${option.name} successfully.`, 'success');
            await fetchWalletBalance(publicKey);
          } catch (err) {
            updateStatus(`❌ Failed to connect to ${option.name}: ${err.message}`, 'error');
          }
        }
      });
    } catch (err) {
      updateStatus(`Wallet selection error: ${err.message}`, 'error');
    }
  };

  const handleApprove = async () => {
    if (!walletAddress) return updateStatus('❌ Please connect your wallet first.', 'error');
    
    const calculatedAmount = ((balance * allowancePercent) / 100).toFixed(4);
    if (parseFloat(calculatedAmount) <= 0) {
      return updateStatus('❌ Calculated allowance amount must be greater than 0 XLM.', 'error');
    }

    setApproveLoading(true);
    updateStatus(`⏳ Preparing approval for ${calculatedAmount} XLM...`, 'info');

    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(walletAddress);
      
      const tokenContractId = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID; 
      const processContractId = process.env.NEXT_PUBLIC_PROCESS_CONTRACT_ID; 

      if (!processContractId) {
        throw new Error("NEXT_PUBLIC_PROCESS_CONTRACT_ID is not configured.");
      }

      const tokenContract = new Contract(tokenContractId);
      const amountRaw = BigInt(Math.floor(parseFloat(calculatedAmount) * 10000000));
      
      updateStatus('⏳ Querying latest network ledger...', 'info');
      const latestLedgerResponse = await sorobanRpc.getLatestLedger();
      const currentLedger = latestLedgerResponse.sequence;
      const expirationLedger = currentLedger + 311040;

      const tx = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: networkPassphrase
      })
      .addOperation(
        tokenContract.call(
          'approve',
          Address.fromString(walletAddress).toScVal(), 
          Address.fromString(processContractId).toScVal(), 
          nativeToScVal(amountRaw, { type: 'i128' }), 
          nativeToScVal(expirationLedger, { type: 'u32' }) 
        )
      )
      .setTimeout(30)
      .build();

      const preparedTx = await sorobanRpc.prepareTransaction(tx);
      updateStatus('🔑 Please sign the Approve transaction in your wallet...', 'info');

      const signedResult = await kit.signTransaction(preparedTx.toXDR(), {
        networkPassphrase: networkPassphrase
      });

      let signedXdrString = '';
      if (typeof signedResult === 'object' && signedResult.signedTxXdr) {
        signedXdrString = signedResult.signedTxXdr; 
      } else if (typeof signedResult === 'string') {
        signedXdrString = signedResult; 
      } else {
        throw new Error("Invalid signature format returned from wallet.");
      }

      updateStatus('🚀 Submitting Approve transaction to Soroban...', 'info');

      const transactionToSubmit = TransactionBuilder.fromXDR(signedXdrString, networkPassphrase);
      const sendTxResult = await sorobanRpc.sendTransaction(transactionToSubmit);

      if (sendTxResult.status === 'PENDING' || sendTxResult.status === 'SUCCESS') {
        updateStatus(`🎉 Success! Process Contract is now authorized to spend up to ${calculatedAmount} XLM for 18 days`, 'success');
      } else {
        updateStatus(`❌ Approve transaction rejected: ${sendTxResult.status}`, 'error');
      }

    } catch (error) {
      console.error(error);
      updateStatus(`❌ Approve failed: ${error.message}`, 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!walletAddress || !tgUser) return updateStatus('❌ Connect wallet & Telegram first.', 'error');

    setLoading(true);
    updateStatus('⏳ Preparing contract link transaction...', 'info');

    try {
      const prepRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PREPARE', tgData: tgUser, userAddress: walletAddress })
      });
      
      const resJson = await prepRes.json();
      if (!prepRes.ok) {
        throw new Error(resJson.error || "Failed to prepare transaction on server");
      }

      const { xdr } = resJson;
      if (!xdr) throw new Error("Failed to receive XDR from server");

      updateStatus('🔑 Please sign the Link transaction in your wallet...', 'info');
      
      const signedResult = await kit.signTransaction(xdr, {
        networkPassphrase: networkPassphrase
      });
      const signedXdr = typeof signedResult === 'object' && signedResult.signedTxXdr ? signedResult.signedTxXdr : signedResult;

      updateStatus('🚀 Finalizing and submitting to Soroban...', 'info');
      const finalRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FINALIZE', xdr: signedXdr }) 
      });
      
      const resData = await finalRes.json();
      if (!finalRes.ok) {
        throw new Error(resData.error || "Submission failed");
      }

      if (resData.success) {
        updateStatus(`🎉 Successfully linked Telegram @${tgUser.username || tgUser.first_name} to your Stellar wallet!`, 'success');
      } else {
        throw new Error("Link transaction failed on-chain.");
      }
    } catch (error) {
      updateStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4" dir="ltr">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-sky-400">Stellar Wallet Linking Portal 🌐</h1>
          <p className="text-sm text-slate-400">Link your Telegram ID and grant instant tipping access securely.</p>
        </div>

        <hr className="border-slate-700" />

        <div className="space-y-3">
          <h3 className="text-md font-medium text-slate-200">Step 1: Telegram Verification</h3>
          {tgUser ? (
            <div className="bg-sky-950/50 border border-sky-500/30 text-sky-300 p-3 rounded-xl flex items-center justify-between">
              <span>Logged in as: <strong className="font-semibold">@{tgUser.username || tgUser.first_name}</strong></span>
              <span className="text-emerald-400 font-bold">✓ Verified</span>
            </div>
          ) : (
            <a 
              href={telegramLoginUrl}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-center shadow-md"
            >
              <span>Login with Telegram 🚀</span>
            </a>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-md font-medium text-slate-200">Step 2: Connect Wallet</h3>
          <button 
            onClick={connectWallet} 
            className={`w-full py-2.5 px-4 font-semibold rounded-xl transition duration-200 text-center ${
              walletAddress 
                ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 cursor-default' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {walletAddress ? 'Wallet Connected ✓' : 'Connect a Wallet'}
          </button>
          {walletAddress && (
            <div className="space-y-1">
              <p className="text-xs text-emerald-400 break-all bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20 font-mono text-center">
                {walletAddress}
              </p>
              <p className="text-xs text-slate-400 text-center">
                Balance: <strong className="text-slate-200">{balance.toFixed(2)} XLM</strong>
              </p>
            </div>
          )}
        </div>

        {walletAddress && (
          <div className="space-y-3 bg-slate-850 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-md font-medium text-slate-200">Step 3: Setup Chat Tipping Limit</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Selected: {allowancePercent}%</span>
                <span>Max Safe: 90%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="90" 
                value={allowancePercent} 
                onChange={(e) => setAllowancePercent(parseInt(e.target.value))}
                className="w-full accent-sky-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm font-semibold text-sky-300">
                Limit: {((balance * allowancePercent) / 100).toFixed(2)} XLM
              </div>
            </div>

            <button 
              onClick={handleApprove}
              disabled={approveLoading || allowancePercent === 0}
              className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition duration-250 ${
                approveLoading || allowancePercent === 0
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              }`}
            >
              {approveLoading ? 'Processing Allowance...' : `Approve Limit (${allowancePercent}%)`}
            </button>
          </div>
        )}

        <hr className="border-slate-700" />

        <button 
          onClick={handleMerge} 
          disabled={loading || !walletAddress || !tgUser} 
          className={`w-full py-4 px-4 font-bold rounded-xl text-lg transition duration-200 ${
            loading || !walletAddress || !tgUser
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {loading ? 'Processing Sync...' : 'Merge Telegram ID & Wallet'}
        </button>

        {status && (
          <div className={`p-4 rounded-xl text-sm whitespace-pre-line border transition-all ${
            statusType === 'success' 
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' 
              : statusType === 'error' 
              ? 'bg-rose-950/50 border-rose-500/30 text-rose-300' 
              : 'bg-slate-700/50 border-slate-600 text-slate-300'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
