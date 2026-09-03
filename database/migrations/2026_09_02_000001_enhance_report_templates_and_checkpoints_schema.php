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
        // 1. Enhance template_fields with field_key, label, and options
        Schema::table('template_fields', function (Blueprint $table) {
            $table->string('field_key')->nullable()->after('template_id');
            $table->string('label')->nullable()->after('field_name');
            $table->jsonb('options')->nullable()->after('required');
        });

        // 2. Enhance report_photos with template_field_id
        Schema::table('report_photos', function (Blueprint $table) {
            $table->foreignId('template_field_id')
                ->nullable()
                ->after('report_id')
                ->constrained('template_fields')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->index('template_field_id');
        });

        // 3. Enhance session_checkpoints with template_snapshot
        Schema::table('session_checkpoints', function (Blueprint $table) {
            $table->jsonb('template_snapshot')->nullable()->after('sync_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('session_checkpoints', function (Blueprint $table) {
            $table->dropColumn('template_snapshot');
        });

        Schema::table('report_photos', function (Blueprint $table) {
            $table->dropForeign(['template_field_id']);
            $table->dropIndex(['template_field_id']);
            $table->dropColumn('template_field_id');
        });

        Schema::table('template_fields', function (Blueprint $table) {
            $table->dropColumn(['field_key', 'label', 'options']);
        });
    }
};
