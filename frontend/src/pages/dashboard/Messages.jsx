import { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import messageService from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messageService.getMessages();
      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await messageService.markAsRead(messageId);
      
      // Update the local messages state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
      setError('Failed to mark message as read. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessageCard = (message) => {
    const isSender = message.sender?._id === user.id;
    
    return (
      <Card key={message._id} className="mb-3 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-bold">
              {isSender ? `To: ${message.recipient?.name || 'User'}` : `From: ${message.sender?.name || 'User'}`}
            </span>
            {!message.read && !isSender && (
              <Badge bg="danger" className="ms-2">New</Badge>
            )}
          </div>
          <small className="text-muted">{formatDate(message.createdAt)}</small>
        </Card.Header>
        <Card.Body>
          <Card.Title>{message.subject}</Card.Title>
          <Card.Text>{message.content}</Card.Text>
          {!message.read && !isSender && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => handleMarkAsRead(message._id)}
            >
              Mark as Read
            </Button>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Messages</h1>
        <Button variant="outline-primary" onClick={fetchMessages}>Refresh</Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : messages.length > 0 ? (
        <div>
          {messages.map(renderMessageCard)}
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">No messages found</p>
        </div>
      )}
    </div>
  );
};

export default Messages; 