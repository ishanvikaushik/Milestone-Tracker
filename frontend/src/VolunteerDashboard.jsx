import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from "react-i18next";

const VolunteerDashboard = () => {
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [replyingTicketId, setReplyingTicketId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'volunteer') {
      navigate('/');
      return;
    }

    setUser(parsedUser);
    fetchDashboardData();
    fetchTickets();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('https://milestone-tracker-jrst.onrender.com/api/volunteers/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        setPendingSubmissions(data.pendingSubmissions);
        setStatistics(data.stats); // Fixed: backend returns 'stats' not 'statistics'
      } else {
        console.error('Failed to fetch dashboard data:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubmissions = async (status = 'all') => {
    try {
      const response = await fetch(`https://milestone-tracker-jrst.onrender.com/api/volunteers/submissions?status=${status}`);
      const data = await response.json();
      
      if (response.ok) {
        setAllSubmissions(data);
      } else {
        console.error('Failed to fetch submissions:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await fetch('https://milestone-tracker-jrst.onrender.com/api/parents/tickets');
      const data = await response.json();
      if (response.ok) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleReviewSubmission = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`https://milestone-tracker-jrst.onrender.com/api/volunteers/submission/${selectedSubmission._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: feedback.trim() || null,
          volunteerId: user.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh data
        await fetchDashboardData();
        if (filter !== 'pending') {
          await fetchAllSubmissions(filter);
        }
        
        setShowReviewModal(false);
        setSelectedSubmission(null);
        setReviewStatus('');
        setFeedback('');
        alert(`Submission ${reviewStatus} successfully!`);
      } else {
        alert(data.error || 'Failed to review submission');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    if (newFilter !== 'pending') {
      await fetchAllSubmissions(newFilter);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleReply = async (ticketId) => {
    if (!replyMessage.trim()) return;

    setReplySubmitting(true);
    setReplySuccess(false);

    try {
      const response = await fetch(`https://milestone-tracker-jrst.onrender.com/api/parents/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: replyMessage.trim(),
          volunteerId: user.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReplySuccess(true);
        setTimeout(() => {
          setReplyingTicketId(null);
          setReplyMessage('');
          setReplySuccess(false);
          fetchTickets();
        }, 2000);
      } else {
        alert(data.error || 'Failed to send reply');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImageFile = (fileType) => {
    return fileType && fileType.startsWith('image/');
  };

  const isVideoFile = (fileType) => {
    return fileType && fileType.startsWith('video/');
  };

  const getFileTypeFromUrl = (url) => {
    if (!url) return null;
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image/*';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return 'video/*';
    }
    return null;
  };

  const handleViewMedia = (submission) => {
    if (submission.mediaUrl) {
      setSelectedMedia({
        url: submission.mediaUrl,
        type: submission.fileType || getFileTypeFromUrl(submission.mediaUrl),
        fileName: submission.fileName || 'Uploaded Media',
        submission: submission
      });
      setShowMediaModal(true);
    }
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

  const currentSubmissions = filter === 'pending' ? pendingSubmissions : allSubmissions;
  const filterTabs = [
    { key: 'pending', label: t('pendingReview'), count: statistics.totalPending },
    { key: 'accepted', label: t('accepted'), count: statistics.totalAccepted },
    { key: 'rejected', label: t('rejected'), count: statistics.totalRejected },
    { key: 'all', label: t('allSubmissions'), count: statistics.totalSubmissions }
  ];
  const openTickets = tickets.filter(ticket => ticket.status === 'open');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('volunteerDashboardTitle')}</h1>
              <p className="text-gray-600">{t('welcomeBack', { name: user?.name })}</p>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tickets from Parents */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Parent Tickets</h2>
          </div>
          {ticketsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading tickets...</div>
          ) : openTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No open tickets found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {openTickets.map(ticket => (
                <div key={ticket._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{ticket.parentName}</div>
                      <div className="text-sm text-gray-600">{ticket.message}</div>
                      <div className="flex gap-2 mt-2">
                        {replyingTicketId === ticket._id ? (
                          <>
                            <input
                              type="text"
                              className="border rounded px-2 py-1 text-sm w-64"
                              placeholder="Type your reply..."
                              value={replyMessage}
                              onChange={e => setReplyMessage(e.target.value)}
                              disabled={replySubmitting}
                            />
                            <button
                              onClick={() => handleReply(ticket._id)}
                              disabled={replySubmitting || !replyMessage.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                            >
                              {replySubmitting ? 'Sending...' : replySuccess ? 'Sent!' : 'Send'}
                            </button>
                            <button
                              onClick={() => { setReplyingTicketId(null); setReplyMessage(''); }}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setReplyingTicketId(ticket._id); setReplyMessage(''); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 text-yellow-600">⏳</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('pendingReview')}</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalPending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 text-green-600">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('accepted')}</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalAccepted || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="w-6 h-6 text-red-600">❌</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('rejected')}</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalRejected || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 text-blue-600">📊</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('total')}</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalSubmissions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`${
                    filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label} ({tab.count || 0})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {filter === 'pending' ? t('pendingSubmissions') : 
               filter === 'all' ? t('allSubmissions') : 
               `${t(filter)} ${t('submissions')}`}
            </h2>
          </div>

          {currentSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noSubmissionsFound')}</h3>
              <p className="text-gray-600">
                {filter === 'pending' ? t('noSubmissionsWaiting') : t('noSubmissionsForFilter', { filter: t(filter) })}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentSubmissions.map((submission) => (
                <div key={submission._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {submission.milestoneTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {t(submission.status)}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>{t('child')}:</strong> {submission.childName} ({t('age')} {submission.childAge})</p>
                          <p><strong>{t('parent')}:</strong> {submission.parentName}</p>
                        </div>
                        <div>
                          <p><strong>{t('category')}:</strong> {submission.milestoneCategory}</p>
                          <p><strong>{t('submitted')}:</strong> {formatDate(submission.submittedAt)}</p>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-700">{submission.milestoneDescription}</p>
                      
                      {submission.feedback && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                          <strong>{t('feedback')}:</strong> {submission.feedback}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex items-center space-x-3">
                      {submission.mediaUrl && (
                        <>
                          <button
                            onClick={() => handleViewMedia(submission)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
                          >
                            <span>
                              {isImageFile(submission.fileType || getFileTypeFromUrl(submission.mediaUrl)) ? '🖼️' : 
                               isVideoFile(submission.fileType || getFileTypeFromUrl(submission.mediaUrl)) ? '🎥' : '📎'}
                            </span>
                            <span>View Media</span>
                          </button>
                          <a
                            href={submission.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                          >
                            Open Link
                          </a>
                        </>
                      )}
                      
                      {submission.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowReviewModal(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          {t('review')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('reviewSubmissionFor', { title: selectedSubmission.milestoneTitle })}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p><strong>{t('child')}:</strong> {selectedSubmission.childName} ({t('age')} {selectedSubmission.childAge})</p>
              <p><strong>{t('parent')}:</strong> {selectedSubmission.parentName}</p>
              <p className="mt-2"><strong>{t('milestone')}:</strong> {selectedSubmission.milestoneDescription}</p>
              {selectedSubmission.mediaUrl && (
                <div className="mt-3">
                  <strong>Media:</strong>
                  <div className="mt-2 flex items-center space-x-3">
                    <button
                      onClick={() => handleViewMedia(selectedSubmission)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
                    >
                      <span>
                        {isImageFile(selectedSubmission.fileType || getFileTypeFromUrl(selectedSubmission.mediaUrl)) ? '🖼️' : 
                         isVideoFile(selectedSubmission.fileType || getFileTypeFromUrl(selectedSubmission.mediaUrl)) ? '🎥' : '📎'}
                      </span>
                      <span>View Media</span>
                    </button>
                    <a 
                      href={selectedSubmission.mediaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm"
                    >
                      Open in New Tab
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleReviewSubmission}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('decision')}
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">{t('selectDecision')}</option>
                  <option value="accepted">{t('accept')}</option>
                  <option value="rejected">{t('reject')}</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('feedback')} {reviewStatus === 'rejected' && <span className="text-red-500">({t('requiredForRejection')})</span>}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required={reviewStatus === 'rejected'}
                  rows={3}
                  placeholder={reviewStatus === 'accepted' ? t('greatJobOptional') : t('pleaseProvideFeedback')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedSubmission(null);
                    setReviewStatus('');
                    setFeedback('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reviewStatus}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {submitting ? t('submitting') : t('submitReview')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {showMediaModal && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedMedia.submission.milestoneTitle}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedMedia.submission.childName} • {selectedMedia.fileName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMediaModal(false);
                  setSelectedMedia(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Media Content */}
            <div className="p-4 max-h-[70vh] overflow-auto">
              {isImageFile(selectedMedia.type) ? (
                <div className="text-center">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.fileName}
                    className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="hidden text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">🖼️</div>
                    <p className="text-gray-600">Unable to load image</p>
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm mt-2 inline-block"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : isVideoFile(selectedMedia.type) ? (
                <div className="text-center">
                  <video
                    controls
                    className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  >
                    <source src={selectedMedia.url} type={selectedMedia.type} />
                    Your browser does not support the video tag.
                  </video>
                  <div className="hidden text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">🎥</div>
                    <p className="text-gray-600">Unable to load video</p>
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm mt-2 inline-block"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📎</div>
                  <p className="text-gray-600 mb-4">Media type not supported for preview</p>
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Submitted:</span> {formatDate(selectedMedia.submission.submittedAt)}
              </div>
              <div className="flex space-x-3">
                <a
                  href={selectedMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  Open Link
                </a>
                {selectedMedia.submission.status === 'pending' && (
                  <button
                    onClick={() => {
                      setShowMediaModal(false);
                      setSelectedSubmission(selectedMedia.submission);
                      setShowReviewModal(true);
                      setSelectedMedia(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    Review Submission
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
