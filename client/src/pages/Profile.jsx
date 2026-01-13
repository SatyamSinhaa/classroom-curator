import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Edit2, Save, X, BookOpen, Users, Award, GraduationCap } from 'lucide-react';

const Profile = () => {
  const { signOut, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    subjects: [],
    classes: [],
    board: '',
    bio: '',
    experience_years: '',
    qualifications: []
  });

  // Form state for editing
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/teachers/profile/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.name || user.user_metadata?.full_name || '',
          subjects: data.subjects || [],
          classes: data.classes || [],
          board: data.board || '',
          bio: data.bio || '',
          experience_years: data.experience_years || '',
          qualifications: data.qualifications || []
        });
        setFormData({
          name: data.name || user.user_metadata?.full_name || '',
          subjects: data.subjects || [],
          classes: data.classes || [],
          board: data.board || '',
          bio: data.bio || '',
          experience_years: data.experience_years || '',
          qualifications: data.qualifications || []
        });
      } else if (response.status === 404) {
        // Profile doesn't exist, use default values
        setProfile({
          name: user.user_metadata?.full_name || '',
          subjects: [],
          classes: [],
          board: '',
          bio: '',
          experience_years: '',
          qualifications: []
        });
        setFormData({
          name: user.user_metadata?.full_name || '',
          subjects: [],
          classes: [],
          board: '',
          bio: '',
          experience_years: '',
          qualifications: []
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send non-empty fields for partial updates
      const dataToSend = {
        user_id: user.id
      };

      // Only include fields that have actual values
      if (formData.name && formData.name.trim()) {
        dataToSend.name = formData.name.trim();
      }
      if (formData.subjects && formData.subjects.length > 0 && formData.subjects.some(s => s.trim())) {
        dataToSend.subjects = formData.subjects.filter(s => s.trim());
      }
      if (formData.classes && formData.classes.length > 0 && formData.classes.some(c => c.trim())) {
        dataToSend.classes = formData.classes.filter(c => c.trim());
      }
      if (formData.board && formData.board.trim()) {
        dataToSend.board = formData.board.trim();
      }
      if (formData.bio && formData.bio.trim()) {
        dataToSend.bio = formData.bio.trim();
      }
      if (formData.experience_years && String(formData.experience_years).trim()) {
        dataToSend.experience_years = String(formData.experience_years).trim();
      }
      if (formData.qualifications && formData.qualifications.length > 0 && formData.qualifications.some(q => q.trim())) {
        dataToSend.qualifications = formData.qualifications.filter(q => q.trim());
      }

      console.log('Sending data:', dataToSend);

      const response = await fetch('http://localhost:8000/teachers/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(formData);
        setIsEditing(false);
      } else {
        console.error('Failed to save profile:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const addSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, '']
    }));
  };

  const updateSubject = (index, value) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) => i === index ? value : subject)
    }));
  };

  const removeSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const addClass = () => {
    setFormData(prev => ({
      ...prev,
      classes: [...prev.classes, '']
    }));
  };

  const updateClass = (index, value) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.map((cls, i) => i === index ? value : cls)
    }));
  };

  const removeClass = (index) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== index)
    }));
  };

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const updateQualification = (index, value) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((qual, i) => i === index ? value : qual)
    }));
  };

  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Teaching Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Teaching Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects Taught</label>
                {isEditing ? (
                  <div className="space-y-2">
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => updateSubject(index, e.target.value)}
                          placeholder="e.g., Mathematics"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeSubject(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addSubject}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Subject
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.subjects && profile.subjects.length > 0 ? (
                      profile.subjects.map((subject, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {subject}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No subjects specified</p>
                    )}
                  </div>
                )}
              </div>

              {/* Classes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Classes Taught
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    {formData.classes.map((cls, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={cls}
                          onChange={(e) => updateClass(index, e.target.value)}
                          placeholder="e.g., Grade 10"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeClass(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addClass}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Class
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.classes && profile.classes.length > 0 ? (
                      profile.classes.map((cls, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {cls}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No classes specified</p>
                    )}
                  </div>
                )}
              </div>

              {/* Board */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education Board</label>
                {isEditing ? (
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData(prev => ({ ...prev, board: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="IB">IB (International Baccalaureate)</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="State Board">State Board</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.board || 'Not specified'}</p>
                )}
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-1" />
                  Years of Experience
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                    placeholder="e.g., 5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.experience_years ? `${profile.experience_years} years` : 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Qualifications
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-2">
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={qual}
                        onChange={(e) => updateQualification(index, e.target.value)}
                        placeholder="e.g., Bachelor of Education"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeQualification(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addQualification}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Qualification
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.qualifications && profile.qualifications.length > 0 ? (
                    profile.qualifications.map((qual, index) => (
                      <div key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2"></span>
                        <p key={index} className="text-gray-900">{qual}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No qualifications specified</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Biography</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself, your teaching philosophy, or any other information you'd like to share..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || 'No biography provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
          {isEditing ? (
            <div className="space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <div></div>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
