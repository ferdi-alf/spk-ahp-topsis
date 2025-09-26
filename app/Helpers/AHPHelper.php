<?php

namespace App\Helpers;

use App\Models\Criteria;
use App\Models\CriteriaComparison;

class AHPHelper
{
    // 1. Bangun matriks perbandingan berpasangan
    public static function getPairwiseMatrix()
    {
        $criteria = Criteria::all();
        $n = count($criteria);

        $matrix = [];
        foreach ($criteria as $i => $c1) {
            foreach ($criteria as $j => $c2) {
                if ($i == $j) {
                    $matrix[$c1->id][$c2->id] = 1;
                } else {
                    $value = CriteriaComparison::where('criterion1_id', $c1->id)
                        ->where('criterion2_id', $c2->id)
                        ->value('value');

                    if (!$value) {
                        $reverse = CriteriaComparison::where('criterion1_id', $c2->id)
                            ->where('criterion2_id', $c1->id)
                            ->value('value');
                        $value = $reverse ? (1 / $reverse) : 1;
                    }

                    $matrix[$c1->id][$c2->id] = $value;
                }
            }
        }

        return [$criteria, $matrix];
    }

    // 2. Normalisasi matriks
    public static function normalizePairwiseMatrix($matrix)
    {
        $normalized = [];
        $colSums = [];

        // hitung jumlah kolom
        foreach ($matrix as $i => $row) {
            foreach ($row as $j => $val) {
                $colSums[$j] = ($colSums[$j] ?? 0) + $val;
            }
        }

        // normalisasi
        foreach ($matrix as $i => $row) {
            foreach ($row as $j => $val) {
                $normalized[$i][$j] = $val / $colSums[$j];
            }
        }

        return $normalized;
    }

    // 3. Hitung bobot (eigen vector aprox)
    public static function calculatePriorityVector($normalized)
    {
        $weights = [];
        foreach ($normalized as $i => $row) {
            $weights[$i] = array_sum($row) / count($row);
        }

        // normalisasi bobot agar total = 1
        $total = array_sum($weights);
        foreach ($weights as $i => $w) {
            $weights[$i] = $w / $total;
        }

        return $weights;
    }

    // 4. Cek konsistensi
    public static function checkConsistency($matrix, $weights)
    {
        $n = count($matrix);

        // hitung λmax
        $lambdaMax = 0;
        foreach ($matrix as $i => $row) {
            $sumRow = 0;
            foreach ($row as $j => $val) {
                $sumRow += $val * $weights[$j];
            }
            $lambdaMax += $sumRow / $weights[$i];
        }
        $lambdaMax = $lambdaMax / $n;

        $CI = ($lambdaMax - $n) / ($n - 1);

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
        ][$n] ?? 1.49;

        $CR = $CI / $RI;

        return [
            'lambdaMax' => $lambdaMax,
            'CI' => $CI,
            'CR' => $CR,
            'isConsistent' => $CR < 0.1,
        ];
    }

    // 5. Jalankan semua step
    public static function calculate()
    {
        [$criteria, $matrix] = self::getPairwiseMatrix();
        $normalized = self::normalizePairwiseMatrix($matrix);
        $weights = self::calculatePriorityVector($normalized);
        $consistency = self::checkConsistency($matrix, $weights);

        return [
            'criteria' => $criteria,
            'matrix' => $matrix,
            'normalized' => $normalized,
            'weights' => $weights,
            'consistency' => $consistency,
        ];
    }
}
