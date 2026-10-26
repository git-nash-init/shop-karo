import asyncHandler from '../middleware/asyncHandler.js';
import { supabaseAdmin } from '../config/supabase.js';
import { calcPrices } from '../utils/calcPrices.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Fetch actual prices from DB to prevent client-side price manipulation
  const productIds = orderItems.map((x) => x._id);

  const { data: dbProducts, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, image')
    .in('id', productIds);

  if (productError || !dbProducts) {
    res.status(400);
    throw new Error('Could not validate product prices');
  }

  const dbProductMap = Object.fromEntries(dbProducts.map((p) => [p.id, p]));

  const dbOrderItems = orderItems.map((item) => {
    const dbProduct = dbProductMap[item._id];
    if (!dbProduct) throw new Error(`Product ${item._id} not found`);
    return {
      product: item._id,
      name: dbProduct.name,
      image: dbProduct.image,
      price: parseFloat(dbProduct.price),
      qty: item.qty,
    };
  });

  const { itemsPrice, taxPrice, shippingPrice, totalPrice } =
    calcPrices(dbOrderItems);

  // Insert the order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: req.user._id,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      items_price: parseFloat(itemsPrice),
      tax_price: parseFloat(taxPrice),
      shipping_price: parseFloat(shippingPrice),
      total_price: parseFloat(totalPrice),
    })
    .select()
    .single();

  if (orderError || !order) {
    res.status(400);
    throw new Error('Could not create order: ' + (orderError?.message || ''));
  }

  // Insert order items
  const orderItemsToInsert = dbOrderItems.map((item) => ({
    order_id: order.id,
    product_id: item.product,
    name: item.name,
    quantity: item.qty,
    image: item.image,
    price: item.price,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItemsToInsert);

  if (itemsError) {
    // Rollback: delete the order if items failed
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    res.status(400);
    throw new Error('Could not create order items');
  }

  // Fetch the full order with items to return
  const fullOrder = await fetchFullOrder(order.id);

  res.status(201).json(fullOrder);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('user_id', req.user._id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500);
    throw new Error('Could not fetch orders');
  }

  res.json(orders.map(normalizeOrder));
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await fetchFullOrder(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Users can only access their own orders (admins can access all - checked by admin middleware on the route)
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid (Supports Instant / Fake Checkout and PayPal)
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Generate or use transaction details (supports instant simulation & external payment)
  const txnId =
    req.body.id ||
    `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const status = req.body.status || 'COMPLETED';
  const emailAddress =
    req.body.payer?.email_address || req.user?.email || 'customer@shopkaro.com';

  const { data: updatedOrder, error } = await supabaseAdmin
    .from('orders')
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
      payment_result: {
        id: txnId,
        status: status,
        update_time: new Date().toISOString(),
        email_address: emailAddress,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(400);
    throw new Error('Could not update order payment: ' + error.message);
  }

  res.json(normalizeOrder(updatedOrder));
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const { data: updatedOrder, error } = await supabaseAdmin
    .from('orders')
    .update({
      is_delivered: true,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !updatedOrder) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json(normalizeOrder(updatedOrder));
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (*),
      profiles!orders_user_id_fkey (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500);
    throw new Error('Could not fetch orders');
  }

  res.json(orders.map((o) => normalizeOrder(o, true)));
});

// Helper: fetch a full order with items and user info
async function fetchFullOrder(orderId) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (*),
      profiles!orders_user_id_fkey (
        id,
        name
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) return null;

  // Get user email from auth
  const {
    data: { user: authUser },
  } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

  return normalizeOrder(order, true, authUser?.email);
}

// Helper: normalize Supabase order to camelCase for frontend
function normalizeOrder(o, includeUser = false, userEmail = '') {
  const normalized = {
    _id: o.id,
    orderItems: (o.order_items || []).map((item) => ({
      _id: item.id,
      product: item.product_id,
      name: item.name,
      qty: item.quantity,
      image: item.image,
      price: parseFloat(item.price),
    })),
    shippingAddress: o.shipping_address || {},
    paymentMethod: o.payment_method,
    paymentResult: o.payment_result || {},
    itemsPrice: parseFloat(o.items_price),
    taxPrice: parseFloat(o.tax_price),
    shippingPrice: parseFloat(o.shipping_price),
    totalPrice: parseFloat(o.total_price),
    isPaid: o.is_paid,
    paidAt: o.paid_at,
    isDelivered: o.is_delivered,
    deliveredAt: o.delivered_at,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };

  if (includeUser) {
    normalized.user = {
      _id: o.profiles?.id || o.user_id,
      name: o.profiles?.name || '',
      email: userEmail || '',
    };
  }

  return normalized;
}

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
};
