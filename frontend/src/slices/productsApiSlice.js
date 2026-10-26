import { PRODUCTS_URL } from '../constants';
import { apiSlice } from './apiSlice';
import supabase from '../supabase';

function normalizeSupabaseProduct(p) {
  return {
    _id: p.id,
    name: p.name,
    image: p.image,
    brand: p.brand,
    category: p.category,
    description: p.description,
    price: parseFloat(p.price || 0),
    countInStock: p.count_in_stock,
    rating: parseFloat(p.rating || 0),
    numReviews: p.num_reviews,
    user: p.user_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    reviews: [],
  };
}

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      async queryFn({ keyword, pageNumber } = {}, _queryApi, _extraOptions, baseQuery) {
        // 1. Primary: Query Express backend API
        try {
          const result = await baseQuery({
            url: PRODUCTS_URL,
            params: { keyword, pageNumber },
          });

          if (result.data && result.data.products && result.data.products.length > 0) {
            return { data: result.data };
          }
        } catch (_) {}

        // 2. Resilient Fallback: Query Supabase PostgreSQL directly
        try {
          let query = supabase.from('products').select('*', { count: 'exact' });
          if (keyword && keyword.trim()) {
            query = query.ilike('name', `%${keyword.trim()}%`);
          }
          query = query.order('created_at', { ascending: false });

          const { data, count, error } = await query;
          if (error) throw error;

          return {
            data: {
              products: (data || []).map(normalizeSupabaseProduct),
              page: Number(pageNumber) || 1,
              pages: Math.ceil((count || data?.length || 1) / 16) || 1,
            },
          };
        } catch (supaErr) {
          return { error: { status: 500, data: { message: supaErr.message } } };
        }
      },
      keepUnusedDataFor: 5,
      providesTags: ['Products'],
    }),
    getProductDetails: builder.query({
      async queryFn(productId, _queryApi, _extraOptions, baseQuery) {
        // 1. Primary: Query Express backend API
        try {
          const result = await baseQuery(`${PRODUCTS_URL}/${productId}`);
          if (result.data && result.data._id) {
            return { data: result.data };
          }
        } catch (_) {}

        // 2. Resilient Fallback: Query Supabase directly
        try {
          const { data, error } = await supabase
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
            .eq('id', productId)
            .single();

          if (error || !data) throw error || new Error('Product not found');

          const normalized = {
            ...normalizeSupabaseProduct(data),
            reviews: (data.reviews || []).map((r) => ({
              _id: r.id,
              user: r.user_id,
              name: r.name,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.created_at,
            })),
          };

          return { data: normalized };
        } catch (supaErr) {
          return { error: { status: 404, data: { message: supaErr.message } } };
        }
      },
      keepUnusedDataFor: 5,
    }),
    createProduct: builder.mutation({
      query: () => ({
        url: `${PRODUCTS_URL}`,
        method: 'POST',
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    uploadProductImage: builder.mutation({
      query: (data) => ({
        url: `/api/upload`,
        method: 'POST',
        body: data,
      }),
    }),
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: 'DELETE',
      }),
      providesTags: ['Product'],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reviews`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    getTopProducts: builder.query({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        // 1. Primary: Query Express backend API
        try {
          const result = await baseQuery(`${PRODUCTS_URL}/top`);
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            return { data: result.data };
          }
        } catch (_) {}

        // 2. Resilient Fallback: Query Supabase directly
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('rating', { ascending: false })
            .limit(3);

          if (error) throw error;
          return { data: (data || []).map(normalizeSupabaseProduct) };
        } catch (supaErr) {
          return { error: { status: 500, data: { message: supaErr.message } } };
        }
      },
      keepUnusedDataFor: 5,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductDetailsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useDeleteProductMutation,
  useCreateReviewMutation,
  useGetTopProductsQuery,
} = productsApiSlice;
