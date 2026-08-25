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
        Schema::table('shipping_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('shipping_sessions', 'notes')) {
                $table->text('notes')->nullable()->after('destination');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipping_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('shipping_sessions', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};