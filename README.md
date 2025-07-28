# Cafe Billing Software

A modern, responsive cafe billing software built with React, Tailwind CSS, and Supabase. Features real-time order management, inventory tracking, and comprehensive reporting.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login with Supabase Auth
- **Dashboard** - Real-time sales statistics and charts
- **Order Management** - Create and manage orders with smart product search
- **Cart System** - Add/remove items with quantity controls
- **Offers & Discounts** - Apply multiple offers with automatic calculation
- **Payment Processing** - Support for cash, card, and UPI payments
- **Customer Management** - Store customer information for orders

### Advanced Features
- **Multi-Restaurant Support** - Manage multiple cafe locations
- **Real-time Updates** - Live data synchronization with Supabase
- **Export Functionality** - Download sales reports as CSV
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Toast Notifications** - Instant feedback for user actions

### UI/UX Highlights
- **Modern Design** - Clean, professional interface with Tailwind CSS
- **Smart Search** - Typeahead product search with filtering
- **Interactive Charts** - Visual sales data with Recharts
- **Loading States** - Smooth loading animations and feedback
- **Accessibility** - Keyboard navigation and ARIA attributes

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM
- **Styling**: Tailwind CSS, Custom animations
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Charts**: Recharts
- **Forms**: Formik with Yup validation
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cafe-billing-software
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🗄️ Database Setup

### Required Supabase Tables

Create the following tables in your Supabase project:

#### 1. users
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. restaurants
```sql
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. products
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  making_cost DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. combos
```sql
CREATE TABLE combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  making_cost DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. combo_items
```sql
CREATE TABLE combo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID REFERENCES combos(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. offers
```sql
CREATE TABLE offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. sales
```sql
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  payment_method TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  applied_offers JSONB,
  order_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

Enable RLS and create policies for each table:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Example policy for products (adjust for your needs)
CREATE POLICY "Users can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Users can insert products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update products" ON products
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete products" ON products
  FOR DELETE USING (true);
```

## 🎯 Usage Guide

### 1. Authentication
- Navigate to the login page
- Enter your email and password
- The system will authenticate with Supabase

### 2. Dashboard
- View real-time sales statistics
- Check daily, weekly, and monthly metrics
- Export sales data as CSV
- Monitor recent transactions

### 3. Creating Orders
- Click "New Order" or navigate to Orders
- Search for products using the smart search
- Add items to cart with quantity controls
- Apply available offers and discounts
- Enter customer information
- Complete payment

### 4. Managing Products
- Navigate to Products section
- Add new products with pricing
- Edit existing product details
- Manage product availability

### 5. Offers Management
- Create time-based offers
- Set discount percentages
- Configure date and time ranges
- Activate/deactivate offers

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** (1024px+) - Full sidebar navigation
- **Tablet** (768px - 1023px) - Collapsible sidebar
- **Mobile** (< 768px) - Mobile-first layout

## 🔒 Security Features

- **Supabase Auth** - Secure user authentication
- **Row Level Security** - Database-level access control
- **Protected Routes** - Client-side route protection
- **Input Validation** - Form validation with Yup
- **CSRF Protection** - Built-in Supabase security

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the Supabase documentation for backend setup
- Review the React and Tailwind CSS documentation

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Inventory management
- [ ] Staff management
- [ ] Customer loyalty program
- [ ] Mobile app (React Native)
- [ ] API documentation
- [ ] Unit and integration tests

---

**Built with ❤️ using React, Tailwind CSS, and Supabase** 