import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SchoolForm from '../components/schools/SchoolForm'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SchoolList() {
    const [schools, setSchools] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchSchools()
    }, [])

    const fetchSchools = async () => {
        try {
            const response = await fetch(`${API_URL}/schools`)
            const data = await response.json()
            setSchools(data)
        } catch (error) {
            console.error('Error fetching schools:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSchoolSelect = (school) => {
        localStorage.setItem('selectedSchool', JSON.stringify(school))
        navigate(`/schools/${school.id}/dashboard`)
    }

    const handleSchoolCreated = () => {
        setShowForm(false)
        fetchSchools()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-pulse text-xl text-indigo-600 font-medium">Loading schools...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 pb-2">
                        Classroom Curator
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Welcome! Select your school to access your AI-powered teaching dashboard or add a new one to get started.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:scale-105 shadow-xl"
                    >
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New School
                    </button>
                </div>

                {schools.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-3xl border border-white shadow-sm max-w-lg mx-auto">
                        <svg className="mx-auto h-24 w-24 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="mt-6 text-2xl font-bold text-gray-900">No schools registered</h3>
                        <p className="mt-3 text-gray-600 px-6">Ready to transform your classroom? Click the button above to register your school.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {schools.map((school) => (
                            <div
                                key={school.id}
                                onClick={() => handleSchoolSelect(school)}
                                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group border border-white hover:border-indigo-300 relative"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>

                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform">
                                        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                                        {school.name}
                                    </h3>

                                    <div className="space-y-4">
                                        {school.address && (
                                            <div className="flex items-start text-gray-600">
                                                <svg className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                <span className="line-clamp-2 text-sm leading-relaxed">{school.address}</span>
                                            </div>
                                        )}
                                        {(school.contact_email || school.contact_phone) && (
                                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                                {school.contact_email && (
                                                    <div className="flex items-center text-gray-600 text-sm">
                                                        <svg className="w-5 h-5 mr-3 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="truncate">{school.contact_email}</span>
                                                    </div>
                                                )}
                                                {school.contact_phone && (
                                                    <div className="flex items-center text-gray-600 text-sm">
                                                        <svg className="w-5 h-5 mr-3 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span>{school.contact_phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex items-center text-indigo-600 font-bold group-hover:translate-x-3 transition-transform duration-300">
                                        <span>Explore School</span>
                                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <SchoolForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleSchoolCreated}
                />
            )}
        </div>
    )
}
