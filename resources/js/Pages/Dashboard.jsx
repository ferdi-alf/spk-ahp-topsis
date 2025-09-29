import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Dashboard({
    stats,
    topEmployees,
    criteriaData,
    recentUploads,
    scoreDistribution,
    methodComparison,
    latestResults,
}) {
    const criteriaChartData = {
        labels: criteriaData.map((c) => `${c.code}`),
        datasets: [
            {
                label: "Bobot Kriteria",
                data: criteriaData.map((c) => c.weight),
                backgroundColor: [
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(251, 146, 60, 0.8)",
                    "rgba(139, 92, 246, 0.8)",
                    "rgba(236, 72, 153, 0.8)",
                ],
                borderColor: [
                    "rgb(59, 130, 246)",
                    "rgb(16, 185, 129)",
                    "rgb(251, 146, 60)",
                    "rgb(139, 92, 246)",
                    "rgb(236, 72, 153)",
                ],
                borderWidth: 2,
            },
        ],
    };

    const distributionChartData = {
        labels: scoreDistribution.map((d) => d.category),
        datasets: [
            {
                label: "Jumlah Karyawan",
                data: scoreDistribution.map((d) => d.count),
                backgroundColor: [
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(251, 191, 36, 0.8)",
                    "rgba(251, 146, 60, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                ],
                borderColor: [
                    "rgb(16, 185, 129)",
                    "rgb(59, 130, 246)",
                    "rgb(251, 191, 36)",
                    "rgb(251, 146, 60)",
                    "rgb(239, 68, 68)",
                ],
                borderWidth: 2,
            },
        ],
    };

    const comparisonChartData = {
        labels: methodComparison.map((m) =>
            m.name.length > 15 ? m.name.substring(0, 15) + "..." : m.name
        ),
        datasets: [
            {
                label: "AHP Score",
                data: methodComparison.map((m) => m.ahp_score),
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
                fill: true,
            },
            {
                label: "TOPSIS Score",
                data: methodComparison.map((m) => m.topsis_score),
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                tension: 0.4,
                fill: true,
            },
            {
                label: "Combined Score",
                data: methodComparison.map((m) => m.combined_score),
                borderColor: "rgb(139, 92, 246)",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
        },
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard SPK AHP-TOPSIS
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Criteria Weight Chart */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Bobot Kriteria (AHP)
                            </h3>
                            <div style={{ height: "300px" }}>
                                <Doughnut
                                    data={criteriaChartData}
                                    options={chartOptions}
                                />
                            </div>
                            <div className="mt-4 space-y-2">
                                {criteriaData.map((c, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between items-center text-sm"
                                    >
                                        <span className="text-gray-600">
                                            <span className="font-semibold">
                                                {c.code}
                                            </span>{" "}
                                            - {c.name}
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                c.type === "benefit"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {c.type === "benefit"
                                                ? "Benefit"
                                                : "Cost"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Score Distribution Chart */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Distribusi Skor Karyawan
                            </h3>
                            <div style={{ height: "300px" }}>
                                <Bar
                                    data={distributionChartData}
                                    options={{
                                        ...chartOptions,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    stepSize: 1,
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Method Comparison Chart */}
                    {methodComparison.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Perbandingan Metode (Top 10 - Upload Terbaru)
                            </h3>
                            <div style={{ height: "350px" }}>
                                <Line
                                    data={comparisonChartData}
                                    options={chartOptions}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tables Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Employees Table */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    🏆 Top 10 Karyawan Terbaik
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Rank
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Nama Karyawan
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Avg Score
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {topEmployees.map((emp) => (
                                                <tr
                                                    key={emp.rank}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                                                emp.rank === 1
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : emp.rank ===
                                                                      2
                                                                    ? "bg-gray-100 text-gray-800"
                                                                    : emp.rank ===
                                                                      3
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-blue-50 text-blue-800"
                                                            }`}
                                                        >
                                                            {emp.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {emp.name}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            {emp.score}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Latest Results Table */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    📊 Hasil Perhitungan Terbaru
                                </h3>
                                {latestResults.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Rank
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Nama
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Score
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {latestResults.map((result) => (
                                                    <tr
                                                        key={result.rank}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 text-sm font-bold">
                                                                {result.rank}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {result.name}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                {
                                                                    result.combined_score
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="mt-2">
                                            Belum ada hasil perhitungan
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Uploads */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                📁 Riwayat Upload Terbaru
                            </h3>
                            {recentUploads.length > 0 ? (
                                <div className="space-y-3">
                                    {recentUploads.map((upload) => (
                                        <div
                                            key={upload.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-8 w-8 text-blue-500"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {upload.filename}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {upload.created_at}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm">
                                                <div className="text-center">
                                                    <span className="block font-semibold text-blue-600">
                                                        {
                                                            upload.alternatives_count
                                                        }
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        Karyawan
                                                    </span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block font-semibold text-green-600">
                                                        {upload.results_count}
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        Hasil
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Belum ada upload data</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
