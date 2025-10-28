import React from 'react';
import { X } from 'lucide-react';

const ImageModal = ({ image, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>
        <img
          src={image.url}
          alt="Enlarged view"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

export default ImageModal;