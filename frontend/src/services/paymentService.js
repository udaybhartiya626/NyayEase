export const requestPayment = async (paymentDetails) => {
  // Simulate payment request processing
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate unique request ID
      const requestId = `REQ-${Math.random().toString(36).substr(2, 9)}`;
      
      // Return request details with pending status
      resolve({
        requestId,
        caseId: paymentDetails.caseId,
        amount: paymentDetails.amount,
        paymentMethod: paymentDetails.paymentMethod,
        status: 'requested',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }, 2000); // Simulate longer processing time
  });
};

export const completePayment = async (paymentDetails) => {
  // Simulate payment completion
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate unique payment ID
      const paymentId = `PAY-${Math.random().toString(36).substr(2, 9)}`;
      
      // Return payment details with completed status
      resolve({
        paymentId,
        caseId: paymentDetails.caseId,
        amount: paymentDetails.amount,
        method: paymentDetails.method,
        referenceNumber: paymentDetails.referenceNumber,
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }, 3000); // Simulate longer processing time
  });
};
