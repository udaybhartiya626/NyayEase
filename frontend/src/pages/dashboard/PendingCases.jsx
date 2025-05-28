import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import caseService from '../../services/caseService';
import { Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {Link} from 'react-router-dom';
const PendingCases = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingCases();
  }, []);

  const fetchPendingCases = async () => {
    try {
      setLoading(true);
      const response = await caseService.getPendingCases();
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching pending cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending-judge': 'warning',
      'pending-hearing': 'info',
      'pending': 'secondary',
      'active': 'success'
    };
    return <Badge bg={colors[status]}>{status.replace(/-/g, ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pending Cases</h2>
        <div className="d-flex gap-2">
          {/* <Button variant="primary" as={Link} to="/dashboard/hearings">
            Schedule Hearing
          </Button> */}
          <Button variant="outline-primary" onClick={fetchPendingCases}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Title</th>
                <th>Status</th>
                <th>Next Hearing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr key={caseItem._id}>
                  <td>{caseItem.caseNumber}</td>
                  <td>{caseItem.title}</td>
                  <td>{getStatusBadge(caseItem.status)}</td>
                  <td>
                    {caseItem.nextHearing ? (
                      new Date(caseItem.nextHearing).toLocaleDateString()
                    ) : (
                      'No hearing scheduled'
                    )}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/dashboard/pending-cases/${caseItem._id}`)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default PendingCases;