import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Truck, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { productsAPI } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import ProductCard from '@/components/products/ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const [productData, reviewsData, recommendationsData]: any = await Promise.all([
        productsAPI.getById(id!),
        productsAPI.getReviews(id!),
        productsAPI.getRecommendations(id!),
      ]);

      setProduct(productData);
      setReviews(reviewsData.reviews || []);
      setRecommendations(recommendationsData.products || []);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading...</div>;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-12 text-center">Product not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <img
            src={product.image}
            alt={product.name}
            className="w-full rounded-lg"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-accent text-accent'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">{product.reviews} reviews</span>
          </div>

          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-3xl font-bold text-primary">${product.price}</span>
            {product.discount && (
              <span className="text-xl text-muted-foreground line-through">
                ${(product.price / (1 - product.discount / 100)).toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-6">{product.description}</p>

          <div className="flex gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>

            <Button
              className="flex-1"
              onClick={() => addToCart(product, quantity)}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => addToWishlist(product)}
            >
              <Heart
                className={`w-5 h-5 ${
                  isInWishlist(product.id) ? 'fill-destructive text-destructive' : ''
                }`}
              />
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

      {/* Tabs */}
      <Tabs defaultValue="description" className="mb-16">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <p>{product.longDescription || product.description}</p>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-6">
            {reviews.map((review: any) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{review.userName}</span>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
              </div>
            ))}
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

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
