-- Supabase Database Schema for Thrive Cafe Billing Software
-- Run this SQL in your Supabase SQL Editor

-- Create tables

-- 1. Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password TEXT NOT NULL, -- Store encrypted password
    username TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'staff' CHECK (role IN ('master_admin', 'admin', 'staff')),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    making_cost DECIMAL(10,2) DEFAULT 0,
    category TEXT,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Combos table
CREATE TABLE IF NOT EXISTS combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    product_ids UUID[],
    price NUMERIC(10,2) NOT NULL,
    making_cost NUMERIC(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Combo items (many-to-many relationship between combos and products)
CREATE TABLE IF NOT EXISTS combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID REFERENCES combos(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    discount_percent NUMERIC(5,2),
    discount_amount NUMERIC(10,2),
    applicable_on TEXT CHECK (applicable_on IN ('bill', 'products', 'combos')),
    applicable_item_ids UUID[],
    minimum_order_amount NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    mobile_number TEXT,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Draft orders table
CREATE TABLE IF NOT EXISTS draft_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    created_by_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    table_number TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2),
    discount_applied_percent NUMERIC(5,2) DEFAULT 0,
    notes TEXT,
    datetime_created TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Sales orders table (completed orders)
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    processed_by_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_mobile TEXT,
    table_number TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    discount_applied_percent NUMERIC(5,2) DEFAULT 0,
    final_amount NUMERIC(10,2) NOT NULL,
    profit NUMERIC(10,2),
    payment_type TEXT CHECK (payment_type IN ('cash', 'card', 'upi', 'other')),
    datetime_paid TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_restaurant_id ON user_profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_combos_restaurant_id ON combos(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id ON offers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_draft_orders_restaurant_id ON draft_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_draft_orders_user_id ON draft_orders(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_restaurant_id ON sales_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(datetime_paid);

-- Enable Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Master admin can manage restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can view profiles in same restaurant" ON user_profiles;
DROP POLICY IF EXISTS "Admin can manage user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view restaurant products" ON products;
DROP POLICY IF EXISTS "Admin can insert products" ON products;
DROP POLICY IF EXISTS "Admin can update products" ON products;
DROP POLICY IF EXISTS "Admin can delete products" ON products;
DROP POLICY IF EXISTS "Users can view restaurant combos" ON combos;
DROP POLICY IF EXISTS "Admin can insert combos" ON combos;
DROP POLICY IF EXISTS "Admin can update combos" ON combos;
DROP POLICY IF EXISTS "Admin can delete combos" ON combos;
DROP POLICY IF EXISTS "Users can view restaurant combo items" ON combo_items;
DROP POLICY IF EXISTS "Admin can insert combo items" ON combo_items;
DROP POLICY IF EXISTS "Admin can update combo items" ON combo_items;
DROP POLICY IF EXISTS "Admin can delete combo items" ON combo_items;
DROP POLICY IF EXISTS "Users can view restaurant offers" ON offers;
DROP POLICY IF EXISTS "Admin can insert offers" ON offers;
DROP POLICY IF EXISTS "Admin can update offers" ON offers;
DROP POLICY IF EXISTS "Admin can delete offers" ON offers;
DROP POLICY IF EXISTS "Restaurant users can manage customers" ON customers;
DROP POLICY IF EXISTS "Users can manage own draft orders" ON draft_orders;
DROP POLICY IF EXISTS "Restaurant users can view sales orders" ON sales_orders;
DROP POLICY IF EXISTS "All restaurant users can create sales orders" ON sales_orders;

-- Restaurants: Users can only access their own restaurant (master_admin can access all)
CREATE POLICY "Users can view their own restaurant" ON restaurants
    FOR SELECT USING (
        id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Master admin can insert/update restaurants
CREATE POLICY "Master admin can manage restaurants" ON restaurants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- User profiles: Users can view profiles in same restaurant, admin+ can manage
CREATE POLICY "Users can view profiles in same restaurant" ON user_profiles
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        ) OR id = auth.uid()
    );

-- Admin and master_admin can insert/update/delete user profiles
CREATE POLICY "Admin can manage user profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR id = auth.uid()
    );

-- Products: Users can access products from their restaurant, admin+ can manage
CREATE POLICY "Users can view restaurant products" ON products
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can insert products" ON products
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can update products" ON products
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can delete products" ON products
    FOR DELETE USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Combos: Same pattern as products
CREATE POLICY "Users can view restaurant combos" ON combos
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can insert combos" ON combos
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can update combos" ON combos
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can delete combos" ON combos
    FOR DELETE USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Combo items: Same pattern
CREATE POLICY "Users can view restaurant combo items" ON combo_items
    FOR SELECT USING (
        combo_id IN (
            SELECT id FROM combos WHERE restaurant_id IN (
                SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
            )
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can insert combo items" ON combo_items
    FOR INSERT WITH CHECK (
        combo_id IN (
            SELECT id FROM combos WHERE restaurant_id IN (
                SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
            )
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can update combo items" ON combo_items
    FOR UPDATE USING (
        combo_id IN (
            SELECT id FROM combos WHERE restaurant_id IN (
                SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
            )
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can delete combo items" ON combo_items
    FOR DELETE USING (
        combo_id IN (
            SELECT id FROM combos WHERE restaurant_id IN (
                SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
            )
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Offers: Admin can manage
CREATE POLICY "Users can view restaurant offers" ON offers
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can insert offers" ON offers
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can update offers" ON offers
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "Admin can delete offers" ON offers
    FOR DELETE USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Customers: All restaurant users can manage
CREATE POLICY "Restaurant users can manage customers" ON customers
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Draft orders: Users can manage their own drafts
CREATE POLICY "Users can manage own draft orders" ON draft_orders
    FOR ALL USING (
        (created_by_user_id = auth.uid()) OR 
        (restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
        )) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Sales orders: Restaurant users can view, admin+ can manage
CREATE POLICY "Restaurant users can view sales orders" ON sales_orders
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

CREATE POLICY "All restaurant users can create sales orders" ON sales_orders
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'master_admin'
        )
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND is_active = true
        AND (
            role = required_role 
            OR (required_role = 'admin' AND role = 'master_admin')
            OR (required_role = 'staff' AND role IN ('admin', 'master_admin'))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's restaurant
CREATE OR REPLACE FUNCTION get_user_restaurant()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT restaurant_id FROM user_profiles 
        WHERE id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_combos_updated_at ON combos;
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
DROP TRIGGER IF EXISTS update_draft_orders_updated_at ON draft_orders;

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_combos_updated_at
    BEFORE UPDATE ON combos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_draft_orders_updated_at
    BEFORE UPDATE ON draft_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert sample data (optional)
-- Insert a demo restaurant (only if it doesn't exist)
INSERT INTO restaurants (id, name, address, phone, email) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'Demo Cafe', 
    '123 Main Street, City', 
    '+1234567890', 
    'demo@cafe.com'
)
ON CONFLICT (id) DO NOTHING;

-- Note: To insert a user, you'll need to first create an account through Supabase Auth
-- Then you can link it to a restaurant using the users table

-- ROLE HIERARCHY AND PERMISSIONS:
-- 
-- 1. MASTER_ADMIN:
--    - Can access ALL restaurants and data across the entire system
--    - Can create, update, delete restaurants
--    - Can manage users across all restaurants
--    - System-wide administrative privileges
--    - Typically for software owners/developers who manage multiple cafes
--
-- 2. ADMIN:
--    - Can manage their own specific restaurant completely (e.g., Thrive Cafe)
--    - Can create, update, delete products, combos, offers for their restaurant
--    - Can manage staff within their restaurant
--    - Can view all orders and sales data for their restaurant
--    - Can modify their restaurant settings
--    - Cannot access other restaurants
--
-- 3. STAFF:
--    - Can create and process orders for their assigned restaurant
--    - Can view products and combos for their restaurant
--    - Can save and retrieve draft orders
--    - Cannot access reports or administrative functions
--    - Basic point-of-sale access only
--
-- Usage Examples:
-- 
-- To create a master admin user:
-- 1. Create user through Supabase Auth
-- 2. INSERT INTO user_profiles (id, email, password, username, full_name, role, restaurant_id) 
--    VALUES (auth_user_id, 'admin@system.com', crypt('password', gen_salt('bf')), 'masteradmin', 'System Admin', 'master_admin', null);
--
-- To create a restaurant admin for Thrive Cafe:
-- 1. Create user through Supabase Auth  
-- 2. INSERT INTO user_profiles (id, email, password, username, full_name, role, restaurant_id)
--    VALUES (auth_user_id, 'admin@thrivecafe.com', crypt('password', gen_salt('bf')), 'thriveadmin', 'Thrive Cafe Admin', 'admin', restaurant_uuid);
--
-- The user_has_role() function provides hierarchical role checking:
-- - user_has_role('staff') returns true for staff, admin, master_admin
-- - user_has_role('admin') returns true for admin, master_admin
-- - user_has_role('master_admin') returns true only for master_admin
