import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caseService from '../../services/caseService';
import documentService from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';

const FileCase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Generate random title by default
  const randomTitle = () => {
    const titles = [
      'Case Title 1',
      'Case Title 2',
      'Case Title 3',
      'Case Title 4',
      'Case Title 5'
    ];
    return titles[Math.floor(Math.random() * titles.length)] + Math.floor(Math.random() * 100);
  };
    
  const [formData, setFormData] = useState({
    title: randomTitle(), 
    description: 'sdfghjhgvcxcvbnmmnhgfdxsdfghjkjhgfddfghjkjhgfcxcvbnbvc',
    caseType: 'civil',
    court: 'district',
    documents: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Case types
  const caseTypes = [
    { id: 'civil', name: 'Civil' },
    { id: 'criminal', name: 'Criminal' },
    { id: 'family', name: 'Family' },
    { id: 'property', name: 'Property' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'tax', name: 'Tax' },
    { id: 'other', name: 'Other' }
  ];
  
  // Courts list (simplified for demo)
  const courts = [
    { id: 'district', name: 'District Court' },
    { id: 'high', name: 'High Court' },
    { id: 'supreme', name: 'Supreme Court' }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      documents: [...formData.documents, ...files]
    });
  };
  
  const removeDocument = (index) => {
    const updatedDocuments = [...formData.documents];
    updatedDocuments.splice(index, 1);
    setFormData({
      ...formData,
      documents: updatedDocuments
    });
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Case title is required';
    }
    
    if (!formData.caseType) {
      newErrors.caseType = 'Please select a case type';
    }
    
    if (!formData.court) {
      newErrors.court = 'Please select a court';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Case description is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description should be at least 50 characters';
    }
    
    if (formData.documents.length === 0) {
      newErrors.documents = 'Please upload at least one document';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    // Check if user is authenticated
    if (!user || !user._id) {
      setErrors({ 
        form: 'You must be logged in to file a case. Please log in and try again.' 
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First create the case without documents
      const caseData = {
        title: formData.title,
        description: formData.description,
        caseType: formData.caseType,
        court: formData.court,
        litigant: user._id
      };
      
      // Create the case
      const response = await caseService.createCase(caseData);
      
      if (!response || !response.data || !response.data._id) {
        throw new Error('Invalid response from server');
      }
      
      const caseId = response.data._id;
      
      // Then upload all documents
      const uploadPromises = formData.documents.map(async (file) => {
        const metadata = {
          name: file.name,
          fileType: file.name.split('.').pop().toLowerCase(),
          fileSize: file.size,
          uploadedBy: user._id,
          isPublic: false
        };
        
        return documentService.uploadDocument(caseId, file, metadata);
      });
      
      await Promise.all(uploadPromises);
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        caseType: '',
        court: '',
        documents: []
      });
      
      setCurrentStep(1);
      alert('Case filed successfully!');
      
      // Navigate to the case details page
      navigate(`/dashboard/cases/${caseId}`);
      
    } catch (error) {
      console.error('Error filing case:', error);
      setErrors({ 
        form: error.response?.data?.message || 
              error.message || 
              'An error occurred while filing the case. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-indigo-600 text-white">
        <h2 className="text-2xl font-bold">File a New Case</h2>
        <p className="mt-1 text-indigo-100">
          Please provide the details of your case.
        </p>
      </div>
      
      {/* Progress Indicator */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 1 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-500'} mr-2`}>
            1
          </div>
          <div className="mr-4">
            <p className={`font-medium ${currentStep === 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
              Basic Information
            </p>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          
          <div className="ml-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-500'} mr-2`}>
              2
            </div>
          </div>
          <div>
            <p className={`font-medium ${currentStep === 2 ? 'text-indigo-600' : 'text-gray-500'}`}>
              Details & Documents
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Case Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Enter a descriptive title for your case"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-1">
                Case Type*
              </label>
              <select
                id="caseType"
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.caseType ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              >
                <option value="">Select Case Type</option>
                {caseTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {errors.caseType && (
                <p className="mt-1 text-sm text-red-600">{errors.caseType}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="court" className="block text-sm font-medium text-gray-700 mb-1">
                Court*
              </label>
              <select
                id="court"
                name="court"
                value={formData.court}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.court ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              >
                <option value="">Select Court</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
              {errors.court && (
                <p className="mt-1 text-sm text-red-600">{errors.court}</p>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next Step
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Case Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Provide a detailed description of your case"
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Minimum 50 characters. Include relevant details about your case.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supporting Documents*
              </label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${errors.documents ? 'border-red-500' : 'border-gray-300'}`}>
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="documents"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="documents"
                        name="documents"
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, Word, or image files up to 10MB each
                  </p>
                </div>
              </div>
              {errors.documents && (
                <p className="mt-1 text-sm text-red-600">{errors.documents}</p>
              )}
              
              {formData.documents.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                  <ul className="mt-2 divide-y divide-gray-200 border border-gray-200 rounded-md">
                    {formData.documents.map((doc, index) => (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          <span className="ml-2 flex-1 w-0 truncate">
                            {doc.name}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {errors.form && (
              <div className="mb-4 p-3 bg-red-50 border border-red-400 rounded-md">
                <p className="text-sm text-red-600">{errors.form}</p>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Filing Case...' : 'Submit Case'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default FileCase; 