import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-muted mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">About ShopZone</h3>
            <p className="text-sm text-muted-foreground">
              Your one-stop destination for all your shopping needs. Quality products at the best prices.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="text-muted-foreground hover:text-primary">All Products</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/orders" className="text-muted-foreground hover:text-primary">Track Order</Link></li>
              <li><Link to="/returns" className="text-muted-foreground hover:text-primary">Return Order</Link></li>
              <li><Link to="/shipping" className="text-muted-foreground hover:text-primary">Shipping Info</Link></li>
              <li><Link to="/account" className="text-muted-foreground hover:text-primary">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: support@shopzone.com</li>
              <li>Phone: +91 9876543210</li>
              <li>Hours: Mon-Fri 9AM-6PM</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ShopZone. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



