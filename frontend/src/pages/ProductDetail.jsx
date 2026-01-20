import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Truck, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StarRating from '@/components/ui/star-rating';
import { productsAPI } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import ReviewForm from '@/components/products/ReviewForm';
import PricePrediction from '@/components/products/PricePrediction';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await productsAPI.getById(id);
      setProduct(data);

      try {
        const rev = await productsAPI.getReviews(id);
        setReviews(rev.reviews || []);
      } catch (err) {
        setReviews([]);
      }
    } catch (err) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadProduct();
    // eslint-disable-next-line
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-12 text-center">Loading...</div>;
  if (!product) return <div className="container mx-auto px-4 py-12 text-center">Product not found</div>;

  const avgRating = typeof product.rating === 'number' ? product.rating : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <img src={product.image} alt={product.name} className="w-full rounded-lg" />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-4">
            <StarRating rating={avgRating} size="w-5 h-5" />
            <span className="text-muted-foreground">{product.reviews || reviews.length} reviews</span>
            {typeof product.rating === 'number' && <span className="ml-2 text-sm text-muted-foreground">({product.rating.toFixed(1)} avg)</span>}
          </div>

          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-3xl font-bold text-primary">${product.price}</span>
            {product.discount && (
              <span className="text-xl text-muted-foreground line-through">${(product.price / (1 - product.discount / 100)).toFixed(2)}</span>
            )}
          </div>

          <p className="text-muted-foreground mb-6">{product.description}</p>

          <div className="flex gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </div>

            <Button className="flex-1" onClick={() => addToCart(product, quantity)}>
              <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
            </Button>

            <Button variant="outline" size="icon" onClick={() => addToWishlist(product)}>
              <Heart className={`w-5 h-5 ${isInWishlist(product._id) ? 'fill-destructive text-destructive' : ''}`} />
            </Button>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-primary" />
              <span className="text-sm">Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">Secure payment & buyer protection</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-primary" />
              <span className="text-sm">30-day easy returns</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="mb-16">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="price-prediction">💰 Price Prediction</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <p>{product.longDescription || product.description}</p>
          </div>
        </TabsContent>

        <TabsContent value="price-prediction" className="mt-6">
          <PricePrediction productId={id} currentPrice={product.price} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="bg-card border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <ReviewForm productId={id} onReviewSubmitted={loadProduct} />
          </div>

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id || review.id} className="border-b pb-6">
                   <div className="flex items-center gap-2 mb-2">
                     <StarRating rating={review.rating} size="w-4 h-4" />
                     <span className="font-semibold">{review.userName}</span>
                     <span className="text-sm text-muted-foreground">{review.date}</span>
                   </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <div className="space-y-4">
            <p>Free standard shipping on orders over $50.</p>
            <p>Express shipping available at checkout.</p>
            <p>Estimated delivery: 3-5 business days.</p>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default ProductDetail;
