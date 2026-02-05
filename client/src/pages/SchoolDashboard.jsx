import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SchoolDashboard() {
    const { schoolId } = useParams()
    const navigate = useNavigate()
    const { setSelectedSchool } = useAuth()
    const [school, setSchool] = useState(null)
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true;
        const fetchSchoolData = async () => {
            try {
                setLoading(true)
                // Fetch school details
                const schoolRes = await fetch(`${API_URL}/schools/${schoolId}`)
                if (!schoolRes.ok) throw new Error('School not found')
                const schoolData = await schoolRes.json()

                if (isMounted) {
                    setSchool(schoolData)
                    setSelectedSchool(schoolData)

                    // Fetch teachers
                    const teachersRes = await fetch(`${API_URL}/schools/${schoolId}/teachers`)
                    if (teachersRes.ok) {
                        const teachersData = await teachersRes.json()
                        setTeachers(teachersData)
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching school dashboard data:', err)
                    setError(err.message)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        if (schoolId) {
            fetchSchoolData()
        }

        return () => { isMounted = false }
    }, [schoolId, setSelectedSchool])

    const handleLoginRedirect = () => {
        navigate('/login', { state: { school } })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (error || !school) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! {error || 'School not found'}</h1>
                    <button
                        onClick={() => navigate('/schools')}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                        Back to School List
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Banner */}
            <div className="bg-indigo-700 text-white py-12 px-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black">{school.name}</h1>
                            <p className="text-indigo-100 mt-1 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {school.address || 'Address not listed'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLoginRedirect}
                        className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95"
                    >
                        Teacher Login
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto w-full px-4 py-12 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content: Teachers List */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900">Registered Faculty</h2>
                            <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">
                                {teachers.length} Members
                            </span>
                        </div>

                        {teachers.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">No teachers registered yet</h3>
                                <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                    Be the first to join {school.name}'s digital portal and start building innovative lesson plans.
                                </p>
                                <button
                                    onClick={handleLoginRedirect}
                                    className="mt-6 font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    Create your profile now →
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {teachers.map((teacher) => (
                                    <div key={teacher.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-shadow">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:scale-110 transition-transform">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-lg font-bold text-gray-900 truncate">{teacher.name}</h4>

                                            {/* Experience */}
                                            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                                                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span>{teacher.experience_years ? `${teacher.experience_years} Years EXP` : 'New Faculty'}</span>
                                            </div>

                                            {/* Classes & Subjects */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {/* Show Classes first */}
                                                {teacher.classes?.slice(0, 2).map((cls, idx) => (
                                                    <span key={`class-${idx}`} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-100 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        {cls}
                                                    </span>
                                                ))}
                                                {/* Then show Subjects, filtered to avoid duplicates already in classes */}
                                                {teacher.subjects
                                                    ?.filter(s => !teacher.classes?.some(c => c.toLowerCase().includes(s.toLowerCase())))
                                                    ?.slice(0, 2)
                                                    .map((subject, idx) => (
                                                        <span key={`subject-${idx}`} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                            {subject}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: School Info */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">School Details</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-indigo-500 mt-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                        <p className="text-gray-900 font-medium">{school.contact_email || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="text-indigo-500 mt-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                                        <p className="text-gray-900 font-medium">{school.contact_phone || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white">
                            <h3 className="text-xl font-bold mb-4">Start Planning</h3>
                            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                                Are you a teacher at {school.name}? Log in now to access our AI tools for lesson generation, unit planning, and assessment builders tailored for your school.
                            </p>
                            <button
                                onClick={handleLoginRedirect}
                                className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg"
                            >
                                Go to Portal
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100 mt-auto">
                <p>© 2026 Classroom Curator AI. All rights reserved.</p>
                <button
                    onClick={() => navigate('/schools')}
                    className="mt-2 text-indigo-500 hover:text-indigo-700 font-bold"
                >
                    ← View All Schools
                </button>
            </footer>
        </div>
    )
}
