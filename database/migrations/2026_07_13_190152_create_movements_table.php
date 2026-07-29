<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movements', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->foreignUlid('session_checkpoint_id')
                ->constrained('session_checkpoints')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // HANYA buat kolomnya
            $table->ulid('parent_movement_id')->nullable();

            $table->string('movement_name');

            $table->string('movement_type');

            $table->integer('sequence')->default(0);

            $table->string('status');

            $table->foreignUlid('created_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamps();

            $table->index('session_checkpoint_id');
            $table->index('parent_movement_id');
        });

        // Baru tambahkan self foreign key
        Schema::table('movements', function (Blueprint $table) {

            $table->foreign('parent_movement_id')
                ->references('id')
                ->on('movements')
                ->cascadeOnUpdate()
                ->nullOnDelete();

        });
    }

    public function down(): void
    {
        Schema::table('movements', function (Blueprint $table) {

            $table->dropForeign(['parent_movement_id']);

        });

        Schema::dropIfExists('movements');
    }
};