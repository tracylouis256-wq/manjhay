import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Target, 
  Users, 
  Award, 
  Globe, 
  CheckCircle,
  ArrowLeft,
  Shield,
  Truck,
  Clock,
  Star,
  Package
} from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We prioritize your comfort and satisfaction above all else.'
    },
    {
      icon: Target,
      title: 'Quality Focus',
      description: 'Every pair is crafted with attention to detail and premium materials.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Supporting local craftsmanship and creating opportunities in Ghana.'
    },
    {
      icon: Globe,
      title: 'Nationwide Reach',
      description: 'Bringing quality footwear to every corner of Ghana.'
    }
  ];

  const milestones = [
    { 
      year: '2020', 
      event: 'ManJhay Founded', 
      description: 'Started with a vision to provide comfortable footwear',
      icon: '🎯'
    },
    { 
      year: '2021', 
      event: 'First 100 Customers', 
      description: 'Reached our first major customer milestone',
      icon: '👥'
    },
    { 
      year: '2022', 
      event: 'National Expansion', 
      description: 'Expanded delivery to all 16 regions of Ghana',
      icon: '🗺️'
    },
    { 
      year: '2023', 
      event: '100+ Happy Customers', 
      description: 'Celebrated serving over 200 satisfied customers',
      icon: '🎉'
    },
    { 
      year: '2024', 
      event: 'Quality Excellence', 
      description: 'Achieved 97% customer satisfaction rate',
      icon: '⭐'
    }
  ];

  const teamStats = [
    { number: '50+', label: 'Styles Available', icon: Package },
    { number: '16', label: 'Regions Served', icon: Truck },
    { number: '100+', label: 'Happy Customers', icon: Users },
    { number: '97%', label: 'Satisfaction Rate', icon: Star }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Quality Guarantee',
      description: 'All our slippers come with a satisfaction guarantee'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery across Ghana'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer service'
    },
    {
      icon: Award,
      title: 'Premium Materials',
      description: 'Only the finest materials for ultimate comfort'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="relative bg-gradient-to-r from-[#f97316] to-[#CE1126] text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/40 to-black/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#FCD116] rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#006B3F] rounded-full opacity-20 animate-bounce"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              Our Story
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
              From a simple idea to Ghana's favorite slipper destination - 
              discover the journey behind ManJhay's commitment to comfort and quality.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our <span className="text-[#f97316]">Mission</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At ManJhay, we believe that everyone deserves to experience ultimate comfort in their daily lives. 
                Our mission is to provide premium quality slippers that combine traditional craftsmanship with modern design, 
                making comfort accessible to every Ghanaian.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We're not just selling slippers; we're delivering moments of relaxation, confidence, and pure comfort 
                to homes and workplaces across Ghana.
              </p>
              <div className="space-y-3">
                {[
                  'Premium materials sourced for durability and comfort',
                  'Traditional craftsmanship meets modern design',
                  'Nationwide delivery across all 16 regions',
                  'Customer satisfaction guaranteed',
                  'Supporting local Ghanaian artisans',
                  'Eco-friendly packaging and practices'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle size={20} className="text-[#006B3F] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[#FCD116] to-[#f97316] rounded-2xl p-2 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                  <div className="w-full h-96 bg-gradient-to-br from-[#f97316]/20 to-[#CE1126]/20 rounded-xl flex items-center justify-center mb-6">
                    <div className="text-center">
                      <Award size={64} className="mx-auto text-[#f97316] mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Quality Craftsmanship</h3>
                      <p className="text-gray-600">Every pair tells a story of dedication and excellence</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 italic">
                      "Crafting comfort, one step at a time"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-r from-[#f97316]/10 to-[#CE1126]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-[#f97316]">Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do at ManJhay
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-105"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <value.icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {teamStats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={28} className="text-white" />
                </div>
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

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-[#f97316]">Journey</span>
            </h2>
            <p className="text-xl text-gray-600">
              Milestones that shaped ManJhay into what it is today
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-[#f97316] h-full"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                      <div className="text-2xl font-bold text-[#CE1126] mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {milestone.event}
                      </h3>
                      <p className="text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-[#f97316] rounded-full border-4 border-white shadow-lg"></div>
                  
                  {/* Empty space for the other side */}
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#CE1126] to-[#f97316] text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#FCD116] rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#006B3F] rounded-full"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users size={64} className="mx-auto mb-6 text-[#FCD116]" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join Our Growing Family
          </h2>
          <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
            Experience the ManJhay difference and become part of our story. 
            Discover why thousands of Ghanaians trust us for their comfort needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-[#FCD116] text-[#CE1126] px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg inline-flex items-center justify-center"
            >
              Shop Our Collection
            </Link>
            <Link
              to="/"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[#CE1126] transition-all duration-300 inline-flex items-center justify-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;