<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->index('status', 'documents_status_index');
        });

        Schema::table('shipping_sessions', function (Blueprint $table) {
            $table->index('status', 'shipping_sessions_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex('documents_status_index');
        });

        Schema::table('shipping_sessions', function (Blueprint $table) {
            $table->dropIndex('shipping_sessions_status_index');
        });
    }
};
