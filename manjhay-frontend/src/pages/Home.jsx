import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Star, ArrowRight, Award, Users, Plus } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Wide Selection',
      description: 'Discover our collection of comfortable and stylish slippers for every occasion.'
    },
    {
      icon: Truck,
      title: 'Nationwide Delivery',
      description: 'We deliver across all 16 regions of Ghana with flexible shipping arrangements.'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'Pay safely via Mobile Money with manual verification for your security.'
    },
    {
      icon: Star,
      title: 'Quality Guaranteed',
      description: 'Premium quality slippers designed for comfort and durability.'
    }
  ];

  const testimonials = [
    {
      name: 'Kwame Asante',
      location: 'Accra',
      comment: 'The most comfortable slippers I\'ve ever owned! Perfect for Ghanaian weather.',
      rating: 5
    },
    {
      name: 'Ama Serwaa',
      location: 'Kumasi',
      comment: 'Fast delivery and excellent customer service. Will definitely order again!',
      rating: 5
    },
    {
      name: 'Kofi Mensah',
      location: 'Takoradi',
      comment: 'Great quality and the prices are very reasonable. Highly recommended!',
      rating: 4
    }
  ];

  const stats = [
    { number: '100+', label: 'Happy Customers' },
    { number: '16', label: 'Regions Served' },
    { number: '98%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Customer Support' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative bg-gradient-to-r from-[#f97316] to-[#CE1126] text-white py-24 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/40 to-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Step Into <span className="text-[#FCD116]">Comfort</span> with ManJhay
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-orange-100 leading-relaxed">
                Ghana's Premium Slipper Destination - Where Style Meets Comfort
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center bg-[#FCD116] text-[#CE1126] px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 text-lg shadow-lg"
                >
                  <ShoppingBag size={24} className="mr-3" />
                  Shop Collection
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#CE1126] transition-all duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>
            
            {/* Hero Image - Updated to Available Male Slipper */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-br from-[#FCD116] to-[#f97316] rounded-2xl p-8 text-center">
                  <div className="bg-white rounded-xl p-6 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                      alt="Premium Male Slippers"
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                    <div className="mt-4 flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={20} className="fill-[#FCD116] text-[#FCD116]" />
                      ))}
                    </div>
                    <p className="text-gray-600 mt-2 font-semibold">Rated 4.9/5 by Customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-[#CE1126] mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why <span className="text-[#f97316]">ManJhay</span> Stands Out
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine traditional craftsmanship with modern comfort to bring you the perfect footwear experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group text-center p-8 bg-gradient-to-b from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-105 border border-gray-100"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <feature.icon size={36} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-[#f97316]/10 to-[#CE1126]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Experience The <span className="text-[#f97316]">Difference</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our slippers are carefully crafted to provide unmatched comfort and style. 
                Designed specifically for the Ghanaian climate and lifestyle, they offer the 
                perfect blend of traditional quality and modern design.
              </p>
              <div className="space-y-4">
                {[
                  'Premium materials for long-lasting durability',
                  'Ergonomic design for all-day comfort',
                  'Perfect for home, office, and casual outings',
                  'Available in various sizes and styles'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-[#006B3F] rounded-full flex items-center justify-center mr-3">
                      <Star size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Comfortable Slippers Lifestyle"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied customers across Ghana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={20} 
                      className={i < testimonial.rating ? "fill-[#FCD116] text-[#FCD116]" : "text-gray-300"} 
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.comment}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Product Section */}
      <section className="py-20 bg-gradient-to-r from-[#006B3F] to-[#009B4D] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12">
            <Plus size={64} className="mx-auto mb-6 text-[#FCD116]" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
              We're constantly expanding our collection! Request a custom product and we'll help you find or create exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/request-product"
                className="bg-[#FCD116] text-[#006B3F] px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
              >
                Request Custom Product
              </Link>
              <Link
                to="/products"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#006B3F] transition-all duration-300"
              >
                Browse Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#CE1126] to-[#f97316] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award size={64} className="mx-auto mb-6 text-[#FCD116]" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Experience Ultimate Comfort?
          </h2>
          <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
            Join the ManJhay family today and step into a world of comfort, style, and quality craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-[#FCD116] text-[#CE1126] px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              Start Shopping Now
            </Link>
            <Link
              to="/register"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#CE1126] transition-all duration-300"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;