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
        Schema::create('report_photos', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->foreignUlid('report_id')
                ->constrained('reports')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->text('photo_url');

            $table->text('caption')->nullable();

            $table->integer('sort_order')->default(0);

            $table->boolean('is_cover')->default(false);

            $table->timestamp('taken_at')->nullable();

            $table->index('report_id');

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_photos');
    }
};