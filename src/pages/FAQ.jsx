const faqs = [
  {
    question: "How do I place an order?",
    answer: "Browse products, add items to your cart, and proceed to checkout. Follow the instructions to complete your purchase."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept credit/debit cards, UPI, and other secure payment options."
  },
  {
    question: "How can I track my order?",
    answer: "Go to 'Track Order' in the footer or your account page to view your order status and details."
  },
  {
    question: "What is the return policy?",
    answer: "You can return most items within 7 days of delivery. See our Returns page for details."
  },
  {
    question: "How do I contact support?",
    answer: "Visit our Contact page or email support@shopzone.com for help."
  }
];

const FAQ = () => (
  <div className="container mx-auto px-4 py-16">
    <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
    <div className="space-y-6">
      {faqs.map((faq, idx) => (
        <div key={idx} className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">{faq.question}</h2>
          <p className="text-muted-foreground">{faq.answer}</p>
        </div>
      ))}
    </div>
  </div>
);

export default FAQ;