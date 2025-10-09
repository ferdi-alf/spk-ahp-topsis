<?php

namespace App\Http\Controllers;

use App\Models\CriteriaComparison;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// CriteriaComparisonController.php
class CriteriaComparisonController extends Controller
{
    public function get(Request $request)
    {
        $comparisons = CriteriaComparison::with(['criteria1', 'criteria2'])
            ->get()
            ->map(function ($comp) {
                return [
                    'id' => $comp->id,
                    'criteria1_id' => $comp->criteria1_id,
                    'criteria2_id' => $comp->criteria2_id,
                    'value' => round((float) $comp->value, 3),  // 🔥 Ensure 3 decimal
                    'criteria1' => $comp->criteria1,
                    'criteria2' => $comp->criteria2,
                ];
            });
        
        return response()->json($comparisons);
        }

   
    public function store(Request $request)
    {
        $request->validate([
            'comparisons' => 'required|array',
            'comparisons.*.criteria1_id' => 'required|exists:criteria,id',
            'comparisons.*.criteria2_id' => 'required|exists:criteria,id',
            'comparisons.*.value' => 'required|numeric|min:0.111|max:9'
        ]);

        try {
            CriteriaComparison::truncate();

            foreach ($request->comparisons as $comparison) {
                $value = (float) $comparison['value'];
                
                $favored = 'equal';
                if ($value > 1) {
                    $favored = 'criteria2';
                } elseif ($value < 1) {
                    $favored = 'criteria1';
                }
                
                CriteriaComparison::create([
                    'criteria1_id' => $comparison['criteria1_id'],
                    'criteria2_id' => $comparison['criteria2_id'],
                    'value' => $this->normalizeValue($value),  // 🔥 Gunakan normalisasi
                    'favored_criteria' => $favored  
                ]);
            }

            $this->updateCriteriaWeights($request->comparisons);

            return response()->json([
                'message' => 'Perbandingan kriteria berhasil disimpan',
                'data' => CriteriaComparison::all() 
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menyimpan perbandingan: ' . $e->getMessage()
            ], 500);
        }
    }

    private function normalizeValue($value)
    {
        // Skala AHP standar
        $scales = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9];
        
        $closest = 1;
        $minDiff = abs($value - 1);
        
        foreach ($scales as $scale) {
            $diff = abs($value - $scale);
            if ($diff < $minDiff) {
                $minDiff = $diff;
                $closest = $scale;
            }
        }
        
        return round($closest, 3);
    }
    private function updateCriteriaWeights($comparisons)
    {
        \App\Helpers\AHPHelper::calculate();
    }
}
