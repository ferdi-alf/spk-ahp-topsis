<?php

namespace App\Helpers;

use App\Models\Upload;
use App\Models\Alternative;
use App\Models\AlternativeValue;
use App\Models\Criteria;
use App\Models\Result;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardHelper
{
    /**
     * Get dashboard statistics with caching
     */
    public static function getStatistics()
    {
        return Cache::remember('dashboard_stats', 300, function () {
            return [
                'totalUploads' => Upload::count(),
                'totalAlternatives' => Alternative::count(),
                'totalCriteria' => Criteria::count(),
                'totalResults' => Result::count(),
            ];
        });
    }

    /**
     * Get top performing employees across all evaluations
     */
    public static function getTopEmployees($limit = 10)
    {
        return Result::select('alternative_id', DB::raw('AVG(topsis_ahp_score) as avg_score'))
            ->with('alternative')
            ->groupBy('alternative_id')
            ->orderBy('avg_score', 'desc')
            ->limit($limit)
            ->get()
            ->map(function($item, $index) {
                return [
                    'rank' => $index + 1,
                    'name' => $item->alternative->name,
                    'score' => round($item->avg_score, 4)
                ];
            });
    }

    /**
     * Get criteria data with weights
     */
    public static function getCriteriaData()
    {
        return Cache::remember('criteria_data', 600, function () {
            return Criteria::select('name', 'code', 'weight', 'type')
                ->orderBy('weight', 'desc')
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->name,
                        'code' => $item->code,
                        'weight' => round($item->weight, 4),
                        'type' => $item->type
                    ];
                });
        });
    }

    /**
     * Get score distribution for visualization
     */
    public static function getScoreDistribution()
    {
        $distribution = Result::select(
                DB::raw('CASE 
                    WHEN topsis_ahp_score >= 0.8 THEN "Excellent (≥0.8)"
                    WHEN topsis_ahp_score >= 0.6 THEN "Good (0.6-0.8)"
                    WHEN topsis_ahp_score >= 0.4 THEN "Average (0.4-0.6)"
                    WHEN topsis_ahp_score >= 0.2 THEN "Below Average (0.2-0.4)"
                    ELSE "Poor (<0.2)"
                END as category'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        // Ensure all categories exist
        $categories = [
            "Excellent (≥0.8)",
            "Good (0.6-0.8)",
            "Average (0.4-0.6)",
            "Below Average (0.2-0.4)",
            "Poor (<0.2)"
        ];

        return collect($categories)->map(function($category) use ($distribution) {
            return [
                'category' => $category,
                'count' => $distribution->get($category)?->count ?? 0
            ];
        });
    }

    /**
     * Get recent uploads with counts
     */
    public static function getRecentUploads($limit = 5)
    {
        return Upload::withCount('alternatives', 'results')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function($upload) {
                return [
                    'id' => $upload->id,
                    'filename' => $upload->filename,
                    'alternatives_count' => $upload->alternatives_count,
                    'results_count' => $upload->results_count,
                    'created_at' => $upload->created_at->format('d M Y H:i'),
                    'has_results' => $upload->results_count > 0
                ];
            });
    }

    /**
     * Get latest upload results
     */
    public static function getLatestResults($limit = 5)
    {
        $latestUpload = Upload::whereHas('results')
            ->latest()
            ->first();

        if (!$latestUpload) {
            return [];
        }

        return Result::where('upload_id', $latestUpload->id)
            ->with('alternative')
            ->orderBy('topsis_ahp_rank', 'asc')
            ->limit($limit)
            ->get()
            ->map(function($result) {
                return [
                    'rank' => $result->topsis_ahp_rank,
                    'name' => $result->alternative->name,
                    'ahp_score' => round($result->ahp_score, 4),
                    'topsis_score' => round($result->topsis_score, 4),
                    'combined_score' => round($result->topsis_ahp_score, 4)
                ];
            });
    }

    /**
     * Get method comparison data
     */
    public static function getMethodComparison($limit = 10)
    {
        $latestUpload = Upload::whereHas('results')
            ->latest()
            ->first();

        if (!$latestUpload) {
            return [];
        }

        return Result::where('upload_id', $latestUpload->id)
            ->with('alternative')
            ->orderBy('topsis_ahp_rank')
            ->limit($limit)
            ->get()
            ->map(function($result) {
                return [
                    'name' => $result->alternative->name,
                    'ahp_score' => round($result->ahp_score, 4),
                    'topsis_score' => round($result->topsis_score, 4),
                    'combined_score' => round($result->topsis_ahp_score, 4)
                ];
            });
    }

    /**
     * Get performance trends over time
     */
    public static function getPerformanceTrends()
    {
        return Upload::with(['results' => function($query) {
            $query->orderBy('topsis_ahp_rank', 'asc')
                ->limit(1);
        }])
        ->whereHas('results')
        ->latest()
        ->limit(6)
        ->get()
        ->reverse()
        ->map(function($upload) {
            $topResult = $upload->results->first();
            return [
                'upload_date' => $upload->created_at->format('d M'),
                'top_score' => $topResult ? round($topResult->topsis_ahp_score, 4) : 0,
                'avg_score' => round($upload->results->avg('topsis_ahp_score'), 4)
            ];
        });
    }

    /**
     * Get criteria comparison across uploads
     */
    public static function getCriteriaImpact()
    {
        $criteria = Criteria::all();
        
        return $criteria->map(function($crit) {
            $avgImpact = AlternativeValue::where('criteria_id', $crit->id)
                ->avg('value');
            
            return [
                'name' => $crit->code,
                'weight' => round($crit->weight, 4),
                'avg_value' => round($avgImpact, 2),
                'impact_score' => round($crit->weight * $avgImpact, 4)
            ];
        })->sortByDesc('impact_score')->values();
    }

    /**
     * Clear dashboard cache
     */
    public static function clearCache()
    {
        Cache::forget('dashboard_stats');
        Cache::forget('criteria_data');
    }
}