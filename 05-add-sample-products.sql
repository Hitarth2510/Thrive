-- STEP 5: Add Sample Products for Thrive Cafe
-- Run this after creating the restaurant and admin users

INSERT INTO products (restaurant_id, name, description, price, making_cost, category, is_available) VALUES
-- Coffee Items
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Espresso', 'Strong black coffee shot', 3.50, 0.80, 'Coffee', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Americano', 'Espresso with hot water', 4.00, 0.90, 'Coffee', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Cappuccino', 'Espresso with steamed milk foam', 4.50, 1.20, 'Coffee', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Latte', 'Espresso with steamed milk', 5.00, 1.40, 'Coffee', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Mocha', 'Espresso with chocolate and steamed milk', 5.50, 1.80, 'Coffee', true),

-- Tea Items
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Green Tea', 'Fresh green tea', 3.00, 0.60, 'Tea', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Black Tea', 'Classic black tea', 2.50, 0.50, 'Tea', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Chai Latte', 'Spiced tea with steamed milk', 4.25, 1.10, 'Tea', true),

-- Pastries & Snacks
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Croissant', 'Buttery flaky pastry', 3.25, 1.50, 'Pastry', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Muffin', 'Fresh baked muffin (various flavors)', 3.75, 1.80, 'Pastry', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Bagel', 'Fresh bagel with cream cheese', 4.50, 2.00, 'Pastry', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Danish', 'Sweet danish pastry', 4.00, 1.90, 'Pastry', true),

-- Sandwiches
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Turkey Sandwich', 'Turkey, lettuce, tomato on fresh bread', 8.50, 4.20, 'Sandwich', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Ham & Cheese', 'Ham and cheese sandwich', 7.75, 3.80, 'Sandwich', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Veggie Wrap', 'Fresh vegetables in tortilla wrap', 7.25, 3.50, 'Sandwich', true),

-- Cold Drinks
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Iced Coffee', 'Cold brew coffee over ice', 4.25, 1.00, 'Cold Drink', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Smoothie', 'Fresh fruit smoothie', 6.00, 2.50, 'Cold Drink', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Fresh Juice', 'Freshly squeezed orange juice', 4.75, 2.00, 'Cold Drink', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Soda', 'Soft drinks (various flavors)', 2.50, 0.75, 'Cold Drink', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Water', 'Bottled water', 1.75, 0.50, 'Cold Drink', true);

-- Verify products were added
SELECT 
    name, 
    description, 
    price, 
    making_cost, 
    category, 
    is_available 
FROM products 
WHERE restaurant_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
ORDER BY category, name;
