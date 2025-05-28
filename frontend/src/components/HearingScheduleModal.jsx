import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import hearingService from '../services/hearingService';

const HearingScheduleModal = ({ show, onClose, caseId, hearing, onHearingUpdated }) => {
  const [hearingData, setHearingData] = useState({
    date: new Date().toISOString().slice(0, 16),
    duration: 60,
    type: 'physical',
    location: {
      courtRoom: '',
      address: '',
      virtualLink: ''
    },
    notes: ''
  });

  // Update form data when hearing prop changes (for editing)
  React.useEffect(() => {
    if (hearing) {
      setHearingData({
        date: new Date(hearing.date).toISOString().slice(0, 16),
        duration: hearing.duration || 60,
        type: hearing.type || 'physical',
        location: {
          courtRoom: hearing.location?.courtRoom || '',
          address: hearing.location?.address || '',
          virtualLink: hearing.location?.virtualLink || ''
        },
        notes: hearing.notes || ''
      });
    } else {
      // Reset form when creating a new hearing
      setHearingData({
        date: new Date().toISOString().slice(0, 16),
        duration: 60,
        type: 'physical',
        location: {
          courtRoom: '',
          address: '',
          virtualLink: ''
        },
        notes: ''
      });
    }
  }, [hearing]);

  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user.role !== 'court-officer') {
      toast.error('Only court officers can manage hearings');
      return;
    }

    // Validate hearing date is in the future
    const selectedDate = new Date(hearingData.date);
    const now = new Date();
    
    // Set seconds and milliseconds to 0 for accurate comparison
    selectedDate.setSeconds(0, 0);
    now.setSeconds(0, 0);
    
    if (selectedDate <= now) {
      toast.error('Hearing date must be in the future');
      return;
    }
    if (hearingData.duration < 2 || hearingData.duration > 180) {
      toast.error('time should be between 2 to 180 minutes');
      return;
    }

    const hearingPayload = {
      ...hearingData,
      caseId: caseId || hearing?.case?._id,
      location: {
        courtRoom: hearingData.type === 'physical' ? hearingData.location.courtRoom : '',
        address: hearingData.type === 'physical' ? hearingData.location.address : '',
        virtualLink: hearingData.type === 'virtual' ? hearingData.location.virtualLink : ''
      }
    };

    try {
      console.log("the hearingf is ------------------------------:", hearing);
      if (hearing) {
        // Update existing hearing
        await hearingService.updateHearing(hearing._id, hearingPayload);
        toast.success('Hearing updated successfully');
      } else {
        // Create new hearing
        await hearingService.createHearing(hearingPayload);
        toast.success('Hearing scheduled successfully');
      }
      
      if (onHearingUpdated) {
        onHearingUpdated();
      }
      onClose();
    } catch (error) {
      if(error.statusCode == 400) 
      console.error('Hearing error:', error);
      toast.error(error.response?.data?.message || 'Failed to process hearing');
    }
  };

  // Check if the hearing is cancelled
  const isHearingCancelled = hearing?.status === 'cancelled';

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{hearing ? (isHearingCancelled ? 'View Hearing (Cancelled)' : 'Edit Hearing') : 'Schedule Hearing'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="hearingDate">
            <Form.Label>Hearing Date and Time</Form.Label>
            <Form.Control
              type="datetime-local"
              value={hearingData.date}
              onChange={(e) => setHearingData({ ...hearingData, date: e.target.value })}
              required
              disabled={isHearingCancelled}
            />
          </Form.Group>

          <Form.Group controlId="hearingDuration">
            <Form.Label>Duration (minutes)</Form.Label>
            <Form.Control
              type="number"
              value={hearingData.duration}
              onChange={(e) => setHearingData({ ...hearingData, duration: e.target.value })}
              min="2"
              max="180"
              required
              disabled={isHearingCancelled}
            />
          </Form.Group>

          <Form.Group controlId="hearingType">
            <Form.Label>Hearing Type</Form.Label>
            <Form.Select
              value={hearingData.type}
              onChange={(e) => setHearingData({ ...hearingData, type: e.target.value })}
              required
              disabled={isHearingCancelled}
            >
              <option value="physical">Physical Hearing</option>
              <option value="virtual">Virtual Hearing</option>
            </Form.Select>
          </Form.Group>

          <Row>
            <Col>
              <Form.Group controlId="courtRoom">
                <Form.Label>{hearingData.type === 'physical' ? 'Courtroom Number' : 'Virtual Meeting ID'}</Form.Label>
                <Form.Control
                  type="text"
                  value={hearingData.type === 'physical' ? hearingData.location.courtRoom : hearingData.location.virtualLink}
                  onChange={(e) => setHearingData({
                    ...hearingData,
                    location: {
                      ...hearingData.location,
                      [hearingData.type === 'physical' ? 'courtRoom' : 'virtualLink']: e.target.value
                    }
                  })}
                  required
                  disabled={isHearingCancelled}
                />
              </Form.Group>
            </Col>
            {hearingData.type === 'physical' && (
              <Col>
                <Form.Group controlId="address">
                  <Form.Label>Court Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={hearingData.location.address}
                    onChange={(e) => setHearingData({
                      ...hearingData,
                      location: { ...hearingData.location, address: e.target.value }
                    })}
                    required
                    disabled={isHearingCancelled}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>

          <Form.Group controlId="notes">
            <Form.Label>Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={hearingData.notes}
              onChange={(e) => setHearingData({ ...hearingData, notes: e.target.value })}
              placeholder={isHearingCancelled ? 'No notes available' : 'Enter any special instructions or notes...'}
              disabled={isHearingCancelled}
            />
          </Form.Group>

          <div className="text-end mt-3">
            <Button variant="secondary" onClick={onClose}>
              {isHearingCancelled ? 'Close' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" className="ms-2" disabled={isHearingCancelled}>
              {hearing ? (isHearingCancelled ? 'Cannot Update Cancelled Hearing' : 'Update Hearing') : 'Schedule Hearing'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default HearingScheduleModal;
