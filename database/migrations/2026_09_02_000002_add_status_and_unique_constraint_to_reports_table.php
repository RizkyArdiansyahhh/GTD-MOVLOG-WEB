<?php

declare(strict_types=1);

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
        Schema::table('reports', function (Blueprint $table) {
            $table->string('status')->default('in_progress')->after('report_type');

            // Unique constraint: exactly ONE report instance per physical movement at a given checkpoint
            $table->unique(
                ['session_checkpoint_id', 'movement_id'],
                'reports_session_checkpoint_movement_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropUnique('reports_session_checkpoint_movement_unique');
            $table->dropColumn('status');
        });
    }
};
