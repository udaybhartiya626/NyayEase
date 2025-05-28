import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import caseService from '../../services/caseService';
import hearingService from '../../services/hearingService';
import { useAuth } from '../../context/AuthContext';

const ScheduleHearing = () => {
  const { caseId, hearingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [hearingData, setHearingData] = useState({
    date: '',
    type: 'physical',
    location: {
      courtRoom: '',
      address: '',
      virtualLink: ''
    },
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Validate case ID format
    if (!caseId || !caseId.trim()) {
      setError('Invalid case ID');
      return;
    }

    // Check if case ID matches MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(caseId)) {
      setError('Invalid case ID format');
      return;
    }

    // Check if we're editing an existing hearing
    if (hearingId) {
      if (!/^[0-9a-fA-F]{24}$/.test(hearingId)) {
        setError('Invalid hearing ID format');
        return;
      }
      setIsEditing(true);
      fetchHearingDetails();
    } else {
      fetchCaseDetails();
    }
  }, [caseId, hearingId]);

  const fetchCaseDetails = async () => {
    try {
      const response = await caseService.getCourtCase(caseId);
      setCaseData(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load case details');
    }
  };

  const fetchHearingDetails = async () => {
    try {
      const [caseResponse, hearingResponse] = await Promise.all([
        caseService.getCourtCase(caseId),
        hearingService.getHearingById(hearingId)
      ]);
      
      setCaseData(caseResponse.data);
      setHearingData({
        date: new Date(hearingResponse.data.date).toISOString().slice(0, 16),
        type: hearingResponse.data.type,
        location: {
          courtRoom: hearingResponse.data.location?.courtRoom || '',
          address: hearingResponse.data.location?.address || '',
          virtualLink: hearingResponse.data.location?.virtualLink || ''
        },
        notes: hearingResponse.data.notes || ''
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load hearing details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setHearingData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setHearingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!hearingData.date) {
      setError('Please select a hearing date and time');
      return;
    }

    if (hearingData.type === 'physical' && (!hearingData.location.courtRoom || !hearingData.location.address)) {
      setError('Please enter both court room and address for physical hearings');
      return;
    }

    if (hearingData.type === 'virtual' && !hearingData.location.virtualLink) {
      setError('Please enter a virtual meeting link for virtual hearings');
      return;
    }

    if (!user || user.role !== 'court-officer') {
      setError('Only court officers can schedule hearings');
      return;
    }

    try {
      if (isEditing && hearingId) {
        await hearingService.updateHearing(hearingId, hearingData);
        setSuccess('Hearing updated successfully');
      } else {
        await caseService.scheduleHearing(caseId, hearingData);
        setSuccess('Hearing scheduled successfully');
      }
      navigate(`/dashboard/case-details/${caseId}`);
    } catch (error) {
      setError(error.response?.data?.message || 
        (isEditing ? 'Failed to update hearing' : 'Failed to schedule hearing'));
    }
  };

  if (!caseData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{isEditing ? 'Edit' : 'Schedule'} Hearing</h2>
          <p>Case: {caseData.title}</p>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate('/dashboard/cases')}
          className="mb-3"
        >
          Back to Cases
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Hearing Date and Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="date"
                value={hearingData.date}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Hearing Type</Form.Label>
              <Form.Select
                name="type"
                value={hearingData.type}
                onChange={handleChange}
                required
              >
                <option value="physical">Physical Hearing</option>
                <option value="virtual">Virtual Hearing</option>
              </Form.Select>
            </Form.Group>

            {hearingData.type === 'physical' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Court Room</Form.Label>
                  <Form.Control
                    type="text"
                    name="location.courtRoom"
                    value={hearingData.location.courtRoom}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Court Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="location.address"
                    value={hearingData.location.address}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </>
            )}

            {hearingData.type === 'virtual' && (
              <Form.Group className="mb-3">
                <Form.Label>Virtual Meeting Link</Form.Label>
                <Form.Control
                  type="url"
                  name="location.virtualLink"
                  value={hearingData.location.virtualLink}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={hearingData.notes}
                onChange={handleChange}
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Schedule Hearing
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ScheduleHearing;
