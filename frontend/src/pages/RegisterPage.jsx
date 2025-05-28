import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error: authError } = useAuth();
  
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('litigant');
  const [formData, setFormData] = useState({
    // Common fields
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Advocate specific fields
    barRegistrationNumber: '',
    specialization: '',
    experience: '',
    
    // Court Officer specific fields
    courtName: '',
    designation: '',
    employeeId: '',
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const handleUserTypeSelect = (type) => {
    setUserType(type);
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.address) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required';
    }
    
    // Validate role-specific fields
    if (userType === 'advocate') {
      if (!formData.barRegistrationNumber) {
        newErrors.barRegistrationNumber = 'Bar registration number is required';
      }
      
      if (!formData.specialization) {
        newErrors.specialization = 'Specialization is required';
      }
      
      if (!formData.experience) {
        newErrors.experience = 'Experience is required';
      }
    } else if (userType === 'court-officer') {
      if (!formData.courtName) {
        newErrors.courtName = 'Court name is required';
      }
      
      if (!formData.designation) {
        newErrors.designation = 'Designation is required';
      }
      
      if (!formData.employeeId) {
        newErrors.employeeId = 'Employee ID is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };
  
  const handlePrevStep = () => {
    setStep(1);
  };
  
  const handleSubmit = async () => {
    try {
      // Use the selected user type for registration
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone || '1234567890', // Default phone if empty
        role: userType, // Use the selected user type
        address: {
          street: formData.address || 'Test Street', // Default values for testing
          city: formData.city || 'Test City',
          state: formData.state || 'Test State',
          postalCode: formData.pincode || '110001',
          country: 'India'
        }
      };
      
      // Add role-specific fields
      if (userType === 'advocate') {
        userData.barCouncilId = formData.barRegistrationNumber;
        userData.specialization = [formData.specialization];
        userData.experience = formData.experience;
      } else if (userType === 'court-officer') {
        userData.courtId = formData.employeeId;
        userData.designation = formData.designation;
      }
      
      // Log the data being sent for debugging
      console.log('Sending registration data:', userData);
      
      // Call register from AuthContext
      const response = await register(userData);
      console.log('Registration response:', response);
      
      // Redirect to dashboard on successful registration
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Registration error details:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      // Try to extract detailed error message if available
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setErrors({ form: errorMessage });
    }
  };

  // Define the renderFormError function
  const renderFormError = () => {
    return (errors.form || authError) && (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <p className="text-sm">{errors.form || authError}</p>
      </div>
    );
  };
  
  // Define the renderFormActions function
  const renderFormActions = () => {
    return (
      <div className="flex justify-between mt-8">
        {step === 2 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back
          </button>
        )}
        
        <button
          type="button"
          onClick={handleNextStep}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-auto"
        >
          {loading ? 'Processing...' : step === 1 ? 'Next' : 'Register'}
        </button>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Join NyayEase and digitize your legal journey
          </p>
        </div>
        
        {/* User Type Selection */}
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Select User Type</h3>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <button
                type="button"
                className={`px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  userType === 'litigant'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleUserTypeSelect('litigant')}
              >
                Litigant
              </button>
              
              <button
                type="button"
                className={`px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  userType === 'advocate'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleUserTypeSelect('advocate')}
              >
                Advocate
              </button>
              
              <button
                type="button"
                className={`px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  userType === 'court-officer'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleUserTypeSelect('court-officer')}
              >
                Court Officer
              </button>
            </div>
          </div>
        </div>
        
        {/* Registration Form */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {step === 1 ? 'Account Information' : 'Personal Information'}
              </h3>
              <span className="text-sm text-gray-500">Step {step} of 2</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: step === 1 ? '50%' : '100%' }}
              ></div>
            </div>
            
            {/* Form Error Message */}
            {renderFormError()}
            
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.firstName && (
                      <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.lastName && (
                      <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.city && (
                      <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.state && (
                      <p className="mt-2 text-sm text-red-600">{errors.state}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      id="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.pincode ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.pincode && (
                      <p className="mt-2 text-sm text-red-600">{errors.pincode}</p>
                    )}
                  </div>
                </div>
                
                {/* Role-specific fields */}
                {userType === 'advocate' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Advocate Information</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="barRegistrationNumber" className="block text-sm font-medium text-gray-700">
                          Bar Registration Number
                        </label>
                        <input
                          type="text"
                          name="barRegistrationNumber"
                          id="barRegistrationNumber"
                          value={formData.barRegistrationNumber}
                          onChange={handleChange}
                          className={`mt-1 block w-full border ${
                            errors.barRegistrationNumber ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                        {errors.barRegistrationNumber && (
                          <p className="mt-2 text-sm text-red-600">{errors.barRegistrationNumber}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                          Specialization
                        </label>
                        <select
                          name="specialization"
                          id="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          className={`mt-1 block w-full border ${
                            errors.specialization ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        >
                          <option value="">Select Specialization</option>
                          <option value="Criminal Law">Criminal Law</option>
                          <option value="Civil Law">Civil Law</option>
                          <option value="Family Law">Family Law</option>
                          <option value="Corporate Law">Corporate Law</option>
                          <option value="Tax Law">Tax Law</option>
                          <option value="Property Law">Property Law</option>
                          <option value="Constitutional Law">Constitutional Law</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.specialization && (
                          <p className="mt-2 text-sm text-red-600">{errors.specialization}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="experience"
                          id="experience"
                          min="0"
                          max="50"
                          value={formData.experience}
                          onChange={handleChange}
                          className={`mt-1 block w-full border ${
                            errors.experience ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                        {errors.experience && (
                          <p className="mt-2 text-sm text-red-600">{errors.experience}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {userType === 'court-officer' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Court Officer Information</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="courtName" className="block text-sm font-medium text-gray-700">
                          Court Name
                        </label>
                        <input
                          type="text"
                          name="courtName"
                          id="courtName"
                          value={formData.courtName}
                          onChange={handleChange}
                          className={`mt-1 block w-full border ${
                            errors.courtName ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                        {errors.courtName && (
                          <p className="mt-2 text-sm text-red-600">{errors.courtName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                          Designation
                        </label>
                        <input
                          type="text"
                          name="designation"
                          id="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className={`mt-1 block w-full border ${
                            errors.designation ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                        {errors.designation && (
                          <p className="mt-2 text-sm text-red-600">{errors.designation}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          name="employeeId"
                          id="employeeId"
                          value={formData.employeeId}
                          onChange={handleChange}
                          className={`mt-1 block w-full border ${
                            errors.employeeId ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                        {errors.employeeId && (
                          <p className="mt-2 text-sm text-red-600">{errors.employeeId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Navigation Buttons */}
            {renderFormActions()}
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 