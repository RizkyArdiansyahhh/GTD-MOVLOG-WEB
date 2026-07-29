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
        Schema::create('report_templates', function (Blueprint $table) {

            $table->id();

            $table->foreignId('checkpoint_id')
                ->constrained('checkpoints')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('name');

            $table->text('description')->nullable();

            $table->string('applies_to_report_type');

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_templates');
    }
};