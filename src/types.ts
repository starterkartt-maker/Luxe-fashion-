export type Profile = {
  id: string; // uuid
  full_name: string;
  email?: string;
  created_at: string;
}

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export type Campaign = {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  button_text: string;
  redirect_url: string;
  active: boolean;
}

export type Product = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  category_id?: string;
  collection_id?: string;
  created_at: string;
  // relations
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
}

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

export type ProductVariant = {
  id: string;
  product_id: string;
  color?: string;
  size?: string;
  stock: number;
  price?: number;
  image_url?: string;
}

export type HomepageSection = {
  id: string;
  title: string;
  type: string; // 'trending', 'bestsellers' etc
  display_order: number;
  homepage_section_products?: HomepageSectionProduct[];
}

export type HomepageSectionProduct = {
  id: string;
  section_id: string;
  product_id: string;
  product?: Product; // joined
}

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export type Wishlist = {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
}

export type Order = {
  id: string;
  user_id: string;
  status: string; // 'pending', 'confirmed', 'shipped' etc
  total_amount: number;
  shipping_address_id?: string;
  created_at: string;
}
