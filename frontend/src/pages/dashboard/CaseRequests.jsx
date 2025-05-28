import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Tabs, Tab, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import caseRequestService from '../../services/caseRequestService';

const CaseRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAction, setResponseAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await caseRequestService.getCaseRequests();
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching case requests:', err);
      setError('Failed to load case requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });

  const handleViewRequest = (requestId) => {
    navigate(`/dashboard/requests/${requestId}`);
  };

  const handleOpenResponseModal = (request, action) => {
    setSelectedRequest(request);
    setResponseAction(action);
    setResponseMessage('');
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedRequest(null);
    setResponseAction('');
    setResponseMessage('');
  };

  const [paymentAmount, setPaymentAmount] = useState('');

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!selectedRequest || !responseAction) return;
    
    try {
      setSubmitting(true);
      
      // For accept action, we need to include payment amount
      const requestData = {
        status: responseAction,
        responseMessage,
        paymentAmount: responseAction === 'accepted' ? paymentAmount : null
      };
      
      await caseRequestService.respondToCaseRequest(selectedRequest._id, requestData);
      
      // Refresh the list
      await fetchRequests();
      
      // Close the modal
      handleCloseResponseModal();
      
      // Show success message with payment status
      if (responseAction === 'accepted') {
        alert(`Case request accepted successfully! Payment amount ₹${paymentAmount} has been requested. Waiting for litigant approval.`);
      } else {
        alert('Case request rejected successfully!');
      }
    } catch (err) {
      console.error('Error responding to case request:', err);
      setError('Failed to process your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    try {
      setIsDeleting(true);
      await caseRequestService.deleteCaseRequest(requestToDelete._id);
      
      // Refresh the list
      await fetchRequests();
      
      // Close the modal
      handleCloseDeleteModal();
    } catch (err) {
      console.error('Error deleting case request:', err);
      setError('Failed to delete case request. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: <Badge bg="warning">Pending</Badge>,
      accepted: <Badge bg="success">Accepted</Badge>,
      rejected: <Badge bg="danger">Rejected</Badge>
    };
    return statusMap[status] || <Badge bg="secondary">Unknown</Badge>;
  };

  const renderRequestCard = (request) => {
    return (
      <Card key={request._id} className="mb-3 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-bold">{request.caseTitle}</span>
            <span className="ms-2">{getStatusBadge(request.status)}</span>
          </div>
          <small className="text-muted">Requested on {formatDate(request.createdAt)}</small>
        </Card.Header>
        
        <Card.Body>
          <div className="mb-3">
            <strong>Case Type:</strong> <span className="text-capitalize">{request.caseType}</span>
          </div>
          <div className="mb-3">
            <strong>Court:</strong> <span className="text-capitalize">{request.court} Court</span>
          </div>
          
          {user.role === 'advocate' && (
            <div className="mb-3">
              <strong>From:</strong> {request.litigant?.name || 'Unknown'} ({request.litigant?.email || 'No email'})
            </div>
          )}
          
          {user.role === 'litigant' && (
            <div className="mb-3">
              <strong>To:</strong> {request.advocate?.name || 'Unknown'} ({request.advocate?.email || 'No email'})
            </div>
          )}
          
          <div className="mb-3">
            <strong>Description:</strong>
            <p className="text-muted mt-1">
              {request.caseDescription.length > 150
                ? `${request.caseDescription.substring(0, 150)}...`
                : request.caseDescription}
            </p>
          </div>
          
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-primary"
              className="me-2"
              onClick={() => handleViewRequest(request._id)}
            >
              View Details
            </Button> 
            
            {user.role === 'advocate' && request.status === 'pending' && (
              <>
                <Button 
                  variant="success"
                  className="me-2"
                  onClick={() => handleOpenResponseModal(request, 'accepted')}
                >
                  Accept
                </Button>
                <Button 
                  variant="danger"
                  onClick={() => handleOpenResponseModal(request, 'rejected')}
                >
                  Reject
                </Button>
              </>
            )}
            
            {user.role === 'litigant' && request.status === 'pending' && (
              <Button 
                variant="outline-danger"
                onClick={() => handleOpenDeleteModal(request)}
              >
                Cancel Request
              </Button>
            )}
            
            {user.role === 'litigant' && request.status === 'rejected' && (
              <Button 
                variant="outline-danger"
                onClick={() => handleOpenDeleteModal(request)}
              >
                Delete Request
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="pending" title="Pending">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div>
              {filteredRequests.map(renderRequestCard)}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No pending case requests found</p>
            </div>
          )}
        </Tab>
        <Tab eventKey="accepted" title="Accepted">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div>
              {filteredRequests.map(renderRequestCard)}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No accepted case requests found</p>
            </div>
          )}
        </Tab>
        <Tab eventKey="rejected" title="Rejected">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div>
              {filteredRequests.map(renderRequestCard)}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No rejected case requests found</p>
            </div>
          )}
        </Tab>
        <Tab eventKey="all" title="All">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div>
              {filteredRequests.map(renderRequestCard)}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No case requests found</p>
            </div>
          )}
        </Tab>
      </Tabs>

      <Modal show={showResponseModal} onHide={handleCloseResponseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{responseAction === 'accepted' ? 'Accept Case Request' : 'Reject Case Request'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitResponse}>
            <Form.Group controlId="responseMessage">
              <Form.Label>Response Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Enter your response..."
              />
            </Form.Group>
            {responseAction === 'accepted' && (
              <div className="mt-3">
                <Form.Group controlId="paymentAmount">
                  <Form.Label>Payment Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                  />
                </Form.Group>
                <Form.Text className="text-muted">
                  The litigant will need to approve this payment amount before the case is officially accepted.
                </Form.Text>
              </div>
            )}
            <div className="mt-3">
              <Button variant="secondary" onClick={handleCloseResponseModal} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={responseAction === 'accepted' ? 'success' : 'danger'}
                disabled={submitting}
                className="ms-2"
              >
                {submitting ? 'Submitting...' : responseAction === 'accepted' ? 'Accept' : 'Reject'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Case Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to {requestToDelete?.status === 'pending' ? 'cancel' : 'delete'} this case request?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            No, Go Back
          </Button>
          <Button 
            variant="danger"
            onClick={handleDeleteRequest}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : requestToDelete?.status === 'pending' ? 'Yes, Cancel Request' : 'Yes, Delete Request'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CaseRequests; 