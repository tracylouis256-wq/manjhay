import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'sports', label: 'Sports' },
    { value: 'beach', label: 'Beach' },
    { value: 'traditional', label: 'Traditional' }
  ];

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (category) params.append('category', category);

      const response = await axios.get(`/api/products?${params}`);
      setProducts(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [searchTerm, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Slippers</h1>
          <p className="mt-2 text-gray-600">Discover our collection of comfortable and stylish slippers</p>
        </div>

        {/* Request Product Banner */}
        <div className="bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <Plus size={24} className="mr-2 text-[#FCD116]" />
                <h2 className="text-xl font-bold">Can't Find What You're Looking For?</h2>
              </div>
              <p className="text-orange-100">
                Request a custom product and we'll help you find or create exactly what you need.
              </p>
            </div>
            <Link
              to="/request-product"
              className="bg-[#FCD116] text-[#CE1126] px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap"
            >
              Request Custom Product
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                />
              </div>
            </form>

            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle - Hidden since ProductCard doesn't support list view yet */}
              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  disabled
                  className="p-2 rounded text-gray-300 cursor-not-allowed"
                  title="List view coming soon"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
                  <Search size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any products matching your criteria.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCategory('');
                        fetchProducts(1);
                      }}
                      className="w-full bg-[#f97316] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors"
                    >
                      View All Products
                    </button>
                    <Link
                      to="/request-product"
                      className="w-full border border-[#f97316] text-[#f97316] px-4 py-2 rounded-lg font-semibold hover:bg-[#f97316] hover:text-white transition-colors block text-center"
                    >
                      Request Custom Product
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchProducts(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchProducts(page)}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        currentPage === page
                          ? 'bg-[#f97316] text-white border-[#f97316]'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => fetchProducts(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;