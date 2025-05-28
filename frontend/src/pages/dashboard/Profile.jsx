import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    },
    profileImage: '',
    specialization: '',
    experience: '',
    barCouncilNumber: '',
    designation: '',
    courtAssigned: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: {
          street: response.data.address?.street || '',
          city: response.data.address?.city || '',
          state: response.data.address?.state || '',
          postalCode: response.data.address?.postalCode || '',
          country: response.data.address?.country || 'India'
        },
        profileImage: response.data.profileImage || '',
        specialization: response.data.specialization || '',
        experience: response.data.experience || '',
        barCouncilNumber: response.data.barCouncilId || '',
        designation: response.data.designation || '',
        courtAssigned: response.data.courtAssigned || '',
        bio: response.data.bio || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number should be 10 digits';
    }
    
    if (user.role === 'advocate') {
      if (!formData.barCouncilNumber) {
        newErrors.barCouncilNumber = 'Bar Council Number is required';
      }
      if (!formData.specialization) {
        newErrors.specialization = 'Specialization is required';
      }
    }
    
    if (user.role === 'court-officer') {
      if (!formData.designation) {
        newErrors.designation = 'Designation is required';
      }
      if (!formData.courtAssigned) {
        newErrors.courtAssigned = 'Court assigned is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await userService.updateUserProfile(formData);
      await fetchProfile();
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const getRoleSpecificFields = () => {
    if (user.role === 'advocate') {
      return (
        <>
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border ${errors.specialization ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
            />
            {errors.specialization && (
              <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>
            )}
          </div>
          
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border ${errors.experience ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
            />
            {errors.experience && (
              <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
            )}
          </div>
          
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="barCouncilNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Bar Council Number
            </label>
            <input
              type="text"
              id="barCouncilNumber"
              name="barCouncilNumber"
              value={formData.barCouncilNumber}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border ${errors.barCouncilNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
            />
            {errors.barCouncilNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.barCouncilNumber}</p>
            )}
          </div>
        </>
      );
    } else if (user.role === 'court-officer') {
      return (
        <>
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border ${errors.designation ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
            />
            {errors.designation && (
              <p className="mt-1 text-sm text-red-600">{errors.designation}</p>
            )}
          </div>
          
          <div className="col-span-12 md:col-span-6">
            <label htmlFor="courtAssigned" className="block text-sm font-medium text-gray-700 mb-1">
              Court Assigned
            </label>
            <select
              id="courtAssigned"
              name="courtAssigned"
              value={formData.courtAssigned}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border ${errors.courtAssigned ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
            >
              <option value="">Select Court</option>
              <option value="district">District Court</option>
              <option value="high">High Court</option>
              <option value="supreme">Supreme Court</option>
            </select>
            {errors.courtAssigned && (
              <p className="mt-1 text-sm text-red-600">{errors.courtAssigned}</p>
            )}
          </div>
        </>
      );
    }
    
    return null;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">View and update your profile information</p>
      </div>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-800">{profile?.name}</h2>
              <p className="text-gray-600 capitalize">{user?.role.replace('-', ' ')}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-md ${
              isEditing 
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.street}</p>
                )}
              </div>
              
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.city}</p>
                )}
              </div>
              
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.state}</p>
                )}
              </div>
              
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="address.postalCode"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.postalCode}</p>
                )}
              </div>
              
              <div className="col-span-12 md:col-span-6">
                <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.country}</p>
                )}
              </div>
              
              {/* Role-specific fields */}
              {getRoleSpecificFields()}
              
              <div className="col-span-12">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border ${errors.bio ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isEditing && 'bg-gray-100'}`}
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                )}
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="px-6 py-4 bg-gray-50 text-right">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile; 