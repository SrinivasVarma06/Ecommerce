import { Link } from 'react-router-dom';

const Contact = () => (
  <div className="container mx-auto px-4 py-16">
    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
    <p className="text-muted-foreground mb-6">
      We'd love to hear from you! Reach out with any questions, feedback, or support needs.
    </p>
    <div className="bg-card border rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-2">Email</h2>
      <p className="text-muted-foreground">support@shopzone.com</p>
    </div>
    <div className="bg-card border rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-2">Phone</h2>
      <p className="text-muted-foreground">+91 9876543210</p>
      <p className="text-muted-foreground">Mon-Fri 9AM-6PM</p>
    </div>
    <Link to="/" className="mt-8 inline-block">
      <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Back to Home</button>
    </Link>
  </div>
);

export default Contact;