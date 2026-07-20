// web/pages/index.js
import { useState, useEffect, useRef } from 'react';
import { Contract, TransactionBuilder, rpc, nativeToScVal, Horizon, Address } from '@stellar/stellar-sdk';

// Import our secure client-side helper functions
import { checkConnection, retrievePublicKey, userSignTransaction } from '../components/Freighter';

export default function Home() {
  const [tgUser, setTgUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0); 
  const [allowancePercent, setAllowancePercent] = useState(50); 
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); 
  const telegramBtnRef = useRef(null);

  const sorobanRpc = new rpc.Server('https://soroban-testnet.stellar.org');
  const networkPassphrase = 'Test SDF Network ; September 2015';

  useEffect(() => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YourAwesomeTipBot";
    
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    
    window.onTelegramAuth = (user) => {
      setTgUser(user);
      updateStatus('✅ Telegram authentication successful!', 'success');
    };
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    if (telegramBtnRef.current) {
      telegramBtnRef.current.innerHTML = ''; 
      telegramBtnRef.current.appendChild(script);
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
      const allowed = await checkConnection();
      if (!allowed) {
        updateStatus("❌ Permission denied by Freighter wallet.", "error");
        return;
      }

      const key = await retrievePublicKey();
      if (key) {
        setWalletAddress(key);
        updateStatus('✅ Freighter wallet connected successfully.', 'success');
        await fetchWalletBalance(key); 
      } else {
        updateStatus('❌ Connection requested, but no wallet address was returned.', 'error');
      }
    } catch (err) {
      updateStatus(`Wallet connection error: ${err.message}`, 'error');
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
      updateStatus('🔑 Please sign the Approve transaction in Freighter...', 'info');

      const signedResult = await userSignTransaction(preparedTx.toXDR());

      let signedXdrString = '';
      if (signedResult && typeof signedResult === 'object' && signedResult.signedTxXdr) {
        signedXdrString = signedResult.signedTxXdr; 
      } else if (typeof signedResult === 'string') {
        signedXdrString = signedResult; 
      } else {
        throw new Error("Invalid signature format returned from Freighter wallet.");
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
  try {
    const prepRes = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'PREPARE', tgData: tgUser, userAddress: walletAddress })
    });
    const { xdr } = await prepRes.json();
    
    if (!xdr) throw new Error("Failed to receive XDR from server");

    updateStatus('🔑 Please sign in Freighter...', 'info');
    const signedResult = await userSignTransaction(xdr);
    const signedXdr = typeof signedResult === 'object' ? signedResult.signedTxXdr : signedResult;

    const finalRes = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'FINALIZE', xdr: signedXdr }) 
    });
    
    const resData = await finalRes.json();
    if (resData.success) {
      updateStatus(`🎉 Linked! `, 'success');
    } else {
      throw new Error(resData.error || "Submission failed");
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
          <p className="text-sm text-slate-400">Link your Telegram ID and grant instant tipping access.</p>
        </div>

        <hr className="border-slate-700" />

        <div className="space-y-3">
          <h3 className="text-md font-medium text-slate-200">Step 1: Telegram Verification</h3>
          {tgUser ? (
            <div className="bg-sky-950/50 border border-sky-500/30 text-sky-300 p-3 rounded-xl flex items-center justify-between">
              <span>Logged in as: <strong className="font-semibold">@{tgUser.username}</strong></span>
              <span className="text-emerald-400 font-bold">✓</span>
            </div>
          ) : (
            <div className="flex justify-center p-2 bg-slate-750 rounded-xl" ref={telegramBtnRef}></div>
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
            {walletAddress ? 'Wallet Connected ✓' : 'Connect Freighter'}
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
