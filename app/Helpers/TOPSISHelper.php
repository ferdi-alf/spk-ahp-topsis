<?php

namespace App\Helpers;

use App\Models\Upload;
use App\Models\Alternative;
use App\Models\AlternativeValue;
use App\Models\Criteria;
use App\Models\Result;
use Illuminate\Support\Facades\DB;

class TopsisHelper
{
    // 1. Matriks keputusan
    public static function getDecisionMatrix($uploadId)
    {
        $alternatives = Alternative::where('upload_id', $uploadId)->get();
        $criteria = Criteria::orderBy('id')->get();

        $matrix = [];
        foreach ($alternatives as $alt) {
            foreach ($criteria as $crit) {
                $val = AlternativeValue::where('alternative_id', $alt->id)
                    ->where('criteria_id', $crit->id)
                    ->value('value') ?? 0;
                $matrix[$alt->id][$crit->id] = floatval($val);
            }
        }

        return [$alternatives, $criteria, $matrix];
    }

    // 2. Normalisasi
    public static function normalizeDecisionMatrix($matrix, $criteria)
    {
        $sums = [];
        foreach ($criteria as $crit) {
            $sumSquares = 0;
            foreach ($matrix as $row) {
                $sumSquares += pow($row[$crit->id], 2);
            }
            $sums[$crit->id] = sqrt($sumSquares);
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
    public static function weightedMatrix($normalized, $criteria)
    {
        $weighted = [];
        foreach ($normalized as $altId => $row) {
            foreach ($criteria as $crit) {
                $weight = $crit->weight ?? 0;
                $weighted[$altId][$crit->id] = $row[$crit->id] * $weight;
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
    public static function distances($weighted, $idealPos, $idealNeg, $criteria)
    {
        $distances = [];
        foreach ($weighted as $altId => $row) {
            $dPos = 0;
            $dNeg = 0;
            foreach ($criteria as $crit) {
                $val = $row[$crit->id];
                $dPos += pow($val - $idealPos[$crit->id], 2);
                $dNeg += pow($val - $idealNeg[$crit->id], 2);
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
            $total = $d['positive'] + $d['negative'];
            $scores[$altId] = $total > 0 ? $d['negative'] / $total : 0;
        }
        return $scores;
    }

    // 7. Save hasil ke database
    public static function saveResults($uploadId, $alternatives, $ahpWeights, $topsisScores)
    {
        // Clear existing results for this upload
        Result::where('upload_id', $uploadId)->delete();

        // Calculate AHP scores (simple weighted sum)
        $ahpScores = [];
        foreach ($alternatives as $alt) {
            $score = 0;
            foreach ($ahpWeights as $critId => $weight) {
                $value = AlternativeValue::where('alternative_id', $alt->id)
                    ->where('criteria_id', $critId)
                    ->value('value') ?? 0;
                $score += $value * $weight;
            }
            $ahpScores[$alt->id] = $score;
        }

        // Create ranking arrays
        $ahpRanked = collect($ahpScores)->sortDesc();
        $topsisRanked = collect($topsisScores)->sortDesc();

        $results = [];
        foreach ($alternatives as $alt) {
            $ahpScore = $ahpScores[$alt->id];
            $topsisScore = $topsisScores[$alt->id];
            $combinedScore = ($ahpScore + $topsisScore) / 2;

            $results[] = [
                'upload_id' => $uploadId,
                'alternative_id' => $alt->id,
                'ahp_score' => $ahpScore,
                'topsis_score' => $topsisScore,
                'topsis_ahp_score' => $combinedScore,
                'ahp_rank' => array_search($alt->id, $ahpRanked->keys()->toArray()) + 1,
                'topsis_rank' => array_search($alt->id, $topsisRanked->keys()->toArray()) + 1,
            ];
        }

        // Sort by combined score for final ranking
        usort($results, function($a, $b) {
            return $b['topsis_ahp_score'] <=> $a['topsis_ahp_score'];
        });

        // Assign final ranking
        foreach ($results as $index => &$result) {
            $result['topsis_ahp_rank'] = $index + 1;
        }

        // Insert to database
        foreach ($results as $result) {
            Result::create($result);
        }

        return $results;
    }

    // 8. Orchestrator utama
    public static function calculate($uploadId)
    {
        try {
            [$alternatives, $criteria, $matrix] = self::getDecisionMatrix($uploadId);
            
            if (empty($alternatives) || empty($criteria)) {
                throw new \Exception('Data alternatif atau kriteria kosong');
            }

            // Get AHP weights
            $ahpWeights = [];
            foreach ($criteria as $crit) {
                $ahpWeights[$crit->id] = $crit->weight ?? 0;
            }

            // TOPSIS calculation
            $normalized = self::normalizeDecisionMatrix($matrix, $criteria);
            $weighted = self::weightedMatrix($normalized, $criteria);
            [$idealPos, $idealNeg] = self::idealSolutions($weighted, $criteria);
            $distances = self::distances($weighted, $idealPos, $idealNeg, $criteria);
            $topsisScores = self::relativeCloseness($distances);

            // Save results to database
            $results = self::saveResults($uploadId, $alternatives, $ahpWeights, $topsisScores);

            return [
                'success' => true,
                'data' => [
                    'decision_matrix' => $matrix,
                    'normalized_matrix' => $normalized,
                    'weighted_matrix' => $weighted,
                    'ideal_positive' => $idealPos,
                    'ideal_negative' => $idealNeg,
                    'distances' => $distances,
                    'topsis_scores' => $topsisScores,
                    'alternatives' => $alternatives,
                    'criteria' => $criteria,
                    'results' => $results,
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ];
        }
    }


    public static function getCalculationResults($uploadId)
    {
        return self::calculate($uploadId);
    }

    
    public static function getExportData($uploadId)
    {
        $upload = Upload::with(['alternatives', 'results.alternative'])->find($uploadId);
        $criteria = Criteria::orderBy('id')->get();

        if (!$upload) {
            throw new \Exception('Upload tidak ditemukan');
        }

        $exportData = [];
        foreach ($upload->results as $result) {
            $row = [
                'Nama Karyawan' => $result->alternative->name,
            ];

      
            foreach ($criteria as $crit) {
                $value = AlternativeValue::where('alternative_id', $result->alternative_id)
                    ->where('criteria_id', $crit->id)
                    ->value('value') ?? 0;
                $row[$crit->name] = $value;
            }

            
            $row['AHP Score'] = round($result->ahp_score, 4);
            $row['AHP Rank'] = $result->ahp_rank;
            $row['TOPSIS Score'] = round($result->topsis_score, 4);
            $row['TOPSIS Rank'] = $result->topsis_rank;
            $row['Combined Score'] = round($result->topsis_ahp_score, 4);
            $row['Final Rank'] = $result->topsis_ahp_rank;

            $exportData[] = $row;
        }

        return $exportData;
    }
}