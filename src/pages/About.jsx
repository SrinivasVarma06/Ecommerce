import { Link } from 'react-router-dom';

const About = () => (
  <div className="container mx-auto px-4 py-16">
    <h1 className="text-4xl font-bold mb-4">About Us</h1>
    <p className="text-muted-foreground mb-6">
      Welcome to ShopZone! We are dedicated to providing the best shopping experience with quality products and great service.
    </p>
    <div className="bg-card border rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-2">Our Mission</h2>
      <p className="text-muted-foreground">
        To deliver top-notch products and make online shopping easy and enjoyable for everyone.
      </p>
    </div>
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-2">Contact</h2>
      <p className="text-muted-foreground mb-2">Email: support@shopzone.com</p>
      <p className="text-muted-foreground">Phone: +91 9876543210</p>
    </div>
    <Link to="/" className="mt-8 inline-block">
      <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Back to Home</button>
    </Link>
  </div>
);

export default About;