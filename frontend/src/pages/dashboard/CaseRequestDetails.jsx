import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import caseRequestService from '../../services/caseRequestService';
import { toast } from 'react-toastify';
import PaymentSimulation from '../../components/PaymentSimulation';
import PaymentRequestModal from '../../components/PaymentRequestModal/PaymentRequestModal';

const CaseRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseRequest, setCaseRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const fetchCaseRequest = async () => {
      try {
        const response = await caseRequestService.getCaseRequest(id);
        setCaseRequest(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch case request');
        toast.error(err.response?.data?.error || 'Failed to fetch case request');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseRequest();
  }, [id]);

  const handleRespond = async (response) => {
    try {
      const data = await caseRequestService.respondToCaseRequest(id, { response });
      setCaseRequest(data.data);
      toast.success(`Case request ${response}d successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${response} case request`);
    }
  };

  const handlePaymentRequest = async (paymentDetails) => {
    try {
      // Update case request with payment details
      const updatedCaseRequest = {
        ...caseRequest,
        paymentAmount: paymentDetails.amount,
        paymentMethod: paymentDetails.paymentMethod,
        paymentStatus: 'requested',
        paymentRequestedAt: new Date().toISOString()
      };

      // Update locally first
      setCaseRequest(updatedCaseRequest);

      // Then update server
      await caseRequestService.updateCaseRequest(id, {
        paymentAmount: paymentDetails.amount,
        paymentMethod: paymentDetails.paymentMethod,
        paymentStatus: 'requested',
        paymentRequestedAt: new Date().toISOString()
      });

      toast.success('Payment request sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send payment request');
      throw err; // Re-throw to show error in modal
    }
  };

  const handlePaymentComplete = async (paymentDetails) => {
    try {
      // Update case request with payment details
      const updatedCaseRequest = {
        ...caseRequest,
        paymentStatus: 'completed',
        paymentCompletedAt: new Date().toISOString(),
        paymentAmount: paymentDetails.amount
      };

      // Update locally first
      setCaseRequest(updatedCaseRequest);

      // Then update server with proper payment details
      await caseRequestService.updateCaseRequest(id, {
        paymentStatus: 'completed',
        paymentCompletedAt: new Date().toISOString(),
        paymentAmount: paymentDetails.amount
      });

      // Create notification for both parties
      const notificationData = {
        title: 'Payment Processed',
        message: `Payment of ₹${paymentDetails.amount} has been processed for your case "${caseRequest.caseTitle}"`,
        type: 'payment',
        caseId: caseRequest._id,
        caseTitle: caseRequest.caseTitle,
        amount: paymentDetails.amount
      };

      // Send notification to both litigant and advocate
      await api.post('/notifications', {
        ...notificationData,
        userId: caseRequest.litigant._id
      });

      await api.post('/notifications', {
        ...notificationData,
        userId: caseRequest.advocate._id
      });

      toast.success('Payment completed and notifications sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete payment');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!caseRequest) return <div>Case request not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">{caseRequest.caseTitle}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Case Details</h2>
              <p className="text-gray-600 mb-4">{caseRequest.caseDescription}</p>
              <p className="text-gray-600">
                <span className="font-semibold">Status:</span>{' '}
                <span className={`capitalize ${
                  caseRequest.status === 'pending' ? 'text-yellow-600' :
                  caseRequest.status === 'accepted' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {caseRequest.status}
                </span>
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Request Details</h2>
              <p className="text-gray-600">
                <span className="font-semibold">Requested by:</span>{' '}
                {caseRequest.litigant?.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Requested to:</span>{' '}
                {caseRequest.advocate?.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Date:</span>{' '}
                {new Date(caseRequest.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {user.role === 'litigant' && caseRequest.status === 'accepted' && caseRequest.paymentStatus === 'requested' && (
          <div className="mb-6">
            <PaymentSimulation 
              caseRequest={caseRequest}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>
        )}

        {/* Payment Request Button for Advocate */}
        {user.role === 'advocate' && caseRequest.status === 'accepted' && caseRequest.paymentStatus === 'pending' && (
          <div className="mb-6">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Request Payment
            </Button>
          </div>
        )}

        {/* Advocate Response Section */}
        {user.role === 'advocate' && caseRequest.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Respond to Request</h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleRespond('accept')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Accept Request
              </button>
              <button
                onClick={() => handleRespond('reject')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Reject Request
              </button>
            </div>
          </div>
        )}

        {/* Case Link Section */}
        {caseRequest.case && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Associated Case</h2>
            <p className="text-gray-600 mb-4">
              This request is associated with case: {caseRequest.case.caseNumber}
            </p>
            <button
              onClick={() => navigate(`/dashboard/cases/${caseRequest.case._id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Case Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseRequestDetails; 