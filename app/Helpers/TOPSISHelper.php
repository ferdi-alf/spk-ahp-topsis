<?php

namespace App\Helpers;

use App\Models\Upload;
use App\Models\Alternative;
use App\Models\Criterion;
use App\Models\AlternativeValue;
use App\Models\Criteria;

class TopsisHelper
{
    // 1. Matriks keputusan
    public static function getDecisionMatrix($uploadId)
    {
        $alternatives = Alternative::where('upload_id', $uploadId)->get();
        $criteria = Criteria::all();

        $matrix = [];
        foreach ($alternatives as $alt) {
            foreach ($criteria as $crit) {
                $val = AlternativeValue::where('alternative_id', $alt->id)
                    ->where('criterion_id', $crit->id)
                    ->value('value') ?? 0;
                $matrix[$alt->id][$crit->id] = $val;
            }
        }

        return [$alternatives, $criteria, $matrix];
    }

    // 2. Normalisasi
    public static function normalizeDecisionMatrix($matrix, $criteria)
    {
        $sums = [];
        foreach ($criteria as $crit) {
            $sums[$crit->id] = sqrt(array_sum(array_map(fn($row) => pow($row[$crit->id], 2), $matrix)));
        }

        $normalized = [];
        foreach ($matrix as $altId => $row) {
            foreach ($criteria as $crit) {
                $normalized[$altId][$crit->id] = $sums[$crit->id] > 0
                    ? $row[$crit->id] / $sums[$crit->id]
                    : 0;
            }
        }

        return $normalized;
    }

    // 3. Matriks berbobot (Y)
    public static function weightedMatrix($normalized, $weights)
    {
        $weighted = [];
        foreach ($normalized as $altId => $row) {
            foreach ($row as $critId => $val) {
                $weighted[$altId][$critId] = $val * $weights[$critId];
            }
        }
        return $weighted;
    }

    // 4. Solusi ideal
    public static function idealSolutions($weighted, $criteria)
    {
        $idealPos = [];
        $idealNeg = [];

        foreach ($criteria as $crit) {
            $values = array_column($weighted, $crit->id);

            if ($crit->type === 'benefit') {
                $idealPos[$crit->id] = max($values);
                $idealNeg[$crit->id] = min($values);
            } else {
                $idealPos[$crit->id] = min($values);
                $idealNeg[$crit->id] = max($values);
            }
        }

        return [$idealPos, $idealNeg];
    }

    // 5. Jarak
    public static function distances($weighted, $idealPos, $idealNeg)
    {
        $distances = [];
        foreach ($weighted as $altId => $row) {
            $dPos = 0;
            $dNeg = 0;
            foreach ($row as $critId => $val) {
                $dPos += pow($val - $idealPos[$critId], 2);
                $dNeg += pow($val - $idealNeg[$critId], 2);
            }
            $distances[$altId] = [
                'positive' => sqrt($dPos),
                'negative' => sqrt($dNeg),
            ];
        }
        return $distances;
    }

    // 6. Kedekatan relatif
    public static function relativeCloseness($distances)
    {
        $scores = [];
        foreach ($distances as $altId => $d) {
            $scores[$altId] = ($d['positive'] + $d['negative']) > 0
                ? $d['negative'] / ($d['positive'] + $d['negative'])
                : 0;
        }
        return $scores;
    }

    // 7. Orchestrator
    public static function calculate($uploadId, $weights)
    {
        [$alternatives, $criteria, $matrix] = self::getDecisionMatrix($uploadId);
        $normalized = self::normalizeDecisionMatrix($matrix, $criteria);
        $weighted = self::weightedMatrix($normalized, $weights);
        [$idealPos, $idealNeg] = self::idealSolutions($weighted, $criteria);
        $distances = self::distances($weighted, $idealPos, $idealNeg);
        $scores = self::relativeCloseness($distances);

        return [
            'decision_matrix' => $matrix,
            'normalized_matrix' => $normalized,
            'weighted_matrix' => $weighted,
            'ideal_positive' => $idealPos,
            'ideal_negative' => $idealNeg,
            'distances' => $distances,
            'scores' => $scores,
            'alternatives' => $alternatives,
            'criteria' => $criteria,
        ];
    }
}
