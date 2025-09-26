<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alternative_id')->constrained('alternatives')->cascadeOnDelete();
            $table->decimal('ahp_score', 8, 4)->nullable();
            $table->integer('ahp_rank')->nullable();
            $table->decimal('topsis_score', 8, 4)->nullable();
            $table->integer('topsis_rank')->nullable();
            $table->decimal('combined_score', 8, 4)->nullable(); // jika AHP+TOPSIS digabung
            $table->integer('combined_rank')->nullable();
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
