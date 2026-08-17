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
        Schema::create('session_stages', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->foreignUlid('shipping_session_id')
                ->constrained('shipping_sessions')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('stage_type');       // kapal, tongkang, pelabuhan, site

            $table->unsignedTinyInteger('stage_order'); // 1-4

            $table->string('status')->default('pending'); // pending, aktif, selesai

            $table->foreignUlid('pic_user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->text('notes')->nullable();

            $table->timestamp('started_at')->nullable();

            $table->timestamp('completed_at')->nullable();

            $table->unique(['shipping_session_id', 'stage_type']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_stages');
    }
};
