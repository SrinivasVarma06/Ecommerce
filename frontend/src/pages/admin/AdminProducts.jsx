import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productsAPI, adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, isAdmin } = useAuth();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    stock: '',
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async () => {
    try {
      await adminAPI.createProduct(newProduct, token);
      toast({ title: 'Success', description: 'Product added successfully' });
      setShowAddModal(false);
      setNewProduct({ name: '', description: '', price: '', image: '', category: '' });
      loadProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll({});
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!token || !confirm('Are you sure you want to delete this product?')) return;

    try {
      await adminAPI.deleteProduct(productId, token);
      toast({ title: 'Success', description: 'Product deleted successfully' });
      loadProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You don't have admin privileges</p>
      </div>
    );
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground mt-2">Add, edit, or remove products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            Back to Dashboard
          </Button>
          <Button onClick={()=>setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id} className="border-t">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4">${product.price}</td>
                  <td className="p-4">{product.stock || 'In Stock'}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon"
                        onClick={() => {
                          setEditProduct(product);
                          setShowEditModal(true);
                        }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Product</h2>
            <form onSubmit={e => {
                e.preventDefault();
                handleAddProduct();
              }}
            >
              <input
                type="text"
                placeholder="Name"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={newProduct.description}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock}
                onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Image URL"
                value={newProduct.image}
                onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Category"
                value={newProduct.category}
                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && editProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                await adminAPI.updateProduct(editProduct._id, editProduct, token);
                toast({ title: 'Success', description: 'Product updated successfully' });
                setShowEditModal(false);
                setEditProduct(null);
                loadProducts();
              }}
            >
              <input
                type="text"
                placeholder="Name"
                value={editProduct.name}
                onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={editProduct.description}
                onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={editProduct.price}
                onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={editProduct.stock}
                onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Image URL"
                value={editProduct.image}
                onChange={e => setEditProduct({ ...editProduct, image: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Category"
                value={editProduct.category}
                onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                className="mb-2 w-full p-2 border rounded"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;



