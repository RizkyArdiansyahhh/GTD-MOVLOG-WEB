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
        Schema::create('reports', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->foreignUlid('session_checkpoint_id')
                ->nullable()
                ->constrained('session_checkpoints')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignUlid('movement_id')
                ->nullable()
                ->constrained('movements')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignId('report_template_id')
                ->constrained('report_templates')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamp('event_at')->nullable();

            $table->string('report_type');

            $table->decimal('moved_quantity',12,2)->nullable();

            $table->text('description')->nullable();

            $table->decimal('latitude',10,7)->nullable();

            $table->decimal('longitude',10,7)->nullable();

            $table->foreignUlid('created_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('sync_status')->default('SYNCED');

            $table->index('session_checkpoint_id');

            $table->index('movement_id');

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};