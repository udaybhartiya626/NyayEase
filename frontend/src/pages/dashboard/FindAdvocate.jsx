import { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import userService from '../../services/userService';
import CaseRequestModal from '../../components/CaseRequestModal';
import caseRequestService from '../../services/caseRequestService';
import StarRating from '../../components/StarRating';

const FindAdvocate = () => {
  const [advocates, setAdvocates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    specialization: '',
    experience: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const [existingRequests, setExistingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    fetchAdvocates();
    fetchExistingRequests();
  }, [filters]);

  const fetchAdvocates = async () => {
    try {
      setLoading(true);
      const response = await userService.searchAdvocates(filters);
      console.log(response.data)
      setAdvocates(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching advocates:', err);
      setError('Failed to load advocates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await caseRequestService.getCaseRequests();
      setExistingRequests(response.data);
    } catch (err) {
      console.error('Error fetching existing requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestCase = (advocate) => {
    setSelectedAdvocate(advocate);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAdvocate(null);
    // Refresh the requests after modal closes in case a new request was created
    fetchExistingRequests();
  };

  const formatSpecializations = (specializations) => {
    if (!specializations) return 'Not specified';
    if (typeof specializations === 'string') return specializations;
    return specializations.join(', ');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Find an Advocate</h1>
      
      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Form>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Specialization</Form.Label>
                  <Form.Control
                    as="select"
                    name="specialization"
                    value={filters.specialization}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Specializations</option>
                    <option value="criminal">Criminal Law</option>
                    <option value="civil">Civil Law</option>
                    <option value="corporate">Corporate Law</option>
                    <option value="family">Family Law</option>
                    <option value="tax">Tax Law</option>
                    <option value="intellectual-property">Intellectual Property</option>
                    <option value="real-estate">Real Estate</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Experience</Form.Label>
                  <Form.Control
                    as="select"
                    name="experience"
                    value={filters.experience}
                    onChange={handleFilterChange}
                  >
                    <option value="">Any Experience</option>
                    <option value="0-2">0-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="10+">10+ years</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              {/* Location filter removed as per requirements */}
            </Row>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Error message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {/* Loading spinner */}
      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
      
      {/* Advocates list */}
      {!loading && advocates.length === 0 ? (
        <div className="text-center my-5">
          <p>No advocates found matching your criteria.</p>
        </div>
      ) : (
        <Row>
          {advocates.map(advocate => (
            <Col key={advocate._id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                      {advocate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <Card.Title className="mb-0">{advocate.name}</Card.Title>
                      <div className="d-flex align-items-center">
                        <StarRating 
                          rating={advocate.averageRating || 0} 
                          showCount={true}
                          ratingCount={advocate.ratingCount || 0}
                        />
                      </div>
                      <small className="text-muted d-block">{advocate.experience || 'N/A'} years experience</small>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <strong>Specialization:</strong> {formatSpecializations(advocate.specialization)}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Bar Council Number:</strong> {advocate.barCouncilId || 'Not provided'}
                  </div>
                  {advocate.about && (
                    <div className="mb-3">
                      <strong>About:</strong>
                      <p className="text-muted mt-1">
                        {advocate.about.length > 100
                          ? `${advocate.about.substring(0, 100)}...`
                          : advocate.about}
                      </p>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-white border-0">
                  <Button 
                    variant="primary" 
                    className="w-100"
                    onClick={() => handleRequestCase(advocate)}
                  >
                    Request Case Representation
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Case Request Modal */}
      {selectedAdvocate && (
        <CaseRequestModal
          show={showModal}
          onHide={handleCloseModal}
          advocate={selectedAdvocate}
          existingRequests={existingRequests}
        />
      )}
    </div>
  );
};

export default FindAdvocate; 