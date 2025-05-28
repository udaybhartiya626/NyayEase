import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  FormControl,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';

const PaymentRequestModal = ({ open, onClose, onSubmit, caseRequest }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!amount) {
      setError('Please enter an amount');
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        amount,
        paymentMethod,
        requestId: `REQ-${Math.random().toString(36).substr(2, 9)}`
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to request payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={open} onHide={onClose} size="sm">
      <ModalHeader closeButton>
        <ModalTitle>Request Payment</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label className="form-label">Amount (₹)</label>
            <FormControl
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={loading}
            />
          </FormGroup>
          <FormGroup>
            <label className="form-label">Payment Method</label>
            <FormControl
              as="select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={loading}
            >
              <option value="online">Online Payment</option>
              <option value="cash">Cash Payment</option>
              <option value="bank">Bank Transfer</option>
            </FormControl>
          </FormGroup>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="mt-3"
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
              'Request Payment'
            )}
          </Button>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PaymentRequestModal;
