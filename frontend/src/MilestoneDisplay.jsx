import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const MilestoneDisplay = () => {
  const [milestones, setMilestones] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both milestones and children data
      const [milestonesResponse, childrenResponse] = await Promise.all([
        fetch('https://milestone-tracker-jrst.onrender.com/api/milestones'),
        fetch('https://milestone-tracker-jrst.onrender.com/api/children')
      ]);
      
      if (!milestonesResponse.ok || !childrenResponse.ok) {
        throw new Error(`HTTP error! status: ${milestonesResponse.status || childrenResponse.status}`);
      }
      
      const [milestonesData, childrenData] = await Promise.all([
        milestonesResponse.json(),
        childrenResponse.json()
      ]);
      
      setMilestones(milestonesData);
      setChildren(childrenData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered milestones based on selected child or age group
  const getFilteredMilestones = () => {
    if (selectedChild) {
      const child = children.find(c => c._id === selectedChild);
      if (child) {
        return milestones.filter(milestone => milestone.ageGroup === child.ageGroup);
      }
    }
    
    if (selectedAgeGroup === 'all') {
      return milestones;
    }
    
    return milestones.filter(milestone => milestone.ageGroup === selectedAgeGroup);
  };

  const filteredMilestones = getFilteredMilestones();
  const ageGroups = ['all', '0-3', '4-6', '7-8'];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-5">
        <div className="text-center p-10 bg-gray-50 rounded-xl">
          <div className="text-xl text-gray-600">{t('loadingMilestones')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-5">
        <div className="text-center p-10 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="text-xl font-semibold text-red-800 mb-2">{t('error')}</h3>
          <p className="text-red-600 mb-4">{t('fetchError')}</p>
          <button 
            onClick={fetchData} 
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5 font-sans">
      <div className="flex justify-end mb-4">
        <LanguageSwitcher />
      </div>
      
      <h1 className="text-4xl font-semibold text-center text-gray-800 mb-8">
        {t('childDevelopmentMilestones')}
      </h1>
      
      {/* Child Selection */}
      <div className="mb-6 p-5 bg-white rounded-xl shadow-sm border">
        <label htmlFor="child-select" className="block text-lg font-semibold text-gray-700 mb-3">
          {t('selectChild')}
        </label>
        <select 
          id="child-select"
          value={selectedChild} 
          onChange={(e) => {
            setSelectedChild(e.target.value);
            setSelectedAgeGroup('all'); // Reset age group filter when child is selected
          }}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base bg-white cursor-pointer focus:outline-none focus:border-blue-500"
        >
          <option value="">{t('selectChildToSeeMilestones')}</option>
          {children.map(child => (
            <option key={child._id} value={child._id}>
              {child.name} ({t('ageGroup')}: {child.ageGroup} {t('years')})
            </option>
          ))}
        </select>
      </div>

      {/* Age Group Filter - only show when no child is selected */}
      {!selectedChild && (
        <div className="flex items-center gap-3 mb-5 p-5 bg-gray-50 rounded-xl">
          <label htmlFor="age-filter" className="font-semibold text-gray-700">
            {t('filterByAgeGroup')}
          </label>
          <select 
            id="age-filter"
            value={selectedAgeGroup} 
            onChange={(e) => setSelectedAgeGroup(e.target.value)}
            className="px-3 py-2 border-2 border-gray-300 rounded-lg text-base bg-white cursor-pointer focus:outline-none focus:border-blue-500"
          >
            {ageGroups.map(group => (
              <option key={group} value={group}>
                {group === 'all' ? t('allAgeGroups') : `${group} ${t('years')}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Display selected child info */}
      {selectedChild && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h2 className="text-xl font-semibold text-blue-800">
            {t('showingMilestonesFor', { name: children.find(c => c._id === selectedChild)?.name })}
          </h2>
          <p className="text-blue-600">
            {t('ageGroup')}: {children.find(c => c._id === selectedChild)?.ageGroup} {t('years')}
          </p>
        </div>
      )}

      <div className="text-center text-gray-600 mb-8 text-lg">
        {t('showingMilestoneCount', { count: filteredMilestones.length })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {filteredMilestones.length === 0 ? (
          <div className="col-span-full text-center p-10 text-gray-600 text-xl bg-gray-50 rounded-xl">
            {t('noMilestonesFound')}
          </div>
        ) : (
          filteredMilestones.map(milestone => (
            <div 
              key={milestone._id} 
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800 leading-tight">
                  {milestone.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-2 ${
                  milestone.ageGroup === '0-3' ? 'bg-blue-100 text-blue-700' :
                  milestone.ageGroup === '4-6' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {milestone.ageGroup} {t('years')}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {milestone.description || t('noDescriptionAvailable')}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="text-center mt-8">
        <button 
          onClick={fetchData} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          🔄 {t('refreshData')}
        </button>
      </div>
    </div>
  );
};

export default MilestoneDisplay;
