import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dqhtktvaocnwavvaqzie.supabase.co';
const supabaseKey = 'sb_publishable_YRszGyFgQsqC1Rc9bzmVqw_rNIWT4PT';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: p, error: e3 } = await supabase.from('products').select('*').limit(3);
  console.log('products:', p, e3);
  
  const { data: pi, error: e4 } = await supabase.from('product_images').select('*').limit(3);
  console.log('product_images:', pi, e4);

  const { data: ordCols, error: e6 } = await supabase.rpc('get_schema_details_or_direct_sql_columns');
  // Since rpc might not be predefined, let's query via standard PostgREST or postgrest-rpc if available.
  // Alternatively, querying information_schema might require a custom SQL execution or postgres function. 
  // Wait, does Supabase let us select from any table or view? We can try selecting from information_schema via RPC, or sometimes there is an admin/public schema query.
  // Actually, we can test insert directly, or query columns by making a select on a non-existent column, but that's error-prone.
  // Let's test a simple insert on addresses and orders to see what error it returns!
  console.log("Testing addresses insert probes (wide range)...");
  const tempUserId = 'd9bd54a1-161b-4ca7-9307-4b1f8616ca31'; // A valid UUID or mock
  
  const candidates = [
    'address_line_1', 'address_line2', 'address_line_2', 'address_line', 
    'address_text', 'street_address_line1', 'street_address_line_1', 
    'streetaddress', 'street_addr', 'addr', 'addr_line1', 'addr_line_1', 
    'address1', 'address_1', 'street1', 'street_1', 'detail', 'details', 
    'location', 'address_details', 'full_address', 'shipping_address', 
    'address_str', 'street_str', 'address_value', 'street_value'
  ];
  
  for (const field of candidates) {
    const payload: any = {
      user_id: tempUserId,
      full_name: 'Test Name',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      phone: '1234567890',
      is_default: true
    };
    payload[field] = '123 Test St';
    const { error } = await supabase.from('addresses').insert(payload);
    if (error && error.message.includes('Could not find')) {
      // Column doesn't exist
    } else {
      console.log(`Probe [${field}]: success or other error:`, error);
    }
  }

  console.log("Testing orders columns for address link...");
  const orderCandidates = ['address_id', 'shipping_id', 'shipping_address', 'address', 'delivery_address_id'];
  for (const field of orderCandidates) {
    const payload: any = {
      user_id: tempUserId,
      total_amount: 1500,
      status: 'pending'
    };
    payload[field] = field.includes('id') ? 'd9bd54a1-161b-4ca7-9307-4b1f8616ca31' : '123 Test Street';
    const { error } = await supabase.from('orders').insert(payload);
    if (error && error.message.includes('Could not find')) {
      // Column doesn't exist
    } else {
      console.log(`Order Probe [${field}]: success or other error:`, error);
    }
  }
}

run();
