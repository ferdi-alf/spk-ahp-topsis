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
        $comparisons = CriteriaComparison::with(['criteria1', 'criteria2'])->get();
        
        if($request->expectsJson() || $request->has('json')){
            return response()->json($comparisons);
        }
        
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
        // Hapus DB::beginTransaction() dan DB::commit()
        CriteriaComparison::truncate();

        foreach ($request->comparisons as $comparison) {
            CriteriaComparison::create([
                'criteria1_id' => $comparison['criteria1_id'],
                'criteria2_id' => $comparison['criteria2_id'],
                'value' => $comparison['value']
            ]);
        }

        $this->updateCriteriaWeights($request->comparisons);

        return response()->json([
            'message' => 'Perbandingan kriteria berhasil disimpan',
            'data' => $request->comparisons
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Gagal menyimpan perbandingan: ' . $e->getMessage()
        ], 500);
    }
}

    private function updateCriteriaWeights($comparisons)
    {
        // Menggunakan AHPHelper untuk menghitung bobot
        \App\Helpers\AHPHelper::calculate();
    }
}
