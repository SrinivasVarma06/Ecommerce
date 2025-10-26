import { Link } from "react-router-dom";

const Returns = () => (
  <div className="container mx-auto px-4 py-16">
    <h1 className="text-4xl font-bold mb-4">Returns & Refunds</h1>
    <p className="text-muted-foreground mb-6">
      We want you to be happy with your purchase! If you’re not satisfied, you can return most items within 7 days of delivery.
    </p>
    <div className="bg-card border rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-2">How to Return an Item</h2>
      <ol className="list-decimal ml-6 text-muted-foreground">
        <li>Go to your <Link to="/orders" className="text-primary underline">Orders</Link> page.</li>
        <li>Select the item you want to return and click "Request Return".</li>
        <li>Follow the instructions to schedule a pickup or drop-off.</li>
      </ol>
    </div>
    <div className="bg-card border rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-2">Refund Policy</h2>
      <p className="text-muted-foreground">
        Refunds are processed within 3-5 business days after we receive your returned item. You’ll be notified by email once your refund is issued.
      </p>
    </div>
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
      <p className="text-muted-foreground">
        Contact our support team at <a href="mailto:support@shopzone.com" className="text-primary underline">support@shopzone.com</a> for any questions.
      </p>
    </div>
  </div>
);

export default Returns;