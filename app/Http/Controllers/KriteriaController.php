<?php

namespace App\Http\Controllers;

use App\Models\Criteria;
use App\Models\CriteriaComparison;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;



class KriteriaController extends Controller
{
    public function get(Request $request) 
    {
        $data = Criteria::all();
        
        if($request->expectsJson() || $request->has('json')){
            return response()->json($data);
        }
        
        return Inertia::render('Kriteria');
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:10|unique:criteria,code',
            'name' => 'required|string|max:255',
            'type' => 'required|in:benefit,cost'
        ], [
            'code.required' => 'Kode kriteria wajib diisi',
            'code.unique' => 'Kode kriteria sudah digunakan',
            'name.required' => 'Nama kriteria wajib diisi',
            'type.required' => 'Jenis kriteria wajib dipilih',
            'type.in' => 'Jenis kriteria harus benefit atau cost'
        ]);

        try {
            $criteria = Criteria::create([
                'code' => strtoupper($request->code),
                'name' => $request->name,
                'type' => $request->type
            ]);

            return response()->json([
                'message' => 'Kriteria berhasil ditambahkan',
                'data' => $criteria
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menambahkan kriteria: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $criteria = Criteria::findOrFail($id);
        
        $request->validate([
            'code' => 'required|string|max:10|unique:criteria,code,' . $id,
            'name' => 'required|string|max:255',
            'type' => 'required|in:benefit,cost'
        ], [
            'code.required' => 'Kode kriteria wajib diisi',
            'code.unique' => 'Kode kriteria sudah digunakan',
            'name.required' => 'Nama kriteria wajib diisi',
            'type.required' => 'Jenis kriteria wajib dipilih',
            'type.in' => 'Jenis kriteria harus benefit atau cost'
        ]);

        try {
            $criteria->update([
                'code' => strtoupper($request->code),
                'name' => $request->name,
                'type' => $request->type
            ]);

            return response()->json([
                'message' => 'Kriteria berhasil diperbarui',
                'data' => $criteria
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui kriteria: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $criteria = Criteria::findOrFail($id);
            

            $hasComparisons = CriteriaComparison::where('criteria1_id', $id)
                                                ->orWhere('criteria2_id', $id)
                                                ->exists();
            
            if ($hasComparisons) {
                return response()->json([
                    'message' => 'Kriteria tidak dapat dihapus karena sudah digunakan dalam perbandingan'
                ], 422);
            }

            $criteria->delete();

            return response()->json([
                'message' => 'Kriteria berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus kriteria: ' . $e->getMessage()
            ], 500);
        }
    }
}


