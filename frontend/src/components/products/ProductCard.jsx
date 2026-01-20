import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import StarRating from '@/components/ui/star-rating';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import AnimatedAddToCartButton from '@/components/animations/AnimatedAddToCartButton';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Ensure productId is a string
  const productId = (product.id || product._id)?.toString();
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const rating = product.rating || 0;
  const reviews = product.reviews || 0;
  const discount = product.discount || 0;

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = async (e) => {
    e?.preventDefault();
    addToCart(product);
  };

  return (
    <Link to={`/product/${productId}`}>
      <Card className="group hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover rounded-md"
            />
            {discount > 0 && (
              <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-bold">
                -{discount}%
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={handleWishlistToggle}
            >
              <Heart
                className={`w-5 h-5 ${
                  isInWishlist(productId) ? 'fill-destructive text-destructive' : ''
                }`}
              />
            </Button>
          </div>

          <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>

          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={rating} size="w-4 h-4" />
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-lg font-bold text-primary">
              ${price.toFixed(2)}
            </span>
            {discount > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                ${(price / (1 - discount / 100)).toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <AnimatedAddToCartButton
            product={product}
            onAddToCart={handleAddToCart}
            className="w-full"
          />
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;



