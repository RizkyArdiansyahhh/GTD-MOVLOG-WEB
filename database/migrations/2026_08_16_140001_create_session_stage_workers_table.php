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
        Schema::create('session_stage_workers', function (Blueprint $table) {

            $table->foreignUlid('session_stage_id')
                ->constrained('session_stages')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignUlid('worker_user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->primary(['session_stage_id', 'worker_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_stage_workers');
    }
};
