// components/TippingPortal.jsx
import { useState, useEffect, useRef } from 'react';
import { Contract, TransactionBuilder, rpc, nativeToScVal, Horizon, Address } from '@stellar/stellar-sdk';
import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit';

export default function TippingPortal() {
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
  
  const [kit] = useState(() => new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules(),
  }));

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
      updateStatus('Telegram authentication successful!', 'success');
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
    
    setTimeout(() => {
      setStatus('');
    }, 6000);
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
            let publicKey = await kit.getAddress();
            publicKey = typeof publicKey === 'object' && publicKey !== null ? publicKey.address : publicKey;
            setWalletAddress(publicKey);
            updateStatus(`Connected to ${option.name} successfully.`, 'success');
            await fetchWalletBalance(publicKey);
          } catch (err) {
            updateStatus(`Failed to connect to ${option.name}: ${err.message}`, 'error');
          }
        }
      });
    } catch (err) {
      updateStatus(`Wallet selection error: ${err.message}`, 'error');
    }
  };

  // تابع یکپارچه و هوشمند امضا با کیت استلار (بدون وابستگی به فریتر)
  const signTransactionWithKit = async (xdr) => {
    try {
      const signed = await kit.signTransaction(xdr, {
        networkPassphrase: networkPassphrase
      });
      return typeof signed === 'object' && signed?.signedTxXdr ? signed.signedTxXdr : signed;
    } catch (err) {
      console.error("Wallet signing error:", err);
      throw err;
    }
  };

  const handleApprove = async () => {
    if (!walletAddress) return updateStatus('Please connect your wallet first.', 'error');
    const calculatedAmount = ((balance * allowancePercent) / 100).toFixed(4);
    if (parseFloat(calculatedAmount) <= 0) {
      return updateStatus('Calculated allowance amount must be greater than 0 XLM.', 'error');
    }

    setApproveLoading(true);
    updateStatus(`Preparing approval for ${calculatedAmount} XLM...`, 'info');

    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(walletAddress);
      const tokenContractId = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID; 
      const processContractId = process.env.NEXT_PUBLIC_PROCESS_CONTRACT_ID; 

      if (!processContractId) throw new Error("NEXT_PUBLIC_PROCESS_CONTRACT_ID is not configured.");

      const tokenContract = new Contract(tokenContractId);
      const amountRaw = BigInt(Math.floor(parseFloat(calculatedAmount) * 10000000));
      
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
      
      // استفاده از کیت استلار به جای تابع فریتر
      const signedXdrString = await signTransactionWithKit(preparedTx.toXDR());

      const transactionToSubmit = TransactionBuilder.fromXDR(signedXdrString, networkPassphrase);
      const sendTxResult = await sorobanRpc.sendTransaction(transactionToSubmit);

      if (sendTxResult.status === 'PENDING' || sendTxResult.status === 'SUCCESS') {
        updateStatus(`Success! Authorized up to ${calculatedAmount} XLM`, 'success');
      } else {
        updateStatus(`Approve transaction rejected: ${sendTxResult.status}`, 'error');
      }
    } catch (error) {
      updateStatus(`Approve failed: ${error.message}`, 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!walletAddress || !tgUser) return updateStatus('Connect wallet & Telegram first.', 'error');
    setLoading(true);
    try {
      const prepRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PREPARE', tgData: tgUser, userAddress: walletAddress })
      });
      const { xdr } = await prepRes.json();
      if (!xdr) throw new Error("Failed to receive XDR from server");

      // استفاده از کیت استلار برای امضا
      const signedXdr = await signTransactionWithKit(xdr);

      const finalRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FINALIZE', xdr: signedXdr }) 
      });
      
      const resData = await finalRes.json();
      if (resData.success) {
        updateStatus(`Linked Successfully!`, 'success');
      } else {
        throw new Error(resData.error || "Submission failed");
      }
    } catch (error) {
      updateStatus(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="about section bg-2" id="about" style={{ position: 'relative' }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 align-self-center text-center">
            <div className="image-block">
              <img className="phone-thumb-md img-fluid" src="images/phones/iphone-feature.png" alt="iphone-feature" />
            </div>
          </div>
          <div className="col-lg-6 col-md-10 m-md-auto align-self-center ml-auto">
            <div className="about-block">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                
                {/* Telegram Verification */}
                <div className="about-item mb-3">
                  <div className="icon"><i className="fa-brands fa-telegram" style={{ color: '#6f59c2' }}></i></div>
                  <div className="content w-100">
                    <h5 className="mb-2">Telegram Verification</h5>
                    <p>Verify your Telegram account securely with the bot</p>
                    {tgUser ? (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: '#fff'
                      }}>
                        <span>Logged in as: <strong style={{ fontWeight: '600' }}>@{tgUser.username}</strong></span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>✓</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }} ref={telegramBtnRef}></div>
                    )}
                  </div>
                </div>

                {/* Connect Wallet */}
                <div className="about-item active">
                  <div className="icon"><i className="fa-solid fa-network-wired"></i></div>
                  <div className="content w-100">
                    <h5 className="mb-2">Connect Wallet</h5>
                    <p>Link your Stellar wallet to start...</p>
                    <button 
                      onClick={connectWallet} 
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: walletAddress ? 'rgba(0, 0, 0, 0.25)' : '#1a1a1a',
                        color: '#fff',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)} : ${balance.toFixed(2)} XLM` : 'Connect Wallet'}
                    </button>
                  </div>
                </div>

                {/* Merge Account */}
                <div className="about-item mb-3">
                  <div className="icon"><i className="ti-vector"></i></div>
                  <div className="content w-100">
                    <h5 className="mb-2">Merge Telegram ID & Wallet</h5>
                    <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px' }}>Connect your Telegram profile to your wallet address</p>
                    <button 
                      onClick={handleMerge}
                      disabled={loading || !walletAddress || !tgUser} 
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: (loading || !walletAddress || !tgUser) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: (loading || !walletAddress || !tgUser) ? 'rgba(0,0,0,0.15)' : '#1a1a1a',
                        color: (loading || !walletAddress || !tgUser) ? 'rgba(255,255,255,0.4)' : '#fff',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      {loading ? 'Processing Sync...' : 'Merge Telegram ID & Wallet'}
                    </button>
                  </div>
                </div>

                {/* Approve Limit */}
                <div className="about-item active mb-3">
                  <div className="icon"><i className="ti-panel"></i></div>
                  <div className="content w-100">
                    <h5 className="mb-2">Approve Limit</h5>
                    {walletAddress ? (
                      <div style={{
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.8 }}>
                          <span>Selected: {allowancePercent}%</span>
                          <span>Max Safe: 90%</span>
                        </div>
                        <input 
                          type="range" min="0" max="90" value={allowancePercent} 
                          onChange={(e) => setAllowancePercent(parseInt(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer', accentColor: '#6f59c2' }}
                        />
                        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                          Limit: {((balance * allowancePercent) / 100).toFixed(2)} XLM
                        </div>
                        <button 
                          onClick={handleApprove}
                          disabled={approveLoading || allowancePercent === 0}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            fontWeight: '600',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: (approveLoading || allowancePercent === 0) ? 'not-allowed' : 'pointer',
                            backgroundColor: '#1a1a1a',
                            color: '#fff',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                          }}
                        >
                          {approveLoading ? 'Processing Allowance...' : `Approve Limit (${allowancePercent}%)`}
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', opacity: 0.7 }}>Connect wallet to set spending limit</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {status && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 9999,
          backgroundColor: '#1a1a1a',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '500',
          backdropFilter: 'blur(10px)',
          animation: 'fadeInOut 0.3s ease-in-out'
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: statusType === 'success' ? '#4ade80' : '#f87171',
            boxShadow: `0 0 10px ${statusType === 'success' ? '#4ade80' : '#f87171'}`
          }}></span>
          <span>{status}</span>
        </div>
      )}
    </section>
  );
}