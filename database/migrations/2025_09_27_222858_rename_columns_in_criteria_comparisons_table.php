<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('criteria_comparisons', function (Blueprint $table) {
            $table->renameColumn('criteria_id_1', 'criteria1_id');
            $table->renameColumn('criteria_id_2', 'criteria2_id');
        });
    }

    public function down(): void
    {
        Schema::table('criteria_comparisons', function (Blueprint $table) {
            $table->renameColumn('criteria1_id', 'criteria_id_1');
            $table->renameColumn('criteria2_id', 'criteria_id_2');
        });
    }
};

