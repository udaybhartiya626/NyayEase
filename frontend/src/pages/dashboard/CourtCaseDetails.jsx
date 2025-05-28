import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import caseService from '../../services/caseService';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Table } from 'react-bootstrap';
import HearingScheduleModal from '../../components/HearingScheduleModal';
import Rating from '../../components/Rating';
import { format } from 'date-fns';

const CourtCaseDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHearingModal, setShowHearingModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCaseDetails();
  }, [params.caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await caseService.getCourtCase(params.caseId);
      console.log('Case data:', response.data);
      setCaseData(response.data);
    } catch (error) {
      console.error('Error fetching case details:', error);
      setError('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading case details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  // Debug: Log the case data structure
  console.log('Case Data:', caseData);
  console.log('Hearings:', caseData.hearings);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Case Details</h2>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate('/dashboard/pending-cases')}
            className="mb-3"
          >
            Back to Pending Cases
          </Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <h3 className="mb-3">Case Information</h3>
              <div className="mb-3">
                <strong>Case Number:</strong> {caseData.caseNumber}
              </div>
              <div className="mb-3">
                <strong>Title:</strong> {caseData.title}
              </div>
              <div className="mb-3">
                <strong>Status:</strong> {' '}
                <Badge 
                  bg={{
                    'pending-approval': 'secondary',
                    'payment-requested': 'info',
                    'approved': 'primary',
                    'rejected': 'danger',
                    'in-progress': 'info',
                    'scheduled-hearing': 'primary',
                    'adjourned': 'warning',
                    'resolved': 'success',
                    'closed': 'secondary'
                  }[caseData.status] || 'secondary'}
                  className="text-capitalize"
                >
                  {caseData.status.replace(/-/g, ' ')}
                </Badge>
              </div>
              <div className="mb-3">
                <strong>Filed By:</strong> {caseData.litigant?.name}
              </div>
              <div className="mb-3">
                <strong>Advocate:</strong> {caseData.advocates[0]?.name}
              </div>
              <div className="mb-3">
                <strong>Case Type:</strong> {caseData.caseType}
              </div>
              <div className="mb-3">
                <strong>Filing Date:</strong> {new Date(caseData.filingDate).toLocaleDateString()}
              </div>
              <div className="mb-3">
                <strong>Next Hearing:</strong> {caseData.nextHearing ? new Date(caseData.nextHearing).toLocaleString() : 'No hearing scheduled'}
              </div>
              <div className="mb-3">
                <strong>Description:</strong> {caseData.description}
              </div>
            </div>
            <div className="col-md-6">
              
              {caseData.status !== 'pending-approval' && caseData.status !== 'completed' && caseData.status !== 'payment-requested' && (
                <>
                <h3 className="mb-3">Case Actions</h3>
                  <div className="mb-3">
                    <Button
                      variant="primary"
                      onClick={() => setShowHearingModal(true)}
                    >
                      Schedule Hearing
                    </Button>
                  </div>
                  <div className="mb-3">
                    <Button
                      variant="outline-primary"
                      onClick={() => navigate(`/dashboard/case-management/${caseData._id}`)}
                    >
                      Manage Case
                    </Button>
                  </div>
                </>
              )}
              {caseData.status === 'pending-approval' && (
                <div className="alert alert-info">
                  Case must be approved before scheduling hearings or managing case details
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Hearings Section */}
      <Card className="mt-4">
        <Card.Body>
          <h3 className="mb-4">Hearings</h3>
          {caseData.hearings && Array.isArray(caseData.hearings) && caseData.hearings.filter(h => h && typeof h === 'object' && h.date).length > 0 ? (
            <Table striped hover>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {caseData.hearings
                  .filter(h => h && typeof h === 'object' && h.date) // Filter out invalid hearings
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                  .map((hearing) => {
                    // Safely access properties with fallbacks
                    const hearingDate = new Date(hearing.date);
                    const hearingType = hearing.type || 'physical';
                    const hearingStatus = hearing.status || 'scheduled';
                    const hearingLocation = hearing.location || {};
                  
                  return (
                    <tr key={hearing._id}>
                      <td>
                        {hearingDate.toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <Badge bg={hearingType === 'virtual' ? 'primary' : 'success'}>                          
                          {hearingType === 'virtual' ? 'Virtual' : 'Physical'}
                        </Badge>
                      </td>
                      <td>
                        <Badge 
                          bg={
                            hearingStatus === 'completed' ? 'success' :
                            hearingStatus === 'scheduled' ? 'primary' :
                            hearingStatus === 'cancelled' ? 'danger' :
                            hearingStatus === 'in-progress' ? 'warning' :
                            'secondary'
                          }
                        >
                          {hearingStatus.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td>
                        {hearingType === 'virtual' ? (
                          hearingLocation.virtualLink ? (
                            <a 
                              href={hearingLocation.virtualLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              <i className="bi bi-camera-video me-1"></i>
                              Join Virtual Hearing
                            </a>
                          ) : (
                            <span className="text-muted">Virtual link not available</span>
                          )
                        ) : (
                          <>
                            <i className="bi bi-geo-alt me-1"></i>
                            {hearingLocation.address || 'Location not specified'}
                            {hearingLocation.courtRoom && ` (${hearingLocation.courtRoom})`}
                          </>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="text-center py-4">
            <div className="mb-3">
              <i className="bi bi-calendar-x fs-1 text-muted"></i>
              <p className="mt-2">No hearings scheduled yet.</p>
              {caseData.status !== 'pending-approval' && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowHearingModal(true)}
                  className="mt-2"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Schedule Hearing
                </Button>
              )}
            </div>
          </div>
        )}
        </Card.Body>
      </Card>

      {/* Hearing Schedule Modal */}
      <HearingScheduleModal
        show={showHearingModal}
        onClose={() => setShowHearingModal(false)}
        caseId={caseData?._id}
        onHearingUpdated={() => {
          fetchCaseDetails();
        }}
      />

      {/* Rating Section for Completed Cases - Only for Litigants */}
      {user.role === 'litigant' && (caseData.status === 'resolved' || caseData.status === 'closed') && caseData.advocate && (
        <Card className="mt-4">
          <Card.Body>
            <h4>Rate Your Advocate</h4>
            <p className="text-muted">
              Share your experience with your advocate to help others.
            </p>
            <Rating 
              caseId={caseData._id} 
              advocateId={caseData.advocate._id}
              onRatingSubmit={() => {
                // Refresh case data after rating
                fetchCaseDetails();
              }}
            />
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CourtCaseDetails;
