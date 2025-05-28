import React, { useState, useEffect } from 'react';
import { Button, Modal, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import hearingService from '../services/hearingService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const HearingStatusUpdater = ({ hearing, onStatusUpdated }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState(null);
  const [canUpdateStatus, setCanUpdateStatus] = useState(false);
  const { user } = useAuth();

  // Check if the hearing time has passed
  useEffect(() => {
    const checkHearingTime = () => {
      const hearingEndTime = new Date(hearing.date);
      hearingEndTime.setMinutes(hearingEndTime.getMinutes() + (hearing.duration || 30));
      setCanUpdateStatus(new Date() > hearingEndTime);
    };
    
    checkHearingTime();
    const interval = setInterval(checkHearingTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [hearing.date, hearing.duration]);

  // Only show for court officers and only if the hearing isn't already completed or cancelled
  if (user.role !== 'court-officer' || 
      hearing.status === 'completed' || 
      hearing.status === 'cancelled') {
    return null;
  }
  
  // Check if the update button should be disabled
  const isDisabled = !canUpdateStatus || 
    hearing.status === 'completed' || 
    hearing.status === 'cancelled';
    
  // If hearing is cancelled, don't allow any updates
  if (hearing.status === 'cancelled') {
    return null;
  }

  const statusOptions = [
    { value: 'adjourned', label: 'Adjourn Hearing' },
    { value: 'waiting-decision', label: 'Waiting for Decision' },
    { value: 'completed', label: 'Mark as Completed' },
    { value: 'cancelled', label: 'Cancel Hearing' }
  ].filter(option => {
    // Filter out invalid status transitions
    const currentStatus = hearing.status;
    
    // Define valid transitions for each status (matching backend validation)
    const statusTransitions = {
      'scheduled': ['cancelled'],  // 'in-progress' is set automatically
      'in-progress': ['waiting-decision', 'adjourned', 'cancelled'],
      'waiting-decision': ['completed', 'adjourned', 'cancelled'],
      'adjourned': ['waiting-decision', 'cancelled'],  // Can't go back to scheduled
      'completed': [],
      'cancelled': []
    };
    
    // If current status is not in our transitions, allow all options
    if (!statusTransitions[currentStatus]) return true;
    
    return statusTransitions[currentStatus].includes(option.value);
  });

  const getStatusVariant = (status) => {
    const variants = {
      'scheduled': 'primary',
      'in-progress': 'info',
      'adjourned': 'warning',
      'waiting-decision': 'info',
      'completed': 'success',
      'cancelled': 'danger',
      'rejected': 'danger',
      'pending-approval': 'secondary',
      'payment-requested': 'info',
      'approved': 'primary'
    };
    return variants[status] || 'secondary';
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    setLoading(true);
    setError('');
    
    try {
      // If status is adjourned, update the existing hearing with new date
      if (selectedStatus === 'adjourned') {
        if (!nextHearingDate) {
          setError('Please select a date for the adjourned hearing');
          setLoading(false);
          return;
        }
        
        // Update the existing hearing with new date and status
        await hearingService.updateHearing(hearing._id, {
          date: nextHearingDate,
          duration: hearing.duration || 30,
          status: 'adjourned',
          notes: hearing.notes ? 
            `${hearing.notes}\nAdjourned to ${new Date(nextHearingDate).toLocaleDateString()}` : 
            `Adjourned to ${new Date(nextHearingDate).toLocaleDateString()}`
        });
      } else {
        // For other status updates
        await hearingService.updateHearingStatus(hearing._id, { status: selectedStatus });
      }
      
      onStatusUpdated();
      setShowModal(false);
      setShowNextHearingModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hearing status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline-secondary" 
        size="sm" 
        className="ms-2"
        onClick={() => setShowModal(true)}
        disabled={isDisabled}
        title={isDisabled ? (hearing.status === 'completed' ? 'Cannot update status of completed hearing' : 'Cannot update status until hearing time has passed') : ''}
      >
        Update Status
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Hearing Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p>Current status: <span className={`badge bg-${getStatusVariant(hearing.status)}`}>
            {hearing.status.replace('-', ' ')}
          </span></p>
          
          <div className="mb-3">
            <label className="form-label">Change status to:</label>
            <select 
              className="form-select" 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Select status...</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selectedStatus === 'adjourned' && (
            <div className="mt-3">
              <div className="mb-3">
                <label className="form-label">New Hearing Date and Time</label>
                <DatePicker
                  selected={nextHearingDate}
                  onChange={(date) => setNextHearingDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="form-control"
                  minDate={new Date()}
                  placeholderText="Select new date and time"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Duration (minutes)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={hearing.duration || 30}
                  disabled
                  min="1"
                  max="240"
                />
                <small className="text-muted">Duration cannot be changed when adjourning</small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || (selectedStatus === 'adjourned' && !nextHearingDate) || loading}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HearingStatusUpdater;
