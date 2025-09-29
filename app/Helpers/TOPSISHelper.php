<?php

namespace App\Helpers;

use App\Models\Upload;
use App\Models\Alternative;
use App\Models\AlternativeValue;
use App\Models\Criteria;
use App\Models\Result;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

    public static function relativeCloseness($distances)
    {
        $scores = [];
        foreach ($distances as $altId => $d) {
            $total = $d['positive'] + $d['negative'];
            $scores[$altId] = $total > 0 ? $d['negative'] / $total : 0;
        }
        return $scores;
    }

    public static function saveResults($uploadId, $alternatives, $ahpWeights, $topsisScores)
    {
        DB::beginTransaction();
        try {
            // Delete dengan lock untuk menghindari race condition
            DB::table('results')->where('upload_id', $uploadId)->delete();
            
            // Calculate AHP scores (simple weighted sum)
            $ahpScores = [];
            foreach ($alternatives as $alt) {
                $score = 0;
                $values = AlternativeValue::where('alternative_id', $alt->id)
                    ->get();
                
                foreach ($values as $altValue) {
                    $weight = $ahpWeights[$altValue->criteria_id] ?? 0;
                    $score += $altValue->value * $weight;
                }
                $ahpScores[$alt->id] = $score;
            }

            // Normalize AHP scores
            $maxAhp = max($ahpScores) ?: 1;
            foreach ($ahpScores as $altId => $score) {
                $ahpScores[$altId] = $score / $maxAhp;
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
                $result['created_at'] = now();
                $result['updated_at'] = now();
            }

            // Insert menggunakan DB::table untuk bulk insert
            DB::table('results')->insert($results);
            
            DB::commit();
            
            return Result::where('upload_id', $uploadId)
            ->with('alternative')
            ->orderBy('topsis_ahp_rank')
            ->get()
            ->toArray();
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Save results error: ' . $e->getMessage());
            throw $e;
        }
    }

    public static function calculate($uploadId)
    {
        try {
         
            $existingResults = Result::where('upload_id', $uploadId)->count();
            
            if ($existingResults > 0) {
               
                $results = Result::where('upload_id', $uploadId)
                    ->with('alternative')  // TAMBAHKAN INI
                    ->orderBy('topsis_ahp_rank')
                    ->get()
                    ->toArray();
                
                [$alternatives, $criteria, $matrix] = self::getDecisionMatrix($uploadId);
                $normalized = self::normalizeDecisionMatrix($matrix, $criteria);
                $weighted = self::weightedMatrix($normalized, $criteria);
                [$idealPos, $idealNeg] = self::idealSolutions($weighted, $criteria);
                $distances = self::distances($weighted, $idealPos, $idealNeg, $criteria);
                
      
                $topsisScores = [];
                foreach ($results as $result) {
                    $topsisScores[$result['alternative_id']] = $result['topsis_score'];
                }
                
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
            }
            
       
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
            Log::error('TOPSIS calculation error: ' . $e->getMessage());
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
        $upload = Upload::findOrFail($uploadId);
        $criteria = Criteria::orderBy('id')->get();

        $results = Result::where('upload_id', $uploadId)
            ->with('alternative')
            ->orderBy('topsis_ahp_rank')
            ->get();

        if ($results->isEmpty()) {
            throw new \Exception('Hasil perhitungan tidak ditemukan. Silakan hitung terlebih dahulu.');
        }

        $exportData = [];
        foreach ($results as $result) {
            $row = [
                'Rank' => $result->topsis_ahp_rank,
                'Nama Karyawan' => $result->alternative->name,
            ];

            // Ambil nilai ASLI dari alternative_values (nilai mentah dari upload)
            $values = AlternativeValue::where('alternative_id', $result->alternative_id)
                ->get()
                ->keyBy('criteria_id');

            // Tambahkan nilai mentah per kriteria
            foreach ($criteria as $crit) {
                $value = $values->get($crit->id);
                $row[$crit->name . ' (' . $crit->code . ')'] = $value ? $value->value : 0;
            }

            // Tambahkan skor-skor
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