import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import caseRequestService from '../services/caseRequestService';

const PaymentSimulation = ({ caseRequest, onPaymentComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      // Include payment details in the request
      const response = await caseRequestService.simulatePayment(caseRequest._id, {
        amount: caseRequest.paymentAmount,
        caseId: caseRequest._id
      });
      
      toast.success('Payment processed successfully!');
      
      if (onPaymentComplete) {
        onPaymentComplete(response.data);
      }

      // If there's a case in the response, navigate to it
      if (response.data.case) {
        navigate(`/dashboard/cases/${response.data.case._id}`);
      }
    } catch (error) {
      // Improved error handling
      const errorMessage = error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Failed to process payment';
      console.error('Payment simulation error:', error);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
      <div className="mb-4">
        <p className="text-gray-600">Amount: ₹{caseRequest.paymentAmount}</p>
        <p className="text-gray-600">Status: {caseRequest.paymentStatus || 'Requested'}</p>
      </div>
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isProcessing ? 'Processing Payment...' : 'Simulate Payment'}
      </button>
    </div>
  );
};

export default PaymentSimulation; 