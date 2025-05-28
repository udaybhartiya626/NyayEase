import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import notificationService from '../../services/notificationService';

import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update the local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update all notifications in the local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') {
      return notifications;
    } else if (filter === 'unread') {
      return notifications.filter(notification => !notification.isRead);
    } else if (filter === 'action-required') {
      return notifications.filter(notification => notification.isActionRequired);
    }
    return notifications;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'case-update': (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      'payment': (
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      'document': (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      ),
      'hearing': (
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ),
      'case-request': (
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
      ),
      'case-request-response': (
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    };
    
    return icons[type] || (
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  const handlePayment = async () => {
    try {
      await notificationService.makePayment(selectedNotification._id);
      
      // Update the notification in the local state immediately
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === selectedNotification._id
            ? { 
                ...notification, 
                type: 'payment-completed',
                title: 'Payment Processed',
                message: `Your payment of ₹${notification.paymentDetails?.amount || ''} has been processed successfully.`,
                isActionRequired: false
              }
            : notification
        )
      );
      
      setShowPaymentModal(false);
      toast.success('Payment processed successfully');
    } catch (error) {
      console.error('Error making payment:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const filteredNotifications = getFilteredNotifications();

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600">Stay updated with case activities and alerts</p>
        </div>
        
        {notifications.some(notification => !notification.isRead) && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {/* Filter tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setFilter('all')}
            className={`mr-8 py-4 text-sm font-medium ${
              filter === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`mr-8 py-4 text-sm font-medium ${
              filter === 'unread'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('action-required')}
            className={`mr-8 py-4 text-sm font-medium ${
              filter === 'action-required'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Action Required
          </button>
        </nav>
      </div>
      
      {/* Notifications list */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? "You don't have any notifications yet." 
              : filter === 'unread' 
              ? "You don't have any unread notifications." 
              : "You don't have any notifications that require action."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                notification.isRead 
                  ? 'border-gray-200' 
                  : 'border-indigo-500'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm font-medium ${notification.isRead ? 'text-gray-900' : 'text-indigo-600'}`}>
                      {notification.title}
                    </h3>
                    <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <div className="mt-3 flex items-center">
                    {notification.type === 'payment' && notification.paymentDetails?.amount && (
                      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Payment Instructions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Payment Details</h3>
                  <p className="mt-1 text-gray-600">Amount: ₹{notification.paymentDetails.amount}</p>
                </div>
                <div>
                  <h3 className="font-medium">Simulated Payment</h3>
                  <p className="mt-1 text-gray-600">This is a simulated payment system. Click the "Make Payment" button to confirm the payment.</p>
                </div>
              </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handlePayment} className='text-white'>
            Make Payment
          </Button>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
                    )}
                    {notification.type === 'payment' && notification.paymentDetails?.amount && (
                      <Button variant="primary" onClick={() => {
              setSelectedNotification(notification);
              setShowPaymentModal(true);
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-4 text-white">
              Make Payment
            </Button>
                    )}
                    {notification.actionUrl && (
                      <Link 
                        to={notification.actionUrl} 
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mr-4"
                      >
                        View Details
                      </Link>
                    )}
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 