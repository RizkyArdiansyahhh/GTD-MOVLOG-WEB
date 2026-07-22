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
        Schema::create('session_checkpoints', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->foreignUlid('shipping_session_id')
                ->constrained('shipping_sessions')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('checkpoint_id')
                ->constrained('checkpoints')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignUlid('pic_user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->string('status');

            $table->timestamp('actual_start')->nullable();

            $table->timestamp('actual_finish')->nullable();

            $table->string('sync_status')->default('SYNCED');

            $table->unique([
                'shipping_session_id',
                'checkpoint_id'
            ]);

            $table->timestamps();
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_checkpoints');
    }
};