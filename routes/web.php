<?php

use App\Http\Controllers\CriteriaComparisonController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KriteriaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('login')->middleware('guest');


Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

    // routes/web.php
Route::get('/debug-matrix', function() {
    $helper = new \App\Helpers\AHPHelper();
    [$criteria, $matrix] = $helper->getPairwiseMatrix();
    
    return response()->json([
        'criteria' => $criteria->pluck('code'),
        'matrix' => $matrix,
        'row_sums' => array_map('array_sum', $matrix),
        'raw_comparisons' => \App\Models\CriteriaComparison::with(['criteria1', 'criteria2'])
            ->get()
            ->map(function($c) {
                return [
                    'c1' => $c->criteria1->code,
                    'c2' => $c->criteria2->code,
                    'value' => $c->getAttributes()['value'], // Raw value
                    'favored' => $c->favored_criteria
                ];
            })
    ]);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::controller(UserController::class)->prefix('users')->name('users.')->group(function () {
        Route::get('/', 'get')->name('get');
        Route::post('/', 'store')->name('store');
        Route::put('/{id}', 'update')->name('update');
        Route::delete('/{id}', 'destroy')->name('destroy');
    });

    Route::controller(UploadController::class)->prefix('uploads')->name('uploads.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        
        // PINDAHKAN routes dengan path spesifik KE ATAS
        Route::get('/{id}/calculate', 'calculate')->name('calculate');
        Route::get('/{id}/export', 'export')->name('export');
        
        // Routes dengan {id} di BAWAH
        Route::get('/{id}', 'show')->name('show');
        Route::delete('/{id}', 'destroy')->name('destroy');
    });


    Route::controller(KriteriaController::class)->prefix('kriteria')->name('kriteria.')->group(function () {
        Route::get('/', 'get')->name('get');
        Route::post('/', 'store')->name('store');
        Route::put('/{id}', 'update')->name('update');
        Route::delete('/{id}', 'destroy')->name('destroy');
    });

    Route::controller(CriteriaComparisonController::class)->prefix('kriteria-comparison')->name('kriteria-comparison.')->group(function () {
        Route::get('/', 'get')->name('get');
        Route::post('/', 'store')->name('store');
    });


    Route::get('/ahp-results', function() {
        $results = \App\Helpers\AHPHelper::getCalculationResults();
        return response()->json($results);
    })->name('ahp.results');

    Route::get('/ahp-validation', function() {
        $validation = \App\Helpers\AHPHelper::validateAHPData();
        return response()->json($validation);
    })->name('ahp.validation');

    Route::post('/ahp-check-consistency', function(Request $request) {
        $request->validate([
            'comparisons' => 'required|array',
            'comparisons.*.criteria1_id' => 'required|exists:criteria,id',
            'comparisons.*.criteria2_id' => 'required|exists:criteria,id',
            'comparisons.*.value' => 'required|numeric|min:0.111|max:9'
        ]);

        try {
            $criteria = \App\Models\Criteria::orderBy('id')->get();
            $comparisons = $request->input('comparisons');
            

            [$criteriaData, $matrix] = \App\Helpers\AHPHelper::getPairwiseMatrix();
            
            // Override dengan data dari request
            $n = count($criteria);
            $tempMatrix = array_fill(0, $n, array_fill(0, $n, 1));
            
            foreach ($comparisons as $comparison) {
                $i = $criteria->search(function($c) use ($comparison) {
                    return $c->id == $comparison['criteria1_id'];
                });
                $j = $criteria->search(function($c) use ($comparison) {
                    return $c->id == $comparison['criteria2_id'];
                });
                
                if ($i !== false && $j !== false) {
                    $tempMatrix[$i][$j] = $comparison['value'];
                    $tempMatrix[$j][$i] = 1 / $comparison['value'];
                }
            }
            
            // Hitung konsistensi
            $normalized = \App\Helpers\AHPHelper::normalizePairwiseMatrix($tempMatrix);
            $weights = \App\Helpers\AHPHelper::calculatePriorityVector($normalized);
            $consistency = \App\Helpers\AHPHelper::checkConsistency($tempMatrix, $weights);
            
            return response()->json($consistency);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error checking consistency: ' . $e->getMessage()
            ], 500);
        }
    })->name('ahp.check-consistency');

});

require __DIR__.'/auth.php';
