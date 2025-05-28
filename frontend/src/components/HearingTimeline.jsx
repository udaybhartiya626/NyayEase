import React from 'react';
import { Card, Badge, Button, ListGroup, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import hearingService from '../services/hearingService';
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const HearingTimeline = ({ hearings, caseId, onHearingUpdated }) => {
  const { user } = useAuth();

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'primary',
      'in-progress': 'warning',
      completed: 'success',
      adjourned: 'secondary',
      cancelled: 'danger'
    };
    return <Badge bg={colors[status]}>{status}</Badge>;
  };

  const getTypeBadge = (type) => {
    const colors = {
      physical: 'success',
      virtual: 'primary'
    };
    return <Badge bg={colors[type]}>{type}</Badge>;
  };

  const handleJoinMeeting = (virtualLink) => {
    window.open(virtualLink, '_blank');
  };

  const hearingsByDate = {};
  hearings.forEach(hearing => {
    const date = new Date(hearing.date).toLocaleDateString('en-IN');
    if (!hearingsByDate[date]) {
      hearingsByDate[date] = [];
    }
    hearingsByDate[date].push(hearing);
  });

  const navigate = useNavigate();

  const handleEditHearing = (hearing) => {
    // Navigate to the edit hearing page with the hearing ID
    navigate(`/dashboard/hearings/edit/${hearing._id}`);
  };

  const handleDeleteHearing = async (hearingId) => {
    if (window.confirm('Are you sure you want to delete this hearing? This action cannot be undone.')) {
      try {
        await hearingService.deleteHearing(hearingId);
        toast.success('Hearing deleted successfully');
        // Refresh the parent component to update the hearing list
        if (onHearingUpdated) {
          onHearingUpdated();
        }
      } catch (error) {
        console.error('Error deleting hearing:', error);
        toast.error(error.response?.data?.message || 'Failed to delete hearing');
      }
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Hearing Timeline</h5>
      </Card.Header>
      <Card.Body>
        {Object.entries(hearingsByDate).map(([date, hearings]) => (
          <div key={date} className="mb-3">
            <h6 className="text-muted mb-2">{date}</h6>
            <ListGroup>
              {hearings.map(hearing => (
                <ListGroup.Item key={hearing._id} className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center">
                      {getTypeBadge(hearing.type)}
                      <span className="ms-2">
                        {new Date(hearing.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-muted small">
                      {hearing.location.courtRoom || hearing.location.virtualLink}
                    </div>
                    {hearing.notes && (
                      <div className="text-muted small mt-1">
                        {hearing.notes}
                      </div>
                    )}
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="me-2">
                      {getStatusBadge(hearing.status)}
                    </div>
                    {user.role === 'court-officer' && hearing.status !== 'cancelled' && (
                      <div className="ms-2">
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm" id="hearing-actions">
                          <FiMoreVertical />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEditHearing(hearing)}>
                            <FiEdit2 className="me-2" /> Edit
                          </Dropdown.Item>
                          <Dropdown.Item 
                            className="text-danger" 
                            onClick={() => handleDeleteHearing(hearing._id)}
                          >
                            <FiTrash2 className="me-2" /> Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                      </div>
                    )}
                  </div>
                  {hearing.type === 'virtual' && hearing.location.virtualLink && (
                    <Button
                      variant="success"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleJoinMeeting(hearing.location.virtualLink)}
                    >
                      Join Meeting
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        ))}
        
        {user.role === 'court-officer' && (
          <Button
            variant="primary"
            className="mt-3"
            onClick={() => {
              // Open schedule modal
            }}
          >
            Schedule New Hearing
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default HearingTimeline;
