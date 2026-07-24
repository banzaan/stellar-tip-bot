// components/Footer.jsx
export default function Footer() {
    return (
      <footer className="footer-main">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mr-auto">
              <div className="footer-logo">
                <img src="images/logo.png" alt="footer-logo" />
              </div>
              <div className="copyright">
                <p>@2026 StellarTipBot All Rights Reserved  
                 <br />
                </p>
              </div>
            </div>
            <div className="col-lg-6 text-lg-right">
              {/* Social Icons */}
              <ul className="social-icons list-inline">
                <li className="list-inline-item">
                  <a target="_blank" rel="noopener noreferrer" href="https://x.com/_banzaan">
                    <i className="text-primary fa-brands fa-x-twitter"></i>
                  </a>
                </li>
                <li className="list-inline-item">
                  <a target="_blank" rel="noopener noreferrer" href="https://t.me/stellar_tip_bot">
                    <i className="text-primary fa-brands fa-telegram"></i>
                  </a>
                </li>
              </ul>
              {/* Footer Links */}
              <ul className="footer-links list-inline">
                <li className="list-inline-item">
                  <a className="scrollTo" href="#about">ACTIVATE TIPPING</a>
                </li>
                <li className="list-inline-item">
                  <a className="scrollTo" href="#team">FEEDBACK</a>
                </li>
                <li className="list-inline-item">
                  <a className="scrollTo" href="#contact">CONNECT</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    );
  }