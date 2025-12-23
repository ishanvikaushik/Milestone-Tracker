import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const ParentDashboard = () => {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'success', 'error'
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [showTicketReplies, setShowTicketReplies] = useState(false);
  const [latestVolunteerReply, setLatestVolunteerReply] = useState(null);
  const [hasNewReply, setHasNewReply] = useState(false);
  const [ticketLang, setTicketLang] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const audioRef = useRef(null);

  useEffect(() => {
    // Play audio guide on mount
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    const audio = new window.Audio(`/guide_${lang}.mp3`);
    audioRef.current = audio;
    audio.play();
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [i18n.language]);
  let recognitionRef = null;

  useEffect(() => {
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

    setUser(parsedUser);
    fetchDashboardData(parsedUser.id);
    fetchLatestVolunteerReply(parsedUser.id);
  }, [navigate]);

  const fetchDashboardData = async (parentId) => {
    try {
      const response = await fetch(`https://milestone-tracker-jrst.onrender.com/api/parents/dashboard/${parentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setChildren(data.children);
      } else {
        console.error('Failed to fetch dashboard data:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest volunteer reply for this parent
  const fetchLatestVolunteerReply = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`https://milestone-tracker-jrst.onrender.com/api/parents/tickets?parentId=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        // Find the latest closed ticket with a volunteerId (i.e., a reply)
        const replies = data.filter(t => t.status === 'closed' && t.volunteerId);
        if (replies.length > 0) {
          replies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLatestVolunteerReply(replies[0]);
          // Only show red dot if reply is new (not viewed)
          setHasNewReply(!localStorage.getItem('lastViewedReplyId') || localStorage.getItem('lastViewedReplyId') !== replies[0]._id);
        } else {
          setLatestVolunteerReply(null);
          setHasNewReply(false);
        }
      }
    } catch (error) {
      setLatestVolunteerReply(null);
      setHasNewReply(false);
    }
  };

  useEffect(() => {
    fetchLatestVolunteerReply();
  }, [user, showTicketReplies]);

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadStatus('');
    setUploadProgress(0);

    console.log('Before creating submission data:');
    console.log('Selected child:', selectedChild);
    console.log('Selected milestone:', selectedMilestone);
    console.log('Selected file:', selectedFile);
    console.log('Media URL:', mediaUrl);

    try {
      let response, data;

      if (selectedFile) {
        // File upload submission
        setUploadStatus('uploading');
        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('childId', selectedChild?.id);
        formData.append('milestoneId', selectedMilestone?.id);

        console.log('Submitting with file upload:', {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        });

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener('load', async () => {
            try {
              const result = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadStatus('success');
                await fetchDashboardData(user.id);
                setShowSubmissionForm(false);
                setSelectedMilestone(null);
                setMediaUrl('');
                setSelectedFile(null);
                setUploadProgress(0);
                setUploadStatus('');
                alert('Milestone submitted successfully with file upload!');
              } else {
                setUploadStatus('error');
                console.error('Upload failed:', result);
                alert(result.error || 'Failed to upload file');
              }
            } catch (error) {
              setUploadStatus('error');
              console.error('Response parsing error:', error);
              alert('Upload failed. Please try again.');
            } finally {
              setSubmitting(false);
            }
          });

          xhr.addEventListener('error', () => {
            setUploadStatus('error');
            setSubmitting(false);
            alert('Network error during upload. Please try again.');
          });

          xhr.open('POST', 'https://milestone-tracker-jrst.onrender.com/api/parents/milestone/submit-with-file');
          xhr.send(formData);
        });

      } else {
        // URL submission (legacy)
        const submissionData = {
          childId: selectedChild?.id,
          milestoneId: selectedMilestone?.id,
          mediaUrl: mediaUrl.trim() || null
        };
        
        console.log('Submitting with URL:', submissionData);

        response = await fetch('https://milestone-tracker-jrst.onrender.com/api/parents/milestone/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        data = await response.json();

        if (response.ok) {
          await fetchDashboardData(user.id);
          setShowSubmissionForm(false);
          setSelectedMilestone(null);
          setMediaUrl('');
          setSelectedFile(null);
          setUploadProgress(0);
          setUploadStatus('');
          alert('Milestone submitted successfully!');
        } else {
          console.error('Submission failed:', data);
          alert(data.error || 'Failed to submit milestone');
        }
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('Submission error:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image (JPEG, PNG, GIF) or video (MP4, AVI, MOV) file.');
        return;
      }

      // Validate file size (5MB for images, 50MB for videos)
      const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = file.type.startsWith('image/') ? '5MB' : '50MB';
        alert(`File size must be less than ${maxSizeMB}.`);
        return;
      }

      setSelectedFile(file);
      setMediaUrl(''); // Clear URL when file is selected
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ticket submission handler
  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setTicketSubmitting(true);
    setTicketSuccess(false);
    try {
      const response = await fetch('https://milestone-tracker-jrst.onrender.com/api/parents/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: user.id,
          message: ticketMessage.trim(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setTicketSubmitting(false);
        setTicketSuccess(true);
        setTicketMessage('');
        setTimeout(() => {
          setShowTicketModal(false);
          setTicketSuccess(false);
        }, 1500);
      } else {
        setTicketSubmitting(false);
        alert(data.error || 'Failed to send ticket');
      }
    } catch (error) {
      setTicketSubmitting(false);
      alert('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Completed';
      case 'rejected': return 'Needs Review';
      case 'pending': return 'Under Review';
      default: return 'Not Started';
    }
  };

  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognitionRef) {
      recognitionRef = new SpeechRecognition();
    }
    recognitionRef.lang = ticketLang;
    recognitionRef.interimResults = false;
    recognitionRef.maxAlternatives = 1;
    setIsListening(true);
    recognitionRef.onresult = async (event) => {
      let transcript = event.results[0][0].transcript;
      if (ticketLang === 'hi-IN') {
        // Translate to Hindi if not already (most browsers will return Hindi text for hi-IN)
        // If you want to ensure translation, you can use a translation API here.
        setTicketMessage(prev => prev + (prev ? ' ' : '') + transcript);
      } else {
        setTicketMessage(prev => prev + (prev ? ' ' : '') + transcript);
      }
      setIsListening(false);
    };
    recognitionRef.onerror = (event) => {
      setIsListening(false);
      alert('Speech recognition error: ' + event.error);
    };
    recognitionRef.onend = () => setIsListening(false);
    recognitionRef.start();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('parentDashboardTitle')}</h1>
              <p className="text-gray-600">{t('welcomeBack', { name: user?.name })}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/child-registration')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('addChild') || 'Add Child'}
              </button>
              <LanguageSwitcher />
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTicketReplies(true);
                    if (latestVolunteerReply) {
                      localStorage.setItem('lastViewedReplyId', latestVolunteerReply._id);
                      setHasNewReply(false);
                    }
                  }}
                  className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                  title="View Latest Reply"
                >
                  <span role="img" aria-label="messages" className="text-2xl">💬</span>
                  {hasNewReply && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500"></span>
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowTicketModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Raise a Ticket
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👶</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noChildrenFound')}</h3>
            <p className="text-gray-600 mb-6">{t('noChildrenMessage') || 'Start tracking your child\'s developmental milestones by adding them to your account.'}</p>
            <button
              onClick={() => navigate('/child-registration')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-medium inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addFirstChild') || 'Add Your First Child'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {children.map((child) => (
              <div key={child.id} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{child.name}</h2>
                      <p className="text-gray-600">
                        {t('age')}: {child.age} • {t('ageGroup')}: {child.ageGroup}
                      </p>
                      {(child.gender || child.medicalConditions || child.allergies) && (
                        <div className="mt-2 text-sm text-gray-500">
                          {child.gender && <span className="mr-4">{t('gender')}: {child.gender}</span>}
                          {child.medicalConditions && (
                            <div className="mt-1">
                              <span className="font-medium">{t('medicalConditions')}:</span> {child.medicalConditions}
                            </div>
                          )}
                          {child.allergies && (
                            <div className="mt-1">
                              <span className="font-medium">{t('allergies')}:</span> {child.allergies}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {child.progress.completed}/{child.progress.total}
                      </div>
                      <p className="text-sm text-gray-600">{t('milestonesCompleted')}</p>
                      <button
                        onClick={() => navigate('/child-registration')}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 underline"
                      >
                        {t('editChildInfo') || 'Edit Info'}
                      </button>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{t('progress')}</span>
                      <span>{Math.round((child.progress.completed / child.progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(child.progress.completed / child.progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">{child.progress.completed}</div>
                      <div className="text-xs text-gray-600">{t('completed')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">{child.progress.pending}</div>
                      <div className="text-xs text-gray-600">{t('underReview')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">{child.progress.rejected}</div>
                      <div className="text-xs text-gray-600">{t('needsReview')}</div>
                    </div>
                  </div>
                </div>
                {/* Milestones */}
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('recentMilestones')}</h3>
                  <div className="grid gap-4">
                    {child.milestones.slice(0, 6).map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {milestone.category}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {t('age')} {milestone.ageGroup}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                            {t(getStatusText(milestone.status))}
                          </span>
                          {milestone.status === 'not_started' && (
                            <button
                              onClick={() => {
                                setSelectedChild(child);
                                setSelectedMilestone(milestone);
                                setShowSubmissionForm(true);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              {t('submit')}
                            </button>
                          )}
                          {milestone.mediaUrl && (
                            <a
                              href={milestone.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 text-xs"
                            >
                              {t('viewMedia')}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setSelectedChild(child)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      {t('viewAllMilestones', { count: child.milestones.length })}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Submission Form Modal */}
      {showSubmissionForm && selectedMilestone && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('submitMilestoneFor', { title: selectedMilestone.title })}
            </h3>
            <form onSubmit={handleSubmitMilestone}>
              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Photo or Video
                </label>
                
                {/* Drag and Drop Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : selectedFile 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="text-green-600">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-900 font-medium">{selectedFile.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-xs text-gray-500">
                        Images: PNG, JPG, GIF up to 5MB<br />
                        Videos: MP4, AVI, MOV up to 50MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OR Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* URL Input (Legacy) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediaUrlOptional')}
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedFile(null); // Clear file when URL is entered
                    }
                  }}
                  placeholder="https://example.com/photo-or-video.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!!selectedFile}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('provideMediaLink')}
                </p>
              </div>

              {/* Upload Progress */}
              {(uploadProgress > 0 || uploadStatus) && (
                <div className="mb-4">
                  {uploadStatus === 'uploading' && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  {uploadStatus === 'success' && (
                    <div className="flex items-center text-green-600 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Upload completed successfully!
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center text-red-600 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Upload failed. Please try again.
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmissionForm(false);
                    setSelectedMilestone(null);
                    setMediaUrl('');
                    setSelectedFile(null);
                    setUploadProgress(0);
                    setUploadStatus('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadStatus === 'uploading' || (!selectedFile && !mediaUrl.trim())}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {submitting || uploadStatus === 'uploading' ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Raise a Ticket</h3>
            <form onSubmit={handleTicketSubmit}>
              <div className="mb-2 flex items-center gap-2">
                <label htmlFor="lang-select" className="text-sm text-gray-700">Language:</label>
                <select
                  id="lang-select"
                  value={ticketLang}
                  onChange={e => setTicketLang(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-indigo-500"
                >
                  <option value="en-IN">English</option>
                  <option value="hi-IN">Hindi</option>
                </select>
                <button
                  type="button"
                  onClick={handleSpeechToText}
                  className={`ml-2 px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium flex items-center gap-1 ${isListening ? 'bg-indigo-800' : ''}`}
                  title={isListening ? 'Listening...' : 'Start voice input'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v2m0 0h4m-4 0H8m8-6a4 4 0 01-8 0V7a4 4 0 018 0v5z" /></svg>
                  {isListening ? 'Listening...' : 'Speak'}
                </button>
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder={ticketLang === 'hi-IN' ? 'अपनी समस्या यहाँ लिखें...' : 'Describe your concern here...'}
                value={ticketMessage}
                onChange={e => setTicketMessage(e.target.value)}
                required
              />
              {ticketSuccess && (
                <div className="mb-2 text-green-600 text-sm">Successfully sent!</div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowTicketModal(false); setTicketMessage(''); setTicketSuccess(false); }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {ticketSubmitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Latest Volunteer Reply Modal */}
      {showTicketReplies && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Volunteer Reply</h3>
            {latestVolunteerReply ? (
              <div className="space-y-2">
                <div className="font-medium text-gray-900 mb-1">{latestVolunteerReply.message}</div>
                <div className="text-xs text-gray-500">{new Date(latestVolunteerReply.createdAt).toLocaleString()}</div>
              </div>
            ) : (
              <div className="text-gray-500">No replies from volunteers yet.</div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowTicketReplies(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
