import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '@/services/api';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'popular';

  useEffect(() => {
    if (category) {
      const cats = category.split(',').map(c => c.trim()).filter(c => c);
      setSelectedCategories(cats);
    } else {
      setSelectedCategories([]);
    }
  }, [category]);

  useEffect(() => {
    loadProducts();
  }, [category, search, sort]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category && category.trim() !== '') params.category = category;
      if (search && search.trim() !== '') params.search = search;
      if (sort) params.sort = sort;
      const data = await productsAPI.getAll(params);
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (value) => {
    setSearchParams({ ...Object.fromEntries(searchParams), sort: value });
  };

  const handleApplyFilters = () => {
    const params = { ...Object.fromEntries(searchParams) };
    if (selectedCategories.length > 0) {
      params.category = selectedCategories.join(',');
    } else {
      delete params.category;
    }
    setSearchParams(params);
  };

  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Toys', 'Anime/Manga'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-card border rounded-lg p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Filters</h3>

            {/* Categories */}
            <div className="mb-6">
              <Label className="mb-3 block">Categories</Label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center">
                    <Checkbox
                      id={cat}
                      checked={selectedCategories.includes(cat)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, cat]);
                        } else {
                          setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                        }
                      }}
                    />
                    <label htmlFor={cat} className="ml-2 text-sm cursor-pointer">
                      {cat}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {search 
                  ? `Search results for "${search}"` 
                  : selectedCategories.length > 0 
                    ? selectedCategories.map(cat => 
                        cat.charAt(0).toUpperCase() + cat.slice(1)
                      ).join(', ')
                    : 'All Products'}
              </h1>
              <p className="text-muted-foreground">{products.length} products found</p>
            </div>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;





