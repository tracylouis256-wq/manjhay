import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const ringSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-18 h-18',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      {/* Main Spinner Container */}
      <div className="relative">
        {/* Outer Pulsing Ring */}
        <div className={`absolute inset-0 ${ringSizeClasses[size]} border-4 border-orange-100 rounded-full animate-ping`}></div>
        
        {/* Main Spinning Ring */}
        <div
          className={`${sizeClasses[size]} border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin relative z-10`}
          style={{
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
          }}
        ></div>
        
        {/* Inner Glow */}
        <div
          className={`absolute inset-1/4 ${size === 'sm' ? 'w-2 h-2' : 'w-4 h-4'} bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse`}
          style={{
            filter: 'blur(2px)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        ></div>
        
        {/* Floating Shopping Bag Icon (Subtle) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} text-orange-600 opacity-70 animate-bounce`}
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ animationDuration: '2s' }}
          >
            <path
              fillRule="evenodd"
              d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Alternative Ecommerce-themed Spinner Variants
export const ProductCardSpinner = () => (
  <div className="flex flex-col items-center space-y-3">
    <div className="relative">
      {/* Product Card Simulation */}
      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg shadow-lg animate-pulse">
        {/* Product Image Placeholder */}
        <div className="absolute inset-2 bg-gradient-to-r from-orange-200 to-amber-200 rounded animate-pulse"></div>
      </div>
      
      {/* Loading Dots */}
      <div className="flex space-x-1 mt-3">
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

export const ShoppingCartSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="relative">
      {/* Cart Icon */}
      <svg className="w-8 h-8 text-orange-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21" />
      </svg>
      
      {/* Spinning Ring Around Cart */}
      <div className="absolute -inset-2 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
      
      {/* Floating Item */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-ping"></div>
    </div>
  </div>
);

export const BarcodeScannerSpinner = () => (
  <div className="flex flex-col items-center space-y-2">
    {/* Barcode Lines */}
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((width, index) => (
        <div
          key={index}
          className="bg-gradient-to-b from-orange-400 to-amber-500 rounded-sm animate-pulse"
          style={{
            width: `${width * 2}px`,
            height: '20px',
            animationDelay: `${index * 0.1}s`,
            animationDuration: '1.5s'
          }}
        ></div>
      ))}
    </div>
    
    {/* Scanning Line */}
    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full animate-scan" 
         style={{ animation: 'scan 1.5s ease-in-out infinite' }}></div>
  </div>
);

// CSS for custom animations (add to your global CSS)
const spinnerStyles = `
@keyframes scan {
  0% { transform: translateY(-10px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(10px); opacity: 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.animate-float {
  animation: float 2s ease-in-out infinite;
}

.animate-scan {
  animation: scan 1.5s ease-in-out infinite;
}
`;

// Usage example component
export const LoadingSpinnerDemo = () => (
  <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Ecommerce Loading Spinners</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Default Spinner */}
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <h3 className="font-semibold text-gray-800 mb-4">Default Spinner</h3>
          <LoadingSpinner size="lg" />
        </div>
        
        {/* Product Card Spinner */}
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <h3 className="font-semibold text-gray-800 mb-4">Product Loading</h3>
          <ProductCardSpinner />
        </div>
        
        {/* Shopping Cart Spinner */}
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <h3 className="font-semibold text-gray-800 mb-4">Cart Processing</h3>
          <ShoppingCartSpinner />
        </div>
        
        {/* Barcode Scanner Spinner */}
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <h3 className="font-semibold text-gray-800 mb-4">Scanning Items</h3>
          <BarcodeScannerSpinner />
        </div>
      </div>
      
      {/* Size Variations */}
      <div className="mt-12 bg-white p-6 rounded-xl shadow-lg">
        <h3 className="font-semibold text-gray-800 mb-6 text-center">Size Variations</h3>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600 mt-2">Small</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-600 mt-2">Medium</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 mt-2">Large</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="xl" />
            <p className="text-sm text-gray-600 mt-2">Extra Large</p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Add the styles to document head */}
    <style>{spinnerStyles}</style>
  </div>
);

export default LoadingSpinner;