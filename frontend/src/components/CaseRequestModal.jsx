import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import caseRequestService from '../services/caseRequestService';
import caseService from '../services/caseService';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

const CaseRequestModal = ({ show, onHide, advocate, existingRequests = [] }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    caseTitle: '',
    caseDescription: '',
    caseType: '',
    court: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingCases, setExistingCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [selectedExistingCase, setSelectedExistingCase] = useState('');
  const [useExistingCase, setUseExistingCase] = useState(false);

  const caseTypes = [
    'civil',
    'criminal',
    'family',
    'property',
    'corporate',
    'taxation',
    'labor',
    'consumer',
    'other'
  ];

  const courts = [
    'district',
    'high',
    'supreme',
    'consumer',
    'family',
    'other'
  ];

  useEffect(() => {
    if (show && user?.role === 'litigant') {
      fetchExistingCases();
    }
  }, [show, user]);

  const fetchExistingCases = async () => {
    try {
      setLoadingCases(true);
      const response = await caseService.getAllCases();
      setExistingCases(response.data);
      setLoadingCases(false);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setLoadingCases(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Check if a request for this case already exists
  const checkDuplicateRequest = (advocateId, caseTitle) => {
    return existingRequests.some(request => 
      request.advocate._id === advocateId && 
      request.caseTitle.toLowerCase() === caseTitle.toLowerCase() &&
      (request.status === 'pending' || request.status === 'accepted')
    );
  };

  const handleExistingCaseSelect = (e) => {
    const caseId = e.target.value;
    setSelectedExistingCase(caseId);
    
    if (caseId) {
      const selectedCase = existingCases.find(c => c._id === caseId);
      if (selectedCase) {
        setFormData({
          caseTitle: selectedCase.title,
          caseDescription: selectedCase.description,
          caseType: selectedCase.caseType,
          court: selectedCase.court,
          message: formData.message, // Keep any message the user has typed
          existingCaseId: selectedCase._id
        });
      }
    }
  };

  const toggleUseExistingCase = () => {
    setUseExistingCase(!useExistingCase);
    if (!useExistingCase) {
      setFormData({
        caseTitle: '',
        caseDescription: '',
        caseType: '',
        court: '',
        message: formData.message // Keep any message the user has typed
      });
      setSelectedExistingCase('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const requestData = {
        advocate: advocate._id,
        ...formData
      };
      
      // Check for duplicate requests before submission
      if (checkDuplicateRequest(advocate._id, formData.caseTitle)) {
        setError(
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Duplicate Request:</strong> You have already sent a request for this case to this advocate.
              <br/>
              <span className="text-sm">Please check your existing requests or choose a different case.</span>
            </span>
          </div>
        );
        setLoading(false);
        return;
      }
      
      if (useExistingCase && selectedExistingCase) {
        requestData.existingCaseId = selectedExistingCase;
      }
      
      const response = await caseRequestService.createCaseRequest(requestData);
      
      if (response.success) {
        setSuccess(true);
        setFormData({
          caseTitle: '',
          caseDescription: '',
          caseType: '',
          court: '',
          message: ''
        });
        setSelectedExistingCase('');
        
        // Close the modal after 2 seconds on success
        setTimeout(() => {
          onHide();
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to send case request');
      }
    } catch (err) {
      console.error('Case request error:', err);
      
      // Check for duplicate case request error
      if (err.response?.data?.message && err.response?.data?.message.includes("already sent a request for this case")) {
        setError(
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Duplicate Request:</strong> You have already sent a request for this case to this advocate.
              <br/>
              <span className="text-sm">Please check your existing requests or choose a different case.</span>
            </span>
          </div>
        );
      } else {
        // Handle error message properly
        const errorMessage = err.response?.data?.error || 
                           err.response?.data?.message || 
                           err.message ||
                           'Failed to send case request';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Custom styling for Bootstrap components using Tailwind classes
  const modalHeaderStyle = "border-b border-gray-200 px-6 py-4";
  const modalBodyStyle = "px-6 py-5";
  const formGroupStyle = "mb-5";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputStyle = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
  const buttonPrimaryStyle = "bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
  const buttonSecondaryStyle = "bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3";

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className={modalHeaderStyle}>
        <Modal.Title className="text-xl font-semibold text-gray-800">Request Case Representation</Modal.Title>
      </Modal.Header>
      <Modal.Body className={modalBodyStyle}>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">Case request sent successfully!</Alert>}
        
        <div className="mb-6 p-5 bg-gray-50 rounded-md border border-gray-200">
          <h5 className="mb-4 text-lg font-medium text-indigo-700">Advocate Information</h5>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="col-span-1">
              <p className="mb-2 text-sm font-medium">Name:</p>
              <p className="mb-2 text-sm font-medium">Specialization:</p>
              <p className="mb-2 text-sm font-medium">Experience:</p>
              <p className="mb-0 text-sm font-medium">Rating:</p>
            </div>
            <div className="col-span-3">
              <p className="mb-2 text-sm">{advocate?.name || 'Not available'}</p>
              <p className="mb-2 text-sm">{Array.isArray(advocate?.specialization) ? advocate?.specialization.join(', ') : advocate?.specialization || 'Not specified'}</p>
              <p className="mb-2 text-sm">{advocate?.experience || 'Not specified'} years</p>
              <div className="mb-0">
                <StarRating 
                  rating={advocate?.averageRating || 0} 
                  showCount={true}
                />
              </div>
            </div>
          </div>
        </div>
        
        {user?.role === 'litigant' && existingCases.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="useExistingCase"
                checked={useExistingCase}
                onChange={toggleUseExistingCase}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="useExistingCase" className="ml-2 block text-sm font-medium text-gray-700">
                Use an existing case
              </label>
            </div>
            
            {useExistingCase && (
              <Form.Group className={formGroupStyle}>
                <Form.Label className={labelStyle}>Select from your existing cases</Form.Label>
                <Form.Select
                  value={selectedExistingCase}
                  onChange={handleExistingCaseSelect}
                  disabled={loading || loadingCases}
                  className={inputStyle}
                >
                  <option value="">Select a case</option>
                  {/*** dont show cases which are approved */}
                  {existingCases.filter(c => c.status !== 'approved').map(c => (
                    <option key={c._id} value={c._id}>
                      {c.title} - {c.caseNumber || 'No case number'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          {!useExistingCase && (
            <>
              <Form.Group className={formGroupStyle}>
                <Form.Label className={labelStyle}>Case Title</Form.Label>
                <Form.Control
                  type="text"
                  name="caseTitle"
                  value={formData.caseTitle}
                  onChange={handleChange}
                  required
                  disabled={loading || useExistingCase}
                  placeholder="Enter a brief title for your case"
                  className={inputStyle}
                />
              </Form.Group>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <Form.Group>
                    <Form.Label className={labelStyle}>Case Type</Form.Label>
                    <Form.Select
                      name="caseType"
                      value={formData.caseType}
                      onChange={handleChange}
                      required
                      disabled={loading || useExistingCase}
                      className={inputStyle}
                    >
                      <option value="">Select case type</option>
                      {caseTypes.map(type => (
                        <option key={type} value={type} className="capitalize">
                          {type}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div>
                  <Form.Group>
                    <Form.Label className={labelStyle}>Court</Form.Label>
                    <Form.Select
                      name="court"
                      value={formData.court}
                      onChange={handleChange}
                      required
                      disabled={loading || useExistingCase}
                      className={inputStyle}
                    >
                      <option value="">Select court</option>
                      {courts.map(court => (
                        <option key={court} value={court} className="capitalize">
                          {court} Court
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
              
              <Form.Group className={formGroupStyle}>
                <Form.Label className={labelStyle}>Case Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="caseDescription"
                  value={formData.caseDescription}
                  onChange={handleChange}
                  required
                  disabled={loading || useExistingCase}
                  placeholder="Describe your case in detail including relevant facts, issues, and what you need help with"
                  className={inputStyle}
                />
              </Form.Group>
            </>
          )}
          
          {useExistingCase && selectedExistingCase && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h6 className="text-sm font-medium text-blue-700 mb-2">Selected Case Details</h6>
              <p className="text-sm mb-1"><span className="font-medium">Title:</span> {formData.caseTitle}</p>
              <p className="text-sm mb-1"><span className="font-medium">Type:</span> {formData.caseType}</p>
              <p className="text-sm mb-1"><span className="font-medium">Court:</span> {formData.court}</p>
              <p className="text-sm mb-0">
                <span className="font-medium">Description:</span> 
                {formData.caseDescription?.length > 100 
                  ? `${formData.caseDescription.substring(0, 100)}...` 
                  : formData.caseDescription}
              </p>
            </div>
          )}
          
          <Form.Group className={formGroupStyle}>
            <Form.Label className={labelStyle}>
              Additional Message <span className="text-sm text-gray-500">(Optional)</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="message"
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
              placeholder="Any additional information you'd like to share with the advocate"
              className={inputStyle}
            />
          </Form.Group>
          
          <div className="flex justify-end mt-6">
            <Button 
              variant="outline-secondary" 
              onClick={onHide}
              disabled={loading}
              className={buttonSecondaryStyle}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading || 
                (!useExistingCase && (!formData.caseTitle || !formData.caseDescription || !formData.caseType || !formData.court)) ||
                (useExistingCase && !selectedExistingCase)}
              className={buttonPrimaryStyle}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="mr-2"
                  />
                  Sending...
                </>
              ) : 'Send Request'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CaseRequestModal; 