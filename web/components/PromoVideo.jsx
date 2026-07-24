// components/PromoVideo.jsx
export default function PromoVideo() {
    return (
      <section className="section promo-video bg-3 overlay">
        <div className="container">
          <div className="row">
            <div className="col-12">
              {/* Promo Video */}
              <div className="video">
                <img className="img-fluid" src="images/backgrounds/promo-video-bg.jpg" alt="video-thumbnail" />
                <div className="video-button video-box">
                  {/* Video Play Button */}
                  <a href="javascript:void(0)">
                    <span className="icon" data-video="">
                      <i className="ti-control-play"></i>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }