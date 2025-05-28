import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="bg-white ">
            {/* Hero Section */}
            <div className="relative bg-indigo-700 h-[96vh] ">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-indigo-600 mix-blend-multiply"></div>
                </div>

                <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 ">
                    <h1 className='text-yellow-200 text-4xl font-extrabold sm:text-5xl lg:text-6xl'>यतो धर्मस्ततो जयः</h1>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">NyayEase</h1>
                    <p className="mt-6 max-w-3xl text-xl text-indigo-100 text-center">
                        A digital e-portal for case management and online legal hearings in India.
                        Streamline legal processes, connect with advocates, and attend hearings online.
                    </p>
                    <div className="mt-10 flex gap-4">
                        <Link to="/register" className="inline-block bg-white py-3 px-6 border border-transparent rounded-md text-base font-medium text-indigo-700 hover:bg-gray-50">
                            Get Started
                        </Link>
                        <Link to="/about" className="inline-block bg-transparent py-3 px-6 border border-white rounded-md text-base font-medium text-white hover:bg-indigo-800">
                            Learn More
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
                        <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
                            Everything you need in one place
                        </p>
                        <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                            NyayEase brings together litigants, advocates, and court officials on a single platform.
                        </p>
                    </div>

                    <div className="mt-16">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1 */}
                            <div className="p-6 bg-white rounded-lg shadow-md">
                                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-indigo-500 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Case Management</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    File and track your cases online. Upload documents and monitor updates in real-time.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="p-6 bg-white rounded-lg shadow-md">
                                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-indigo-500 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Virtual Hearings</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Attend court hearings online from anywhere. Save time and travel expenses.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="p-6 bg-white rounded-lg shadow-md">
                                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-indigo-500 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Advocate Connect</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Find and connect with qualified advocates based on specialization and location.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-indigo-700">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        <span className="block">Ready to get started?</span>
                        <span className="block text-indigo-200">Register today and digitize your legal journey.</span>
                    </h2>
                    <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                        <div className="inline-flex rounded-md shadow">
                            <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50">
                                Sign Up
                            </Link>
                        </div>
                        <div className="ml-3 inline-flex rounded-md shadow">
                            <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage; 