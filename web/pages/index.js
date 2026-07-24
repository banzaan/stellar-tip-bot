// pages/index.js
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';
import TippingPortal from '../components/TippingPortal';
import PromoVideo from '../components/PromoVideo';
import Analytics from '../components/Analytics';
import Testimonial from '../components/Testimonial';
import Subscribe from '../components/Subscribe';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="body-wrapper" dir="ltr">


    <Navbar /> 
    <Banner /> 
    <TippingPortal />
    <PromoVideo />
    <Analytics />
    <Testimonial />
    <Subscribe />
    <Footer />
    


      
    </div>
  );
}