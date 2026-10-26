import dotenv from 'dotenv';
import colors from 'colors';
import { supabaseAdmin } from './config/supabase.js';
import products from './data/products.js';

dotenv.config();

const importData = async () => {
  try {
    console.log('Seeding products to Supabase...'.yellow);

    const productsToInsert = products.map((p) => ({
      name: p.name,
      image: p.image,
      brand: p.brand,
      category: p.category,
      description: p.description,
      price: p.price,
      count_in_stock: p.countInStock,
      rating: p.rating,
      num_reviews: p.numReviews,
    }));

    // Upsert products by name
    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(productsToInsert, { onConflict: 'name' })
      .select();

    if (error) {
      // If no unique constraint on name, try plain insert
      const { data: insData, error: insErr } = await supabaseAdmin
        .from('products')
        .insert(productsToInsert)
        .select();

      if (insErr) throw insErr;
      console.log(`Inserted ${insData?.length || 0} products!`.green.inverse);
    } else {
      console.log(`Successfully seeded ${data?.length || 0} products into Supabase!`.green.inverse);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message || error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    console.log('Cleaning Supabase test data...'.yellow);
    await supabaseAdmin.from('order_items').delete().neq('quantity', -1);
    await supabaseAdmin.from('orders').delete().neq('total_price', -1);
    await supabaseAdmin.from('reviews').delete().neq('rating', -1);
    await supabaseAdmin.from('products').delete().neq('price', -1);

    console.log('Data Destroyed!'.red.inverse);
    process.exit(0);
  } catch (error) {
    console.error(`Error deleting data: ${error.message || error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
