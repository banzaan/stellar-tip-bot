// components/Banner.jsx
export default function Banner() {
    return (
      <section className="banner bg-1" id="home">
        <div className="container">
          <div className="row">
            <div className="col-md-8 align-self-center">
              {/* Contents */}
              <div className="content-block">
                <h1>micro payment Best for business</h1> 
                <h5>Let you tip community in your journey with a simple way</h5>
                {/* App Badge */}
                <div className="app-badge">
                  <ul className="list-inline">
                    <li className="list-inline-item">
                      <a href="#" className="btn btn-download">
                        <i className="text-primary fa-brands fa-telegram"></i>
                        <div>Get it on the<span>Telegram</span></div>
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a href="#" className="btn btn-download">
                        <i className="text-primary fa-brands fa-x-twitter"></i>
                        <div>Available on the<span>x</span></div>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              {/* App Image */}
              <div className="image-block">
                <img className="img-fluid phone-thumb" src="images/phones/iphone-banner.png" alt="iphone-banner" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }