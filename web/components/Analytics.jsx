import { useState, useEffect } from 'react';

export default function Analytics() {
  const [metrics, setMetrics] = useState({
    walletsCount: 0,
    transactionsCount: 0,
    totalAllowance: '0',
    totalVolume: '0'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch('/api/analytics');
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API did not return JSON. Check API path or server logs.");
        }

        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, 6000000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section feature" id="feature">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="section-title">
              <h2>Analytics</h2>
              <p>Realtime overview of protocol metrics and platform activity</p>
            </div>
          </div>
        </div>
        <div className="row bg-elipse align-items-center" style={{ position: 'relative' }}>
          
          <div className="col-lg-4 text-center text-lg-right">
            <div className="feature-item">
              <div className="icon">
                <i className="ti-id-badge"></i>
              </div>
              <div className="content">
                <h5>total wallets connected</h5>
                <p>{loading ? 'Loading...' : `${metrics.walletsCount} Wallets Linked`}</p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="feature-item mb-4">
              <div className="icon">
                <i className="ti-receipt"></i>
              </div>
              <div className="content">
                <h5>Transactions</h5>
                <p>{loading ? 'Loading...' : `${metrics.totalTransactions} Total TXs`}</p>
              </div>
            </div>
            
            <div className="app-screen" style={{ margin: '20px 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <img className="img-fluid" src="images/phones/i-phone-screen.png" alt="app-screen" style={{ maxWidth: '240px' }} />
            </div>

            <div className="feature-item mt-4">
              <div className="icon">
                <i className="ti-check-box"></i>
              </div>
              <div className="content">
                <h5>Total Allowance</h5>
                <p>{loading ? 'Loading...' : `${metrics.totalAllowance} XLM`}</p>
              </div>
            </div>
          </div>

          <div className="col-lg-4 text-center text-lg-left align-self-center">
            <div className="feature-item">
              <div className="icon">
                <i className="ti-stats-up"></i>
              </div>
              <div className="content">
                <h5>total volume</h5>
                <p>{loading ? 'Loading...' : `${metrics.totalVolume} XLM`}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}