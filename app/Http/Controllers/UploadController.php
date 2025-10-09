<?php

namespace App\Http\Controllers;

use App\Models\Upload;
use App\Models\Alternative;
use App\Models\AlternativeValue;
use App\Models\Criteria;
use App\Helpers\AHPHelper;
use App\Helpers\TopsisHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Inertia\Inertia;

class UploadController extends Controller
{
    public function index(Request $request)
    {
        try {
            if ($request->has('json')) {
                $uploads = Upload::withCount('alternatives')
                    ->orderBy('created_at', 'desc')
                    ->get();

                return response()->json($uploads);
            }

            return Inertia::render('Upload');
        } catch (\Exception $e) {
            Log::error('Upload index error: ' . $e->getMessage());
            
            if ($request->has('json')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal memuat data upload: ' . $e->getMessage()
                ], 500);
            }
            
            return Inertia::render('Upload', [
                'error' => 'Gagal memuat data upload'
            ]);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
        ], [
            'file.required' => 'File wajib diupload',
            'file.file' => 'File tidak valid',
            'file.mimes' => 'File harus berformat Excel (.xlsx atau .xls)',
            'file.max' => 'File tidak boleh lebih dari 10MB'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();


            $upload = Upload::create([
                'filename' => $fileName,
            ]);

     
            $this->processExcelFile($file, $upload->id);

            $alternativeCount = Alternative::where('upload_id', $upload->id)->count();
            if ($alternativeCount === 0) {
                throw new \Exception('Tidak ditemukan data alternatif yang valid dalam file');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'File berhasil diupload dan diproses',
                'data' => $upload->load('alternatives')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Upload store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses file: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $upload = Upload::with(['alternatives', 'results.alternative'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $upload
            ]);
        } catch (\Exception $e) {
            Log::error('Upload show error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Data upload tidak ditemukan'
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $upload = Upload::findOrFail($id);
            
            // Delete related data in correct order
            $upload->results()->delete();
            
            foreach ($upload->alternatives as $alternative) {
                $alternative->scores()->delete();
            }
            
            $upload->alternatives()->delete();
            $upload->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data upload berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Upload destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function calculate($id)
    {
        try {
            // Validate upload exists and has alternatives
            $upload = Upload::with('alternatives')->findOrFail($id);
            
            if ($upload->alternatives->count() === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada data alternatif untuk dihitung'
                ], 400);
            }

            // Validate AHP data first
            $ahpValidation = AHPHelper::validateAHPData();
            if (!$ahpValidation['is_ready_for_calculation']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data AHP belum lengkap. Pastikan kriteria dan perbandingan AHP sudah dibuat.',
                    'ahp_status' => $ahpValidation
                ], 400);
            }

            // Calculate AHP weights first
            $ahpResult = AHPHelper::calculate();
            
            if (isset($ahpResult['error']) && $ahpResult['error']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error dalam perhitungan AHP: ' . $ahpResult['error']
                ], 400);
            }
            
            
            $topsisResult = TopsisHelper::calculate($id);
            

            // Pastikan format response konsisten
            if ($topsisResult['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $topsisResult['data']
                ]);
            }

            return response()->json($topsisResult, 400);

        } catch (\Exception $e) {
            Log::error('Upload calculate error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung ranking: ' . $e->getMessage()
            ], 500);
        }
    }

    public function export($id)
    {
        try {
            $upload = Upload::findOrFail($id);
            $exportData = TopsisHelper::getExportData($id);

            Log::info('Export data count: ' . count($exportData));
            Log::info('Export data sample: ', ['first_row' => $exportData[0] ?? 'empty']);

            if (empty($exportData)) {
                throw new \Exception('Tidak ada data untuk diekspor. Pastikan perhitungan sudah dilakukan.');
            }

            $spreadsheet = new Spreadsheet();
            $worksheet = $spreadsheet->getActiveSheet();
            $worksheet->setTitle('Ranking Results');

            $headers = array_keys($exportData[0]);
            $col = 'A';
            foreach ($headers as $header) {
                $worksheet->setCellValue($col . '1', $header);
                $worksheet->getStyle($col . '1')->getFont()->setBold(true);
                $worksheet->getStyle($col . '1')->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFE3F2FD');
                $col++;
            }

  
            $row = 2;
            foreach ($exportData as $data) {
                $col = 'A';
                foreach ($data as $value) {
                    $worksheet->setCellValue($col . $row, $value);
                    $col++;
                }
                $row++;
            }


            foreach (range('A', $worksheet->getHighestColumn()) as $col) {
                $worksheet->getColumnDimension($col)->setAutoSize(true);
            }

        
            $fileName = 'ranking_result_' . $upload->id . '_' . date('Y-m-d_H-i-s') . '.xlsx';
            
            $writer = new Xlsx($spreadsheet);
            
            return response()->streamDownload(function() use ($writer) {
                $writer->save('php://output');
            }, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            ]);

        } catch (\Exception $e) {
            Log::error('Upload export error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data: ' . $e->getMessage()
            ], 500);
        }
    }

    private function processExcelFile($file, $uploadId)
    {
        try {
            if (!file_exists($file->getPathname())) {
                throw new \Exception('File tidak dapat diakses');
            }

            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $data = $worksheet->toArray(null, true, true, true);

         
            $data = array_filter($data, function($row) {
                return !empty(array_filter($row));
            });

            if (count($data) < 3) {
                throw new \Exception('File Excel harus memiliki minimal 3 baris (2 baris header dan minimal 1 data karyawan)');
            }

            $dataArray = array_values($data);
            
            $headerRow = $dataArray[1]; // Second row contains criteria codes
            $criteriaCodes = array_slice($headerRow, 1); // Skip first column
            $criteriaCodes = array_filter($criteriaCodes, function($code) {
                return !empty(trim($code));
            }); 

            if (empty($criteriaCodes)) {
                throw new \Exception('Tidak ditemukan kode kriteria di baris kedua file Excel');
            }

            $existingCriteria = Criteria::whereIn('code', $criteriaCodes)->get();
            $existingCodes = $existingCriteria->pluck('code')->toArray();
            
            $missingCodes = array_diff($criteriaCodes, $existingCodes);
            if (!empty($missingCodes)) {
                throw new \Exception('Kode kriteria tidak ditemukan di sistem: ' . implode(', ', $missingCodes));
            }

            $alternativesData = array_slice($dataArray, 2); // Start from third row
            $processedCount = 0;
            
            foreach ($alternativesData as $rowIndex => $row) {
                $alternativeName = trim($row[array_keys($row)[0]] ?? ''); // First column
                
                if (empty($alternativeName)) {
                    continue; 
                }

           
                $alternative = Alternative::create([
                    'name' => $alternativeName,
                    'upload_id' => $uploadId,
                ]);

           
                $columnIndex = 1; 
                foreach ($criteriaCodes as $criteriaCode) {
                    $columnKey = array_keys($row)[$columnIndex] ?? null;
                    $value = $row[$columnKey] ?? 0;
                    
              
                    if (is_numeric($value)) {
                        $numericValue = floatval($value);
                    } else {
                        $numericValue = 0;
                    }

       
                    $criteria = $existingCriteria->where('code', $criteriaCode)->first();
                    
                    if ($criteria) {
                        AlternativeValue::create([
                            'alternative_id' => $alternative->id,
                            'criteria_id' => $criteria->id,
                            'value' => $numericValue,
                        ]);
                    }
                    
                    $columnIndex++;
                }
                
                $processedCount++;
            }

            Log::info("Successfully processed Excel file", [
                'upload_id' => $uploadId,
                'alternatives_count' => $processedCount,
                'criteria_count' => count($criteriaCodes)
            ]);

            if ($processedCount === 0) {
                throw new \Exception('Tidak ditemukan data karyawan yang valid dalam file Excel');
            }

        } catch (\Exception $e) {
            Log::error('Process Excel file error: ' . $e->getMessage(), [
                'upload_id' => $uploadId,
                'file_path' => $file->getPathname()
            ]);
            
            throw new \Exception('Gagal memproses file Excel: ' . $e->getMessage());
        }
    }
}