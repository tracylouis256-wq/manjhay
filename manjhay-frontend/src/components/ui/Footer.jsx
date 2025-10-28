import React from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-ghana-red rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold">ManJhay</span>
            </div>
            <p className="text-gray-300 mb-4">
              Your premium destination for quality slippers in Ghana. 
              We bring comfort and style to your footsteps.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Phone size={16} />
                <span>0257965652</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} />
                <span>info@manjhay.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Accra, Ghana</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <a href="/products" className="block hover:text-white transition-colors">Products</a>
              <a href="/about" className="block hover:text-white transition-colors">About Us</a>
              <a href="/contact" className="block hover:text-white transition-colors">Contact</a>
              <a href="/shipping" className="block hover:text-white transition-colors">Shipping Info</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 ManJhay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;