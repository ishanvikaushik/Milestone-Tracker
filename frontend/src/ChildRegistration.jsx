import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const ChildRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    medicalConditions: '',
    allergies: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNewParent, setIsNewParent] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is authenticated and get their info
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'parent') {
      navigate('/');
      return;
    }

    // Check if this parent already has children
    checkParentStatus(parsedUser.id);
  }, [navigate]);

  const checkParentStatus = async (parentId) => {
    try {
      const response = await fetch(`https://milestone-tracker-jrst.onrender.com/api/parents/dashboard/${parentId}`);
      const data = await response.json();
      
      if (response.ok && data.children && data.children.length > 0) {
        setIsNewParent(false);
      }
    } catch (error) {
      console.error('Error checking parent status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate age group based on date of birth
  const calculateAgeGroup = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      actualAge--;
    }

    if (actualAge >= 0 && actualAge <= 3) return '0-3';
    if (actualAge >= 4 && actualAge <= 6) return '4-6';
    if (actualAge >= 7 && actualAge <= 8) return '7-8';
    if (actualAge >= 9 && actualAge <= 12) return '9-12';
    return '13+';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || user.role !== 'parent') {
        setError('Authentication error. Please log in again.');
        navigate('/login');
        return;
      }

      const ageGroup = calculateAgeGroup(formData.dob);
      const childData = {
        ...formData,
        parentId: user.id,
        ageGroup
      };

      const response = await fetch('https://milestone-tracker-jrst.onrender.com/api/parents/child/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to parent dashboard
        navigate('/parent-dashboard');
      } else {
        setError(data.error || 'Child registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkip = () => {
    // Allow parents to skip child registration for now
    navigate('/parent-dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isNewParent ? 
              (t('childRegistrationTitle') || 'Register Your Child') : 
              (t('addAnotherChild') || 'Add Another Child')
            }
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isNewParent ?
              (t('childRegistrationSubtitle') || 'Please provide your child\'s information to get started with milestone tracking') :
              (t('addChildSubtitle') || 'Add another child to track their developmental milestones')
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('childName') || 'Child\'s Full Name'} <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('childNamePlaceholder') || 'Enter child\'s full name'}
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                {t('dateOfBirth') || 'Date of Birth'} <span className="text-red-500">*</span>
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                required
                value={formData.dob}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                {t('gender') || 'Gender'}
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="">{t('selectGender') || 'Select Gender'}</option>
                <option value="male">{t('male') || 'Male'}</option>
                <option value="female">{t('female') || 'Female'}</option>
                <option value="other">{t('other') || 'Other'}</option>
              </select>
            </div>

            <div>
              <label htmlFor="medicalConditions" className="block text-sm font-medium text-gray-700">
                {t('medicalConditions') || 'Medical Conditions'} <span className="text-gray-400 text-xs">({t('optional') || 'Optional'})</span>
              </label>
              <textarea
                id="medicalConditions"
                name="medicalConditions"
                rows="3"
                value={formData.medicalConditions}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('medicalConditionsPlaceholder') || 'Any medical conditions or special needs (optional)'}
              />
            </div>

            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                {t('allergies') || 'Allergies'} <span className="text-gray-400 text-xs">({t('optional') || 'Optional'})</span>
              </label>
              <textarea
                id="allergies"
                name="allergies"
                rows="2"
                value={formData.allergies}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('allergiesPlaceholder') || 'Any known allergies (optional)'}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('registering') || 'Registering...'}
                </div>
              ) : (
                isNewParent ? (t('registerChild') || 'Register Child') : (t('addChild') || 'Add Child')
              )}
            </button>
          </div>

          {isNewParent && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-indigo-600 hover:text-indigo-500 underline"
              >
                {t('skipForNow') || 'Skip for now (you can add children later)'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChildRegistration;
