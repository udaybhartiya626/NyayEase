import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import caseService from '../../services/caseService';

const Cases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    caseType: '',
    court: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCases();
  }, [filters]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await caseService.getAllCases(filters);
      setCases(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to load cases. Please try again later.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      caseType: '',
      court: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'pending-approval': 'bg-yellow-100 text-yellow-800',
      'payment-requested': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'scheduled-hearing': 'bg-purple-100 text-purple-800',
      'adjourned': 'bg-orange-100 text-orange-800',
      'resolved': 'bg-teal-100 text-teal-800',
      'completed': 'bg-green-100 text-green-800 font-bold',
      'active': 'bg-blue-100 text-blue-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const canDeleteCase = (caseItem) => {
    console.log('Checking if case can be deleted:');
    console.log('User role:', user.role);
    console.log('User:', user);
    console.log('Case details:', caseItem);
    
    if (user.role !== 'litigant') {
      console.log('User is not a litigant');
      return false;
    }
    
    // Check if the case belongs to the current user
    if (!caseItem.litigant || !caseItem.litigant._id || !user._id) {
      console.log('Missing litigant ID or user ID');
      return false;
    }

    const litigantId = caseItem.litigant._id.toString();
    const userId = user._id.toString();
    
    console.log('Comparing IDs:', { litigantId, userId });
    const isOwnCase = litigantId === userId;
    
    // Litigants can only delete cases in pending-approval or rejected status
    const deletableStatuses = ['pending-approval', 'rejected', 'payment-requested'];
    const hasDeletableStatus = deletableStatuses.includes(caseItem.status);
    
    // Check if case has any hearings or documents
    const hasHearings = caseItem.hearings && caseItem.hearings.length > 0;
    const hasDocuments = caseItem.documents && caseItem.documents.length > 0;
    const hasAttachments = hasHearings || hasDocuments;
    
    const canDelete = isOwnCase && hasDeletableStatus;
    
    console.log('Can delete case:', canDelete, {
      isOwnCase,
      status: caseItem.status,
      hasDeletableStatus,
      hasHearings,
      hasDocuments,
      hasAttachments
    });
    
    return canDelete;
  };

  const handleDeleteClick = (caseItem) => {
    setCaseToDelete(caseItem);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!caseToDelete) return;
    
    try {
      setIsDeleting(true);
      await caseService.deleteCase(caseToDelete._id);
      
      // Remove the deleted case from the list
      setCases(cases.filter(c => c._id !== caseToDelete._id));
      
      // Close the modal
      setShowDeleteModal(false);
      setCaseToDelete(null);
    } catch (err) {
      console.error('Error deleting case:', err);
      let errorMessage = 'Failed to delete case. Please try again later.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server response:', err.response.data);
        
        if (err.response.status === 500) {
          errorMessage = 'Server error occurred while deleting the case. Please try again later or contact support.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage = 'No response from server. Please check your internet connection and try again.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', err.message);
      }
      
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCaseToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Cases</h1>
          <p className="text-gray-600">Manage your legal cases</p>
        </div>
        {user.role === 'litigant' && (
          <Link 
            to="/dashboard/file-case" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            File New Case
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="pending-approval">Pending Approval</option>
              <option value="payment-requested">Payment Requested</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in-progress">In Progress</option>
              <option value="scheduled-hearing">Hearing Scheduled</option>
              <option value="adjourned">Adjourned</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
            <select
              id="caseType"
              name="caseType"
              value={filters.caseType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="civil">Civil</option>
              <option value="criminal">Criminal</option>
              <option value="family">Family</option>
              <option value="property">Property</option>
              <option value="corporate">Corporate</option>
              <option value="tax">Tax</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="court" className="block text-sm font-medium text-gray-700 mb-1">Court</label>
            <select
              id="court"
              name="court"
              value={filters.court}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Courts</option>
              <option value="district">District Court</option>
              <option value="high">High Court</option>
              <option value="supreme">Supreme Court</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cases list */}
      {cases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No cases found</h3>
          <p className="text-gray-500 mb-4">
            {filters.status || filters.caseType || filters.court 
              ? 'Try changing your filters to see more results.' 
              : 'You haven\'t filed any cases yet.'}
          </p>
          {user.role === 'litigant' && !filters.status && !filters.caseType && !filters.court && (
            <Link to="/dashboard/file-case" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              File Your First Case
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filing Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Court
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr key={caseItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caseItem.caseNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caseItem.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {caseItem.caseType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(caseItem.status)} capitalize`}>
                        {caseItem.status.replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(caseItem.filingDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {caseItem.court} Court
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-4">
                        <Link 
                          to={`/dashboard/cases/${caseItem._id}`} 
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View Details
                        </Link>
                        {caseItem.status === 'approved' && user.role === 'court-officer' && (
                          <Link 
                            to={`/dashboard/hearings/${caseItem._id}`} 
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Schedule Hearing
                          </Link>
                        )}
                        {canDeleteCase(caseItem) && (
                          <button
                            onClick={() => handleDeleteClick(caseItem)}
                            className="text-red-600 hover:text-red-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
              onClick={handleCloseDeleteModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirm Deletion
                    </h3>
                    <div className="mt-2">
                      {caseToDelete && (
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete the case <span className="font-medium text-gray-900">{caseToDelete.title}</span>? 
                          This action cannot be undone.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Case'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases; 