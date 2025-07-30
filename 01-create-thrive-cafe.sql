-- STEP 1: Create Thrive Cafe Restaurant
-- Run this in your Supabase SQL Editor

INSERT INTO restaurants (id, name, location, address, phone, email) 
VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
    'Thrive Cafe', 
    'Main Street', 
    '456 Main Street, Your City, Your State', 
    '+1234567890', 
    'admin@thrivecafe.com'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = now();

-- Verify the restaurant was created
SELECT * FROM restaurants WHERE name = 'Thrive Cafe';
