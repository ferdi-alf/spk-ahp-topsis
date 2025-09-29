export default function StatCard({ title, value, icon, gradient }) {
    const gradients = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600",
        purple: "from-purple-500 to-purple-600",
        orange: "from-orange-500 to-orange-600",
        red: "from-red-500 to-red-600",
        indigo: "from-indigo-500 to-indigo-600",
    };

    return (
        <div
            className={`bg-gradient-to-br ${
                gradients[gradient] || gradients.blue
            } overflow-hidden shadow-lg rounded-lg`}
        >
            <div className="p-5 text-white">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-12 w-12 text-white opacity-80"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {icon}
                        </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium truncate opacity-90">
                                {title}
                            </dt>
                            <dd className="flex items-baseline">
                                <div className="text-3xl font-bold">
                                    {value}
                                </div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
