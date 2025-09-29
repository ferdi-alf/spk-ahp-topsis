<?php

namespace App\Http\Controllers;

use App\Helpers\DashboardHelper;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get all dashboard data using helper
        $stats = DashboardHelper::getStatistics();
        $topEmployees = DashboardHelper::getTopEmployees(10);
        $criteriaData = DashboardHelper::getCriteriaData();
        $recentUploads = DashboardHelper::getRecentUploads(5);
        $scoreDistribution = DashboardHelper::getScoreDistribution();
        $methodComparison = DashboardHelper::getMethodComparison(10);
        $latestResults = DashboardHelper::getLatestResults(5);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'topEmployees' => $topEmployees,
            'criteriaData' => $criteriaData,
            'recentUploads' => $recentUploads,
            'scoreDistribution' => $scoreDistribution,
            'methodComparison' => $methodComparison,
            'latestResults' => $latestResults
        ]);
    }

    /**
     * Clear dashboard cache
     */
    public function clearCache()
    {
        DashboardHelper::clearCache();
        
        return redirect()->route('dashboard')
            ->with('success', 'Cache dashboard berhasil dibersihkan');
    }
}