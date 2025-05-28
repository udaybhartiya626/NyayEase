import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Form,
  FormGroup,
  FormControl,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';

const PaymentSimulation = ({ 
  caseRequest,
  onPaymentComplete
}) => {
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'online',
    referenceNumber: '',
    paymentStatus: 'pending'
  });

  // Update amount only for advocates


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const paymentId = `PAY-${Math.random().toString(36).substr(2, 9)}`;
      await onPaymentComplete({
        paymentId,
        caseId: caseRequest._id,
        amount: caseRequest.paymentAmount,
        method: paymentDetails.paymentMethod,
        referenceNumber: paymentDetails.referenceNumber,
        status: 'completed'
      });
      setSuccess(true);
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <CardTitle>Payment Details</CardTitle>
        
        <div className="mb-2">
          <span className="text-muted">Case: {caseRequest.caseName}</span>
        </div>

        {error && <Alert variant="danger" className="mb-2">{error}</Alert>}
        {success && <Alert variant="success" className="mb-2">Payment request sent successfully!</Alert>}

        <Form onSubmit={handleSubmit}>
          <FormGroup className="mb-3">
            <label className="form-label">Requested Amount (₹)</label>
            <FormControl
              type="number"
              value={caseRequest.paymentAmount}
              disabled
            />
          </FormGroup>

          <FormGroup className="mb-3">
            <label className="form-label">Payment Method</label>
            <FormControl
              as="select"
              name="paymentMethod"
              value={paymentDetails.paymentMethod}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="online">Online Payment</option>
              <option value="cash">Cash Payment</option>
              <option value="bank">Bank Transfer</option>
            </FormControl>
          </FormGroup>

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              'Send Payment Request'
            )}
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
};
export default PaymentSimulation;
