import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Rating from '../../components/Rating';
import caseService from '../../services/caseService';
import documentService from '../../services/documentService';
import ContactModal from '../../components/ContactModal';
import { Modal, Button } from 'react-bootstrap';
import HearingTimeline from '../../components/HearingTimeline';
import HearingScheduleModal from '../../components/HearingScheduleModal';

const CaseDetails = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactRecipient, setContactRecipient] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await caseService.getCase(caseId);
      setCaseDetails(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching case details:', err);
      setError('Failed to load case details. Please try again later.');
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsSubmittingNote(true);
      
      // Create note data object
      const noteData = {
        notes: [{
          content: newNote,
          addedBy: user.id
        }]
      };
      
      // Update case with new note
      await caseService.updateCase(caseId, noteData);
      
      // Refresh case details
      await fetchCaseDetails();
      
      // Clear input
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again later.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteCase = async () => {
    try {
      setIsDeleting(true);
      await caseService.deleteCase(caseId);
      navigate('/dashboard/cases', { replace: true });
    } catch (err) {
      console.error('Error deleting case:', err);
      setError(err.response?.data?.message || 'Failed to delete case. Please try again later.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const canDeleteCase = () => {
    console.log("Checking if case can be deleted:");
    console.log("User role:", user.role);
    console.log("Case details:", caseDetails);
    
    if (!caseDetails) {
      console.log("No case details available");
      return false;
    }
    
    if (user.role !== 'litigant') {
      console.log("Only litigants can delete cases");
      return false;
    }
    
    // Debug litigant and user info
    console.log("Current user:", user);
    console.log("Case litigant:", caseDetails.litigant);
    console.log("Litigant ID:", caseDetails.litigant?._id);
    console.log("User ID from auth:", user?._id || user?.id);
    
    // Check if litigant data is properly loaded
    if (!caseDetails.litigant || !caseDetails.litigant._id) {
      console.log("Case is missing litigant information");
      return false;
    }
    
    const userId = user._id || user.id;
    if (!userId) {
      console.log("User ID is missing from auth context");
      return false;
    }
    
    // Litigants can delete their own cases only if pending-approval or rejected
    const deletableStatuses = ['pending-approval', 'rejected'];
    
    console.log("Case status:", caseDetails.status);
    console.log("Is status deletable:", deletableStatuses.includes(caseDetails.status));
    console.log("Case litigant ID:", caseDetails.litigant._id);
    console.log("User ID:", userId);
    
    // Convert both IDs to strings for proper comparison
    const isOwnCase = caseDetails.litigant._id.toString() === userId.toString();
    console.log("Is own case after string conversion:", isOwnCase);
    console.log("Comparing litigant ID:", caseDetails.litigant._id, "with user ID:", userId);
    
    const canDelete = (
      isOwnCase &&
      deletableStatuses.includes(caseDetails.status) &&
      (!caseDetails.hearings || caseDetails.hearings.length === 0) &&
      (!caseDetails.documents || caseDetails.documents.length === 0)
    );
    
    console.log("Can delete:", canDelete);
    return canDelete;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'pending-approval': 'bg-yellow-100 text-yellow-800',
      'payment-requested': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'in-progress': 'bg-indigo-100 text-indigo-800',
      'scheduled-hearing': 'bg-purple-100 text-purple-800',
      'adjourned': 'bg-amber-100 text-amber-800',
      'resolved': 'bg-teal-100 text-teal-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const response = await documentService.downloadDocument(documentId);
      
      // Create a blob from the response data
      const blob = new Blob([response.data]);
      
      // Create a link element to trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = documentName || 'document';
      
      // Append to body, click and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again later.');
    }
  };

  const handleContactClick = (recipient) => {
    setContactRecipient(recipient);
    setShowContactModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => navigate(-1)} 
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Case not found or you do not have permission to view it.</p>
            <button 
              onClick={() => navigate(-1)} 
              className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-900"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Case header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{caseDetails.title}</h1>
            <p className="text-gray-500">Case Number: <span className="font-medium">{caseDetails.caseNumber}</span></p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(caseDetails.status)} capitalize`}>
              {caseDetails.status.replace(/-/g, ' ')}
            </span>
            
            {/* Contact button for advocates */}
            {user.role === 'advocate' && caseDetails.litigant && (
              <button
                onClick={() => handleContactClick(caseDetails.litigant)}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Contact Litigant
              </button>
            )}
            
            {/* Contact button for litigants */}
            {user.role === 'litigant' && caseDetails.advocates && caseDetails.advocates.length > 0 && caseDetails.status === 'approved' && (
              <button
                onClick={() => handleContactClick(caseDetails.advocates[0])}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Contact Advocate
              </button>
            )}
            
            {/* Delete button for litigants */}
            {canDeleteCase() && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete Case
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">Filing Date</h3>
            <p className="text-base font-medium text-gray-900 mt-1">{formatDate(caseDetails.filingDate)}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">Court</h3>
            <p className="text-base font-medium text-gray-900 mt-1 capitalize">{caseDetails.court} Court</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">Case Type</h3>
            <p className="text-base font-medium text-gray-900 mt-1 capitalize">{caseDetails.caseType}</p>
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => handleTabChange('overview')}
            className={`mr-8 py-4 text-sm font-medium ${
              activeTab === 'overview'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('documents')}
            className={`mr-8 py-4 text-sm font-medium ${
              activeTab === 'documents'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => handleTabChange('hearings')}
            className={`mr-8 py-4 text-sm font-medium ${
              activeTab === 'hearings'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hearings
          </button>
          <button
            onClick={() => handleTabChange('notes')}
            className={`mr-8 py-4 text-sm font-medium ${
              activeTab === 'notes'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notes
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Case Details</h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-800 whitespace-pre-line">{caseDetails.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Litigant</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium">{caseDetails.litigant?.name || 'N/A'}</p>
                  <p className="text-gray-500">{caseDetails.litigant?.email || 'N/A'}</p>
                  <p className="text-gray-500">{caseDetails.litigant?.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Opposing Party</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium">{caseDetails.opposingParty?.name || 'Not specified'}</p>
                  <p className="text-gray-500">Advocate: {caseDetails.opposingParty?.advocateName || 'Not specified'}</p>
                  <p className="text-gray-500">Contact: {caseDetails.opposingParty?.contactInfo || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Advocate(s)</h3>
              {caseDetails.advocates && caseDetails.advocates.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  {caseDetails.advocates.map((advocate) => (
                    <div key={advocate._id} className="mb-2 last:mb-0">
                      <p className="font-medium">{advocate.name}</p>
                      <p className="text-gray-500">{advocate.email}</p>
                      <p className="text-gray-500">{advocate.specialization || 'No specialization specified'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No advocates assigned to this case</p>
              )}
            </div>
            
            {caseDetails.assignedJudge && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned Judge</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium">{caseDetails.assignedJudge.name}</p>
                  <p className="text-gray-500">{caseDetails.assignedJudge.designation || 'Judge'}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Documents tab */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Case Documents</h2>
              {user.role === 'litigant' && (
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Upload Document
                </button>
              )}
            </div>
            
            {caseDetails.documents && caseDetails.documents.length > 0 ? (
              <div className="overflow-hidden bg-white shadow border border-gray-200 sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {caseDetails.documents.map((document) => (
                    <li key={document._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-3">
                              <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-indigo-600 truncate">{document.title || document.originalname}</p>
                              <div className="mt-1 flex items-center">
                                <p className="text-xs text-gray-500 truncate">
                                  Uploaded {formatDate(document.createdAt)} • {document.size ? `${Math.round(document.size / 1024)} KB` : 'Size unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <button 
                              onClick={() => handleDownloadDocument(document._id, document.originalname)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No documents have been uploaded for this case yet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Hearings tab */}
        {activeTab === 'hearings' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Hearings</h2>
              {user.role === 'court-officer' && (
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Schedule Hearing
                </button>
              )}
            </div>
            
            {caseDetails.hearings && caseDetails.hearings.length > 0 ? (
              <div className="overflow-hidden bg-white shadow border border-gray-200 sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {caseDetails.hearings
                    .filter(hearing => hearing && typeof hearing === 'object' && hearing.date)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((hearing) => {
                      const hearingDate = new Date(hearing.date);
                      const hearingType = hearing.type || 'physical';
                      const hearingStatus = hearing.status || 'scheduled';
                      const hearingLocation = hearing.location || {};
                      
                      return (
                        <li key={hearing._id}>
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-indigo-600">
                                  {hearingDate.toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                hearingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                hearingStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                hearingStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                hearingStatus === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {hearingStatus.replace('-', ' ')}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                • {hearingType === 'virtual' ? 'Virtual' : 'In-Person'}
                              </span>
                              {user.role === 'court-officer' && hearingStatus !== 'cancelled' && (
                                <button 
                                  onClick={() => {
                                    // Handle edit hearing
                                    navigate(`/dashboard/hearings/edit/${hearing._id}`);
                                  }}
                                  className="ml-2 text-indigo-600 hover:text-indigo-900"
                                  title="Edit hearing"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                              )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  {hearingType === 'virtual' ? (
                                    hearingStatus === 'completed' ? (
                                      <span className="text-gray-500 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="Mwhere 10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Meeting Ended
                                      </span>
                                    ) : hearingLocation.virtualLink ? (
                                      <a 
                                        href={hearingLocation.virtualLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 flex items-center"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                        Join Virtual Hearing
                                      </a>
                                    ) : 'Virtual link not available'
                                  ) : (
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                      </svg>
                                      {hearingLocation.address || 'Location not specified'}
                                      {hearingLocation.courtRoom && ` (${hearingLocation.courtRoom})`}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No hearings have been scheduled for this case yet.
                    </p>
                    {user.role === 'court-officer' && (
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Schedule Hearing
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Notes tab */}
        {activeTab === 'notes' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Case Notes</h2>
            
            {/* Add note form */}
            <form onSubmit={handleNoteSubmit} className="mb-6">
              <div className="mb-3">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  Add a note
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Enter your note here..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                >
                  {isSubmittingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>
            
            {/* Notes list */}
            {caseDetails.notes && caseDetails.notes.length > 0 ? (
              <div className="space-y-4">
                {caseDetails.notes.map((note, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-800 whitespace-pre-line">{note.content}</p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span>Added by {note.addedBy?.name || 'Unknown'} • {formatDate(note.addedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No notes have been added to this case yet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Contact Modal */}
      {contactRecipient && (
        <ContactModal
          show={showContactModal}
          onHide={() => setShowContactModal(false)}
          recipient={contactRecipient}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-red-600">Delete Case</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">Are you sure you want to delete this case?</p>
          <p className="text-gray-600 mb-4">This action cannot be undone. All case information will be permanently removed.</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You can only delete cases that are in pending or rejected status and have no hearings or documents attached.
                </p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteCase}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Case'}
          </Button>
        </Modal.Footer>
      </Modal>

     

      {/* Rating Section for Completed Cases - Only for Litigants */}
      {user.role === 'litigant' && caseDetails && (caseDetails.status === 'resolved' || caseDetails.status === 'closed') && caseDetails.advocates && caseDetails.advocates.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Your Advocate</h3>
          <p className="text-sm text-gray-500 mb-4">
            Share your experience with your advocate to help others.
          </p>
          <Rating 
            caseId={caseDetails._id} 
            advocateId={caseDetails.advocates[0]._id}
            onRatingSubmit={() => {
              // Refresh case data after rating
              fetchCaseDetails();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CaseDetails;