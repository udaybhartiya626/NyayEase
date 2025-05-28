import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import caseService from '../../services/caseService';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';

const CaseManagement = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    status: '',
    judge: '',
    nextHearing: '',
    notes: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await caseService.getCourtCase(caseId);
      setCaseData(response.data);
    } catch (error) {
      console.error('Error fetching case details:', error);
      setError('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await caseService.updateCase(caseId, form);
      toast.success('Case updated successfully');
      navigate('/dashboard/pending-cases');
    } catch (error) {
      console.error('Error updating case:', error);
      setError('Failed to update case');
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
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Case Management</h2>
        <Button
          variant="outline-secondary"
          onClick={() => navigate('/dashboard/pending-cases')}
        >
          Back to Pending Cases
        </Button>
      </div>

      <Card>
        <Card.Body>
          <h3 className="mb-4">Case Information</h3>
          <div className="row mb-4">
            <div className="col-md-6">
              <p><strong>Case Number:</strong> {caseData.caseNumber}</p>
              <p><strong>Title:</strong> {caseData.title}</p>
              <p><strong>Case Type:</strong> {caseData.caseType}</p>
              <p><strong>Filing Date:</strong> {new Date(caseData.filingDate).toLocaleDateString()}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Filed By:</strong> {caseData.litigant?.name}</p>
              <p><strong>Advocate:</strong> {caseData.advocate?.name}</p>
              <p><strong>Opposing Party:</strong> {caseData.opposingParty?.name}</p>
              <p><strong>Current Status:</strong> {caseData.status}</p>
            </div>
          </div>

          <h3 className="mb-4">Manage Case</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={form.status} onChange={handleFormChange}>
                <option value="">Select Status</option>
                <option value="pending-judge">Pending Judge Assignment</option>
                <option value="pending-hearing">Pending Hearing</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Judge</Form.Label>
              <Form.Select name="judge" value={form.judge} onChange={handleFormChange}>
                <option value="">Select Judge</option>
                {/* Add judge options from API */}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Next Hearing Date</Form.Label>
              <Form.Control
                type="datetime-local"
                name="nextHearing"
                value={form.nextHearing}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Case'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CaseManagement;
