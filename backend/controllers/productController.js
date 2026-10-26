import asyncHandler from '../middleware/asyncHandler.js';
import { supabaseAdmin } from '../config/supabase.js';

const PAGINATION_LIMIT = parseInt(process.env.PAGINATION_LIMIT) || 16;

// @desc    Fetch all products with optional keyword search and pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const keyword = (req.query.keyword || '').trim();

  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' });

  if (keyword) {
    query = query.ilike('name', `%${keyword}%`);
  }

  query = query.order('created_at', { ascending: false });

  let { data: products, count, error } = await query
    .range((page - 1) * PAGINATION_LIMIT, page * PAGINATION_LIMIT - 1);

  if (error || !products) {
    console.error('getProducts query error, falling back to all products:', error);
    const { data: allProds } = await supabaseAdmin.from('products').select('*');
    products = allProds || [];
    count = products.length;
  }

  res.json({
    products: (products || []).map(normalizeProduct),
    page,
    pages: Math.ceil((count || products.length) / PAGINATION_LIMIT) || 1,
  });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      reviews (
        id,
        user_id,
        name,
        rating,
        comment,
        created_at
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(normalizeProduct(product));
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: 'Sample name',
      price: 0,
      user_id: req.user._id,
      image: '/images/sample.jpg',
      brand: 'Sample brand',
      category: 'Sample category',
      count_in_stock: 0,
      num_reviews: 0,
      description: 'Sample description',
    })
    .select()
    .single();

  if (error) {
    res.status(400);
    throw new Error('Could not create product');
  }

  res.status(201).json(normalizeProduct(product));
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .update({
      name,
      price,
      description,
      image,
      brand,
      category,
      count_in_stock: countInStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(normalizeProduct(product));
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({ message: 'Product removed' });
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  // Check if already reviewed
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('product_id', req.params.id)
    .eq('user_id', req.user._id)
    .single();

  if (existing) {
    res.status(400);
    throw new Error('Product already reviewed');
  }

  const { error } = await supabaseAdmin.from('reviews').insert({
    product_id: req.params.id,
    user_id: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  });

  if (error) {
    res.status(400);
    throw new Error('Could not add review: ' + error.message);
  }

  res.status(201).json({ message: 'Review added' });
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  let { data: products, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('rating', { ascending: false })
    .limit(3);

  if (error || !products || products.length === 0) {
    console.error('getTopProducts query error, falling back to top 3:', error);
    const { data: fallback } = await supabaseAdmin.from('products').select('*').limit(3);
    products = fallback || [];
  }

  res.json((products || []).map(normalizeProduct));
});

// Helper to normalize Supabase snake_case → camelCase expected by frontend
function normalizeProduct(p) {
  return {
    _id: p.id,
    name: p.name,
    image: p.image,
    brand: p.brand,
    category: p.category,
    description: p.description,
    price: parseFloat(p.price),
    countInStock: p.count_in_stock,
    rating: parseFloat(p.rating),
    numReviews: p.num_reviews,
    user: p.user_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    reviews: (p.reviews || []).map((r) => ({
      _id: r.id,
      user: r.user_id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    })),
  };
}

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
};
