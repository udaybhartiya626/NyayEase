import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { StarFill, Star } from 'react-bootstrap-icons';
import api from '../services/api';

const Rating = ({ caseId, advocateId, onRatingSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingRating, setExistingRating] = useState(null);

  useEffect(() => {
    // Check if user has already rated this case
    const fetchExistingRating = async () => {
      try {
        const response = await api.get(`/ratings/case/${caseId}`);
        
        if (response.data.data) {
          setExistingRating(response.data.data);
          setRating(response.data.data.rating);
          setReview(response.data.data.review || '');
        }
      } catch (err) {
        // It's okay if no rating exists yet
        if (err.response?.status !== 404) {
          console.error('Error fetching existing rating:', err);
        }
      }
    };

    fetchExistingRating();
  }, [caseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/ratings', {
        caseId,
        advocateId,
        rating,
        review: review || undefined
      });

      if (response.data.success) {
        setExistingRating(response.data.data);
        if (onRatingSubmit) {
          onRatingSubmit(response.data.data);
        }
      } else {
        setError(response.data.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      setError(err.response?.data?.message || 'An error occurred while submitting your rating');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (existingRating) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your Rating</h3>
        <p className="text-gray-600 mb-3">Thank you for your feedback!</p>
        
        <div className="flex items-center">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-2xl ${i < existingRating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                {i < existingRating.rating ? <StarFill /> : <Star />}
              </span>
            ))}
          </div>
          <span className="ml-2 text-gray-700">{existingRating.rating} stars</span>
        </div>
        
        {existingRating.review && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-gray-700 italic">"{existingRating.review}"</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Your Experience</h3>
      
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="rating" className="mb-4">
          <Form.Label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your experience with this advocate?
          </Form.Label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-2xl ${(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                {star <= (hover || rating) ? <StarFill /> : <Star />}
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating === 0 ? 'Select a rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
            </span>
          </div>
        </Form.Group>
        
        <Form.Group controlId="review" className="mb-4">
          <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
            Write a review (optional)
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share details about your experience with this advocate..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </Form.Group>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Rating;
