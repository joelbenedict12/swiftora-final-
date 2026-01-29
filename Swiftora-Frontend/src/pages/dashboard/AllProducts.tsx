import React from 'react';
import { Button } from "@/components/ui/button";
import { Link }from 'react-router-dom';

// Placeholder data for product cards
const productCategories = [
  {
    category: "Shipping & Logistics",
    products: [
      { title: "Domestic Shipping", description: "Reliable shipping across the country.", bannerColor: "bg-gradient-to-r from-blue-500 to-indigo-600" },
      { title: "International Shipping", description: "Expand your reach globally.", bannerColor: "bg-gradient-to-r from-purple-500 to-pink-600" },
      { title: "Hyperlocal Delivery", description: "Same-day delivery in your city.", bannerColor: "bg-gradient-to-r from-green-500 to-teal-600" },
      { title: "Freight Forwarding", description: "Manage bulk shipments with ease.", bannerColor: "bg-gradient-to-r from-orange-500 to-red-600" },
    ],
  },
  {
    category: "Warehousing & Fulfillment",
    products: [
      { title: "Inventory Management", description: "Track your stock in real-time.", bannerColor: "bg-gradient-to-r from-cyan-500 to-blue-600" },
      { title: "Order Fulfillment", description: "Automate your order processing.", bannerColor: "bg-gradient-to-r from-rose-500 to-pink-600" },
      { title: "Returns Management", description: "Handle returns effortlessly.", bannerColor: "bg-gradient-to-r from-amber-500 to-yellow-600" },
      { title: "Custom Packaging", description: "Branded packaging for your products.", bannerColor: "bg-gradient-to-r from-lime-500 to-green-600" },
    ],
  },
  {
    category: "Technology & Integrations",
    products: [
      { title: "Shopify Integration", description: "Connect your Shopify store seamlessly.", bannerColor: "bg-gradient-to-r from-green-400 to-blue-500" },
      { title: "WooCommerce Integration", description: "Integrate with your WooCommerce site.", bannerColor: "bg-gradient-to-r from-purple-400 to-indigo-500" },
      { title: "API Integration", description: "Build custom solutions with our API.", bannerColor: "bg-gradient-to-r from-gray-700 to-gray-900" },
      { title: "Analytics Dashboard", description: "Get insights into your performance.", bannerColor: "bg-gradient-to-r from-red-500 to-orange-500" },
    ],
  },
  {
    category: "Value-Added Services",
    products: [
        { title: "Early COD Remittance", description: "Get your cash on delivery payments faster.", bannerColor: "bg-gradient-to-r from-blue-500 to-indigo-600" },
        { title: "Insurance Coverage", description: "Secure your shipments against all risks.", bannerColor: "bg-gradient-to-r from-purple-500 to-pink-600" },
        { title: "Customer Support", description: "24/7 support for you and your customers.", bannerColor: "bg-gradient-to-r from-green-500 to-teal-600" },
        { title: "Marketing Tools", description: "Promote your products and grow your business.", bannerColor: "bg-gradient-to-r from-orange-500 to-red-600" },
    ],
  },
  {
    category: "Financial Services",
    products: [
      { title: "Business Loans", description: "Get funding to grow your business.", bannerColor: "bg-gradient-to-r from-cyan-500 to-blue-600" },
      { title: "Payment Gateway", description: "Accept payments from multiple channels.", bannerColor: "bg-gradient-to-r from-rose-500 to-pink-600" },
      { title: "Invoice Discounting", description: "Get cash for your unpaid invoices.", bannerColor: "bg-gradient-to-r from-amber-500 to-yellow-600" },
      { title: "Expense Management", description: "Track and manage your business expenses.", bannerColor: "bg-gradient-to-r from-lime-500 to-green-600" },
    ],
  },
];

const ProductCard = ({ title, description, bannerColor }: { title: string; description: string; bannerColor: string }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
    <div className={`h-24 ${bannerColor}`} />
    <div className="p-6">
      <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Link to="#" className="text-purple-600 font-semibold group">
        Get Started <span className="group-hover:ml-1 transition-all">→</span>
      </Link>
    </div>
  </div>
);

const AllProducts = () => {
  return (
    <div className="space-y-12 bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-xl">
      <header className="text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-3">All Products</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore our comprehensive suite of tools and services designed to help you grow your business.
        </p>
      </header>

      {productCategories.map((category) => (
        <section key={category.category}>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{category.category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {category.products.map((product) => (
              <ProductCard key={product.title} {...product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default AllProducts;
