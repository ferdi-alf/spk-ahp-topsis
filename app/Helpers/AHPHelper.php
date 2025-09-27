<?php

namespace App\Helpers;

use App\Models\Criteria;
use App\Models\CriteriaComparison;
use Illuminate\Support\Facades\Log;

class AHPHelper
{
    // 1. Bangun matriks perbandingan berpasangan
    public static function getPairwiseMatrix()
    {
        $criteria = Criteria::orderBy('id')->get();
        $n = count($criteria);

        if ($n < 2) {
            return [[], []];
        }

        $matrix = [];
        
        // Inisialisasi matriks dengan diagonal = 1
        foreach ($criteria as $i => $c1) {
            foreach ($criteria as $j => $c2) {
                if ($i == $j) {
                    $matrix[$i][$j] = 1;
                } else {
                    // Cari perbandingan yang ada
                    $comparison = CriteriaComparison::where('criteria1_id', $c1->id)
                        ->where('criteria2_id', $c2->id)
                        ->first();

                    if ($comparison) {
                        $matrix[$i][$j] = $comparison->value;
                    } else {
                        // Cari kebalikannya
                        $reverse = CriteriaComparison::where('criteria1_id', $c2->id)
                            ->where('criteria2_id', $c1->id)
                            ->first();
                        
                        $matrix[$i][$j] = $reverse ? (1 / $reverse->value) : 1;
                    }
                }
            }
        }

        return [$criteria, $matrix];
    }

    // 2. Normalisasi matriks
    public static function normalizePairwiseMatrix($matrix)
    {
        $n = count($matrix);
        if ($n == 0) return [];
        
        $normalized = [];
        $colSums = array_fill(0, $n, 0);

        // Hitung jumlah setiap kolom
        for ($j = 0; $j < $n; $j++) {
            for ($i = 0; $i < $n; $i++) {
                $colSums[$j] += $matrix[$i][$j];
            }
        }

        // Normalisasi setiap elemen
        for ($i = 0; $i < $n; $i++) {
            for ($j = 0; $j < $n; $j++) {
                $normalized[$i][$j] = $colSums[$j] > 0 ? $matrix[$i][$j] / $colSums[$j] : 0;
            }
        }

        return $normalized;
    }

    // 3. Hitung bobot (priority vector)
    public static function calculatePriorityVector($normalized)
    {
        $n = count($normalized);
        if ($n == 0) return [];
        
        $weights = [];
        
        // Rata-rata setiap baris
        for ($i = 0; $i < $n; $i++) {
            $sum = 0;
            for ($j = 0; $j < $n; $j++) {
                $sum += $normalized[$i][$j];
            }
            $weights[$i] = $sum / $n;
        }

        // Normalisasi bobot agar total = 1
        $total = array_sum($weights);
        if ($total > 0) {
            for ($i = 0; $i < $n; $i++) {
                $weights[$i] = $weights[$i] / $total;
            }
        }

        return $weights;
    }

    // 4. Cek konsistensi
    public static function checkConsistency($matrix, $weights)
    {
        $n = count($matrix);
        
        if ($n < 2) {
            return [
                'lambdaMax' => $n,
                'CI' => 0,
                'CR' => 0,
                'isConsistent' => true,
            ];
        }

        // Hitung λmax
        $lambdaMax = 0;
        for ($i = 0; $i < $n; $i++) {
            $sumRow = 0;
            for ($j = 0; $j < $n; $j++) {
                $sumRow += $matrix[$i][$j] * $weights[$j];
            }
            if ($weights[$i] > 0) {
                $lambdaMax += $sumRow / $weights[$i];
            }
        }
        $lambdaMax = $lambdaMax / $n;

        // Hitung CI
        $CI = ($lambdaMax - $n) / ($n - 1);

        // Random Index
        $RI = [
            1 => 0.00,
            2 => 0.00,
            3 => 0.58,
            4 => 0.90,
            5 => 1.12,
            6 => 1.24,
            7 => 1.32,
            8 => 1.41,
            9 => 1.45,
            10 => 1.49,
        ];

        $riValue = $RI[$n] ?? 1.49;
        $CR = $riValue > 0 ? $CI / $riValue : 0;

       return [
    'lambdaMax' => $lambdaMax,
    'ci' => $CI,
    'cr' => $CR,
    'ri' => $riValue,
    'isConsistent' => $CR <= 0.1,
];

    }

    // 5. Hitung jumlah setiap baris matriks
    public static function calculateRowSums($matrix)
    {
        $rowSums = [];
        $n = count($matrix);
        
        for ($i = 0; $i < $n; $i++) {
            $sum = 0;
            for ($j = 0; $j < $n; $j++) {
                $sum += $matrix[$i][$j];
            }
            $rowSums[$i] = $sum;
        }
        
        return $rowSums;
    }

    // 6. Update bobot kriteria di database
    public static function updateCriteriaWeights($weights, $criteria)
    {
        foreach ($criteria as $index => $criterion) {
            if (isset($weights[$index])) {
                $criterion->update(['weight' => $weights[$index]]);
            }
        }
    }

    // 7. Jalankan semua step
    public static function calculate()
    {
        try {
            [$criteria, $matrix] = self::getPairwiseMatrix();
            
            if (empty($criteria) || count($criteria) < 2) {
                return [
                    'error' => 'Minimal 2 kriteria diperlukan untuk analisis AHP',
                    'criteria' => $criteria,
                    'matrix' => [],
                    'normalized' => [],
                    'weights' => [],
                    'rowSums' => [],
                    'consistency' => null,
                ];
            }

            $normalized = self::normalizePairwiseMatrix($matrix);
            $weights = self::calculatePriorityVector($normalized);
            $rowSums = self::calculateRowSums($matrix);
            $consistency = self::checkConsistency($matrix, $weights);

            // Update bobot di database
            self::updateCriteriaWeights($weights, $criteria);

            return [
                'criteria' => $criteria,
                'matrix' => $matrix,
                'normalized' => $normalized,
                'weights' => $weights,
                'rowSums' => $rowSums,
                'consistency' => $consistency,
                'error' => null,
            ];
        } catch (\Exception $e) {
            return [
                'error' => 'Error dalam perhitungan AHP: ' . $e->getMessage(),
                'criteria' => [],
                'matrix' => [],
                'normalized' => [],
                'weights' => [],
                'rowSums' => [],
                'consistency' => null,
            ];
        }
    }

    // 8. Get hasil perhitungan dalam format yang siap untuk API
    public static function getCalculationResults()
    {
        $result = self::calculate();
        
        if ($result['error']) {
            return [
                'success' => false,
                'message' => $result['error'],
                'data' => null
            ];
        }

        return [
            'success' => true,
            'data' => [
                'criteria' => $result['criteria']->map(function($criterion, $index) use ($result) {
                    return [
                        'id' => $criterion->id,
                        'code' => $criterion->code,
                        'name' => $criterion->name,
                        'type' => $criterion->type,
                        'weight' => $result['weights'][$index] ?? 0,
                        'weight_percentage' => ($result['weights'][$index] ?? 0) * 100,
                    ];
                }),
                'matrix' => $result['matrix'],
                'normalized_matrix' => $result['normalized'],
                'weights' => $result['weights'],
                'row_sums' => $result['rowSums'],
                'consistency' => $result['consistency'],
                'ranking' => self::getCriteriaRanking($result['criteria'], $result['weights'])
            ]
        ];
    }

    // 9. Get ranking kriteria
    public static function getCriteriaRanking($criteria, $weights)
    {
        $ranking = [];
        
        foreach ($criteria as $index => $criterion) {
            $ranking[] = [
                'id' => $criterion->id,
                'code' => $criterion->code,
                'name' => $criterion->name,
                'type' => $criterion->type,
                'weight' => $weights[$index] ?? 0,
                'weight_percentage' => ($weights[$index] ?? 0) * 100,
                'rank' => 0 // will be set after sorting
            ];
        }

        // Sort by weight descending
        usort($ranking, function($a, $b) {
            return $b['weight'] <=> $a['weight'];
        });

        // Set rank
        foreach ($ranking as $index => &$item) {
            $item['rank'] = $index + 1;
        }

        return $ranking;
    }

    // 10. Validasi data untuk AHP
    public static function validateAHPData()
    {
        $criteriaCount = Criteria::count();
        $comparisonCount = CriteriaComparison::count();
        
        $requiredComparisons = $criteriaCount * ($criteriaCount - 1) / 2;

        // Log::info('kriteria totoal', [
        //       'criteria_count' => $criteriaCount,
        //     'comparison_count' => $comparisonCount,
        //     'required_comparisons' => $requiredComparisons,
        //     'has_enough_criteria' => $criteriaCount >= 2,
        //     'has_complete_comparisons' => $comparisonCount >= $requiredComparisons,
        //     'is_ready_for_calculation' => $criteriaCount >= 2 && $comparisonCount >= $requiredComparisons
        // ]);
        
        return [
            'criteria_count' => $criteriaCount,
            'comparison_count' => $comparisonCount,
            'required_comparisons' => $requiredComparisons,
            'has_enough_criteria' => $criteriaCount >= 2,
            'has_complete_comparisons' => $comparisonCount >= $requiredComparisons,
            'is_ready_for_calculation' => $criteriaCount >= 2 && $comparisonCount >= $requiredComparisons
        ];
    }
}