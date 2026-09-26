<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The spatie activity_log table was created with bigint morph ids
 * (nullableMorphs), but every actor/subject in this app uses ULIDs
 * (users, shipping_sessions, ...). Writing a ULID causer failed with
 * "invalid input syntax for type bigint". Convert both morph pairs
 * to ULID morphs so the existing table can actually be used.
 * No data migration needed — the table was never written to.
 */
return new class extends Migration
{
    public function up(): void
    {
        // NOTE: spatie's migration created these morphs with custom
        // index names ('causer'/'subject'), so dropMorphs() cannot be
        // used — it looks for the default morph index name.
        DB::statement('DROP INDEX IF EXISTS activity_log_causer_index');
        DB::statement('DROP INDEX IF EXISTS activity_log_subject_index');
        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropColumn(['causer_type', 'causer_id', 'subject_type', 'subject_id']);
        });

        Schema::table('activity_log', function (Blueprint $table) {
            $table->nullableUlidMorphs('causer');
            $table->nullableUlidMorphs('subject');
        });
    }

    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropMorphs('causer');
            $table->dropMorphs('subject');
        });

        Schema::table('activity_log', function (Blueprint $table) {
            $table->nullableMorphs('subject', 'subject');
            $table->nullableMorphs('causer', 'causer');
        });
    }
};
