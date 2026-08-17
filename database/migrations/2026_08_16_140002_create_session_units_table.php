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
        Schema::create('session_units', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->foreignUlid('shipping_session_id')
                ->constrained('shipping_sessions')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('unit_name');

            $table->unsignedInteger('quantity')->default(1);

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_units');
    }
};
