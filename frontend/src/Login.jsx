import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bg from './assets/loginimg.jpeg';
import { useTranslation } from "react-i18next";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const audioRef = useRef(null);
  const usernameAudioRef = useRef(null);
  const passwordAudioRef = useRef(null);

  const handlePlayAudio = () => {
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Create a new Audio instance and play
    const audio = new window.Audio(process.env.BASE_URL ? process.env.BASE_URL + `/login_guide_${lang}.mp3` : `/login_guide_${lang}.mp3`);
    audioRef.current = audio;
    audio.play().catch((e) => {
      // Optionally handle play errors (e.g., user gesture required)
      // alert('Unable to play audio. Please check your browser settings.');
    });
  };

  const playUsernameAudio = () => {
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    if (usernameAudioRef.current) {
      usernameAudioRef.current.pause();
      usernameAudioRef.current.currentTime = 0;
    }
    const audio = new window.Audio(`/username_guide_${lang}.mp3`);
    usernameAudioRef.current = audio;
    audio.play();
  };

  const playPasswordAudio = () => {
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    if (passwordAudioRef.current) {
      passwordAudioRef.current.pause();
      passwordAudioRef.current.currentTime = 0;
    }
    const audio = new window.Audio(`/password_guide_${lang}.mp3`);
    passwordAudioRef.current = audio;
    audio.play();
  };

  useEffect(() => {
    // Play audio guide for login form
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    const audio = new window.Audio(`/login_guide_${lang}.mp3`);
    audioRef.current = audio;
    audio.play();
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [i18n.language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://milestone-tracker-jrst.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'parent') navigate('/parent-dashboard');
        else if (data.user.role === 'volunteer') navigate('/volunteer-dashboard');
      } else setError(data.error || 'Login failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-90 opacity-30 blur-sm"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* Form container */}
      <div className="relative z-10 max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
      </div>

        <form className="mt-8 space-y-6 bg-white bg-opacity-90 p-8 rounded-lg shadow-lg border border-pink-100" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {t('username')}
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={t('playUsernameAudioGuide')}
                  onClick={playUsernameAudio}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 22 }}
                >
                  <span role="img" aria-label="audio">🔊</span>
                </button>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  onFocus={playUsernameAudio}
                  className="mt-1 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ml-2"
                  placeholder={t('usernamePlaceholder')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={t('playPasswordAudioGuide')}
                  onClick={playPasswordAudio}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 22 }}
                >
                  <span role="img" aria-label="audio">🔊</span>
                </button>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  onFocus={playPasswordAudio}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ml-2"
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:opacity-50"
            >
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('noAccount')}{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                {t('registerHere')}
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('demoAccounts')}</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>{t('parent')}:</strong> rajesh_kumar / parent123</p>
              <p><strong>{t('volunteer')}:</strong> sneha_volunteer / volunteer123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
