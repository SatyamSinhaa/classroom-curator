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
    qualifications: [],
    teachingRecords: []
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

        // Parse classes for teachingRecords
        const records = (data.classes || []).map(str => {
          // pattern: (Grade )?(\d+)(.*)
          const match = str.match(/(?:Grade\s*)?(\d+)(.*)/i);
          if (match) {
            return { classOnly: match[1], subject: match[2].trim() };
          }
          return { classOnly: str, subject: '' };
        });

        const profileData = {
          name: data.name || user.user_metadata?.full_name || '',
          subjects: data.subjects || [],
          classes: data.classes || [],
          board: data.board || '',
          bio: data.bio || '',
          experience_years: data.experience_years || '',
          qualifications: data.qualifications || [],
          teachingRecords: records
        };

        setProfile(profileData);
        setFormData(profileData);
      } else if (response.status === 404) {
        const defaultData = {
          name: user.user_metadata?.full_name || '',
          subjects: [],
          classes: [],
          board: '',
          bio: '',
          experience_years: '',
          qualifications: [],
          teachingRecords: []
        };
        setProfile(defaultData);
        setFormData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseClassString = (str) => {
    const match = str.match(/(?:Grade\s*)?(\d+)(.*)/i);
    if (match) {
      return { classOnly: match[1], subject: match[2].trim() };
    }
    return { classOnly: str, subject: '' };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = {
        user_id: user.id
      };

      if (formData.name && formData.name.trim()) dataToSend.name = formData.name.trim();
      if (formData.board && formData.board.trim()) dataToSend.board = formData.board.trim();
      if (formData.bio && formData.bio.trim()) dataToSend.bio = formData.bio.trim();
      if (formData.experience_years) dataToSend.experience_years = String(formData.experience_years).trim();
      if (formData.qualifications) dataToSend.qualifications = formData.qualifications.filter(q => q.trim());

      // Serialize teachingRecords to classes list
      const classStrings = formData.teachingRecords
        .filter(r => r.classOnly && r.subject)
        .map(r => `${r.classOnly} ${r.subject}`);

      dataToSend.classes = classStrings;
      dataToSend.subjects = [...new Set(formData.teachingRecords.map(r => r.subject).filter(s => s))];

      const response = await fetch('http://localhost:8000/teachers/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        fetchProfile();
        setIsEditing(false);
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile.classes) {
      const records = profile.classes.map(parseClassString);
      setFormData({ ...profile, teachingRecords: records });
    } else {
      setFormData({ ...profile, teachingRecords: [] });
    }
    setIsEditing(false);
  };

  const addTeachingRecord = () => {
    setFormData(prev => ({
      ...prev,
      teachingRecords: [...(prev.teachingRecords || []), { classOnly: '', subject: '' }]
    }));
  };

  const updateTeachingRecord = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      teachingRecords: prev.teachingRecords.map((rec, i) =>
        i === index ? { ...rec, [field]: value } : rec
      )
    }));
  };

  const removeTeachingRecord = (index) => {
    setFormData(prev => ({
      ...prev,
      teachingRecords: prev.teachingRecords.filter((_, i) => i !== index)
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
          <section>
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
          </section>

          {/* Classes & Subjects */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Classes & Subjects
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Add the classes you teach along with the subject for each class.
                Both fields are required for each entry.
              </p>

              {isEditing ? (
                <div className="space-y-3">
                  {(formData.teachingRecords || []).map((record, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={record.classOnly}
                          onChange={(e) => updateTeachingRecord(index, 'classOnly', e.target.value)}
                          placeholder="Class (e.g. 5)"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!record.classOnly && 'border-red-300'}`}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={record.subject}
                          onChange={(e) => updateTeachingRecord(index, 'subject', e.target.value)}
                          placeholder="Subject (e.g. Science)"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!record.subject && 'border-red-300'}`}
                        />
                      </div>
                      <button
                        onClick={() => removeTeachingRecord(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Remove entry"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTeachingRecord}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mt-2"
                  >
                    + Add Class & Subject
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.classes && profile.classes.length > 0 ? (
                    profile.classes.map((clsString, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200">
                        {clsString}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No classes/subjects specified</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Board & Experience */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="IB">IB</option>
                  <option value="IGCSE">IGCSE</option>
                  <option value="State Board">State Board</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded-md">{profile.board || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                  placeholder="e.g., 5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-2 rounded-md">{profile.experience_years ? `${profile.experience_years} years` : 'Not specified'}</p>
              )}
            </div>
          </section>

          {/* Qualifications */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Qualifications
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-2">
                  {(formData.qualifications || []).map((qual, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={qual}
                        onChange={(e) => updateQualification(index, e.target.value)}
                        placeholder="e.g., B.Ed"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => removeQualification(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addQualification} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    + Add Qualification
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {profile.qualifications && profile.qualifications.length > 0 ? (
                    profile.qualifications.map((qual, index) => (
                      <p key={index} className="text-gray-900 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                        {qual}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No qualifications specified</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Bio */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Biography</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Biography..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || 'No biography provided'}</p>
              )}
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
          {isEditing ? (
            <div className="space-x-4 flex">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
