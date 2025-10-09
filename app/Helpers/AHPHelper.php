<?php

namespace App\Helpers;

use App\Models\Criteria;
use App\Models\CriteriaComparison;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AHPHelper
{
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
                    $matrix[$i][$j] = 1.0;
                } elseif ($i < $j) {
                    // ISI HANYA SEGITIGA ATAS (i < j)
                    $comparison = CriteriaComparison::where(function($query) use ($c1, $c2) {
                        $query->where('criteria1_id', $c1->id)
                              ->where('criteria2_id', $c2->id);
                    })->orWhere(function($query) use ($c1, $c2) {
                        $query->where('criteria1_id', $c2->id)
                              ->where('criteria2_id', $c1->id);
                    })->first();

                    if ($comparison) {
                        $rawValue = (float) $comparison->getAttributes()['value'];
                        $cleanValue = self::cleanValue($rawValue);
                        
                        // Tentukan arah perbandingan
                        if ($comparison->criteria1_id == $c1->id) {
                            // Jika comparison dari c1 ke c2
                            if ($comparison->favored_criteria == $c1->id) {
                                $matrix[$i][$j] = $cleanValue;
                            } else {
                                $matrix[$i][$j] = 1 / $cleanValue;
                            }
                        } else {
                            // Jika comparison dari c2 ke c1 (kebalik)
                            if ($comparison->favored_criteria == $c2->id) {
                                $matrix[$i][$j] = 1 / $cleanValue;
                            } else {
                                $matrix[$i][$j] = $cleanValue;
                            }
                        }
                    } else {
                        $matrix[$i][$j] = 1.0;
                    }
                } else {
                    $matrix[$i][$j] = 1.0 / $matrix[$j][$i];
                }
            }
        }

        return [$criteria, $matrix];
    }

    private static function cleanValue($value)
    {
        $rounded = round($value);
        if (abs($value - $rounded) < 0.01) {
            return (float) $rounded;
        }
        return (float) $value;
    }

    private static function decimalToFraction($decimal)
    {
        if (abs($decimal - 1) < 0.0001) {
            return '1';
        }
        
        if ($decimal >= 1) {
            $cleaned = self::cleanValue($decimal);
            if ($cleaned == floor($cleaned)) {
                return (string) intval($cleaned);
            }
            return number_format($cleaned, 2);
        }
        
        $reciprocal = 1 / $decimal;
        $cleaned = self::cleanValue($reciprocal);
        
        if ($cleaned == floor($cleaned)) {
            return '1/' . intval($cleaned);
        }
        return '1/' . number_format($cleaned, 2);
    }

    // PERBAIKAN: Normalisasi dengan presisi tinggi
    public static function normalizePairwiseMatrix($matrix)
    {
        $n = count($matrix);
        if ($n == 0) return [];
        
        $normalized = [];
        $colSums = array_fill(0, $n, 0.0);

        // Hitung jumlah KOLOM (vertikal)
        for ($j = 0; $j < $n; $j++) {
            for ($i = 0; $i < $n; $i++) {
                $colSums[$j] += $matrix[$i][$j];
            }
        }

        // Normalisasi: bagi dengan total kolom
        for ($i = 0; $i < $n; $i++) {
            for ($j = 0; $j < $n; $j++) {
                $normalized[$i][$j] = $colSums[$j] > 0 ? $matrix[$i][$j] / $colSums[$j] : 0.0;
            }
        }

        return [$normalized, $colSums]; // RETURN JUGA COLUMN SUMS
    }

    // PERBAIKAN: Priority vector dengan presisi penuh
    public static function calculatePriorityVector($normalized)
    {
        $n = count($normalized);
        if ($n == 0) return [];
        
        $weights = [];
        $rowSums = []; // Untuk detail perhitungan
        
        for ($i = 0; $i < $n; $i++) {
            $sum = 0.0;
            for ($j = 0; $j < $n; $j++) {
                $sum += $normalized[$i][$j];
            }
            $rowSums[$i] = $sum;
            $weights[$i] = $sum / $n;
        }

        return [$weights, $rowSums]; // RETURN JUGA ROW SUMS
    }

    public static function checkConsistency($matrix, $weights)
    {
        $n = count($matrix);
        
        if ($n < 2) {
            return [
                'lambdaMax' => $n,
                'ci' => 0,
                'cr' => 0,
                'ri' => 0,
                'isConsistent' => true,
                'weighted_sums' => [],
                'eigenvalues' => []
            ];
        }

        // Hitung weighted sum dan eigenvalue untuk setiap baris
        $weightedSums = [];
        $eigenvalues = [];
        
        for ($i = 0; $i < $n; $i++) {
            $sumRow = 0.0;
            for ($j = 0; $j < $n; $j++) {
                $sumRow += $matrix[$i][$j] * $weights[$j];
            }
            $weightedSums[$i] = $sumRow;
            $eigenvalues[$i] = $weights[$i] > 0 ? $sumRow / $weights[$i] : 0;
        }

        // Lambda max = rata-rata eigenvalues
        $lambdaMax = array_sum($eigenvalues) / $n;

        // CI = (λmax - n) / (n - 1)
        $CI = ($lambdaMax - $n) / ($n - 1);

        // Random Index
        $RI = [
            1 => 0.00, 2 => 0.00, 3 => 0.58, 4 => 0.90, 5 => 1.12,
            6 => 1.24, 7 => 1.32, 8 => 1.41, 9 => 1.45, 10 => 1.49,
        ];

        $riValue = $RI[$n] ?? 1.49;
        $CR = $riValue > 0 ? $CI / $riValue : 0;

        return [
            'lambdaMax' => $lambdaMax,
            'ci' => $CI,
            'cr' => $CR,
            'ri' => $riValue,
            'isConsistent' => $CR <= 0.1,
            'weighted_sums' => $weightedSums,
            'eigenvalues' => $eigenvalues
        ];
    }

    public static function calculateRowSums($matrix)
    {
        $rowSums = [];
        $n = count($matrix);
        
        for ($i = 0; $i < $n; $i++) {
            $sum = 0.0;
            for ($j = 0; $j < $n; $j++) {
                $sum += $matrix[$i][$j];
            }
            $rowSums[$i] = $sum;
        }
        
        return $rowSums;
    }

    public static function updateCriteriaWeights($weights, $criteria)
    {
        foreach ($criteria as $index => $criterion) {
            if (isset($weights[$index])) {
                DB::table('criteria')
                    ->where('id', $criterion->id)
                    ->update(['weight' => $weights[$index]]);
            }
        }
    }

    public static function getPairwiseMatrixWithFractions()
    {
        [$criteria, $matrix] = self::getPairwiseMatrix();
        
        if (empty($criteria) || count($criteria) < 2) {
            return [
                'criteria' => $criteria,
                'matrix_decimal' => [],
                'matrix_fraction' => []
            ];
        }
        
        $n = count($criteria);
        $matrixFraction = [];
        
        for ($i = 0; $i < $n; $i++) {
            for ($j = 0; $j < $n; $j++) {
                $matrixFraction[$i][$j] = self::decimalToFraction($matrix[$i][$j]);
            }
        }
        
        return [
            'criteria' => $criteria,
            'matrix_decimal' => $matrix,
            'matrix_fraction' => $matrixFraction
        ];
    }

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
                    'colSums' => [],
                    'normalizedRowSums' => [],
                    'consistency' => null,
                ];
            }

            [$normalized, $colSums] = self::normalizePairwiseMatrix($matrix);
            [$weights, $normalizedRowSums] = self::calculatePriorityVector($normalized);
            $rowSums = self::calculateRowSums($matrix);
            $consistency = self::checkConsistency($matrix, $weights);

            self::updateCriteriaWeights($weights, $criteria);

            return [
                'criteria' => $criteria,
                'matrix' => $matrix,
                'normalized' => $normalized,
                'weights' => $weights,
                'rowSums' => $rowSums,
                'colSums' => $colSums,
                'normalizedRowSums' => $normalizedRowSums,
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
                'colSums' => [],
                'normalizedRowSums' => [],
                'consistency' => null,
            ];
        }
    }

    public static function getCalculationResults() {
        $result = self::calculate();
        
        if ($result['error']) {
            return [
                'success' => false,
                'message' => $result['error'],
                'data' => null
            ];
        }

        $fractionData = self::getPairwiseMatrixWithFractions();
        
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
                'matrix_fraction' => $fractionData['matrix_fraction'],
                'normalized_matrix' => $result['normalized'],
                'weights' => $result['weights'],
                'row_sums' => $result['rowSums'],
                'col_sums' => $result['colSums'],
                'normalized_row_sums' => $result['normalizedRowSums'],
                'eigenvalues' => $result['consistency']['eigenvalues'],
                'weighted_sums' => $result['consistency']['weighted_sums'],
                'consistency' => [
                    'lambdaMax' => $result['consistency']['lambdaMax'],
                    'ci' => $result['consistency']['ci'],
                    'cr' => $result['consistency']['cr'],
                    'ri' => $result['consistency']['ri'],
                    'isConsistent' => $result['consistency']['isConsistent']
                ],
                'ranking' => self::getCriteriaRanking($result['criteria'], $result['weights'])
            ]
        ];
    }

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
                'rank' => 0
            ];
        }

        usort($ranking, function($a, $b) {
            return $b['weight'] <=> $a['weight'];
        });

        foreach ($ranking as $index => &$item) {
            $item['rank'] = $index + 1;
        }

        return $ranking;
    }

    public static function validateAHPData()
    {
        $criteriaCount = Criteria::count();
        $comparisonCount = CriteriaComparison::count();
        $requiredComparisons = $criteriaCount * ($criteriaCount - 1) / 2;
        
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