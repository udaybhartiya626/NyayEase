import React from 'react';
import { FaStar } from 'react-icons/fa';

const StarRating = ({ ratingCount, rating, showCount = true }) => {
  // Determine the color based on the rating
  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-500'; // Green for 4+ stars
    if (rating >= 3) return 'text-yellow-500'; // Yellow for 3-3.9 stars
    if (rating >= 2) return 'text-orange-500'; // Orange for 2-2.9 stars
    return 'text-red-500'; // Red for below 2 stars
  };

  const ratingColor = getRatingColor(rating);
  const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal place

  return (
    <div className="flex items-center">
      <div className={`flex ${ratingColor}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-4 h-4 ${star <= Math.round(rating) ? 'fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
      {showCount && (
        <span className="ml-1 text-sm text-gray-600">
          ({roundedRating} • {ratingCount === 1 ? '1 review' : `${ratingCount} reviews`})
        </span>
      )}
    </div>
  );
};

export default StarRating;
