<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alternative_values', function (Blueprint $table) {
            $table->decimal('value', 10, 4)->default(0)->change();

            $table->unique(['alternative_id', 'criteria_id']);
        });

        Schema::table('results', function (Blueprint $table) {
            $table->foreignId('upload_id')
                ->after('id')
                ->constrained('uploads')
                ->onDelete('cascade');

            $table->decimal('ahp_score', 10, 6)->default(0)->change();
            $table->integer('ahp_rank')->default(0)->change();
            $table->decimal('topsis_score', 10, 6)->default(0)->change();
            $table->integer('topsis_rank')->default(0)->change();

            $table->dropColumn(['combined_score', 'combined_rank']);
            $table->decimal('topsis_ahp_score', 10, 6)->default(0);
            $table->integer('topsis_ahp_rank')->default(0);

            $table->unique(['upload_id', 'alternative_id']);
        });
    }

    public function down(): void
    {
        Schema::table('alternative_values', function (Blueprint $table) {
            $table->dropUnique(['alternative_id', 'criteria_id']);
            $table->decimal('value', 8, 4)->change();
        });

        Schema::table('results', function (Blueprint $table) {
            $table->dropUnique(['upload_id', 'alternative_id']);
            $table->dropForeign(['upload_id']);
            $table->dropColumn('upload_id');

            $table->dropColumn(['topsis_ahp_score', 'topsis_ahp_rank']);

            $table->decimal('ahp_score', 8, 4)->nullable()->change();
            $table->integer('ahp_rank')->nullable()->change();
            $table->decimal('topsis_score', 8, 4)->nullable()->change();
            $table->integer('topsis_rank')->nullable()->change();

            $table->decimal('combined_score', 8, 4)->nullable();
            $table->integer('combined_rank')->nullable();
        });
    }
};
