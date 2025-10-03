import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'User avatar', 
  className = 'h-8 w-8 rounded-full',
  fallback = '/default-avatar.svg'
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallback);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  // Check if the src contains placeholder or is invalid
  const isValidSrc = src && 
    !src.includes('placeholder') && 
    !src.includes('via.placeholder') &&
    (src.startsWith('http') || src.startsWith('/'));

  return (
    <img
      src={isValidSrc ? src : fallback}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};
