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
        Schema::create('shipping_sessions', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->foreignUlid('customer_id')
                ->constrained('customers')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignUlid('created_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('assignment_no')->unique();

            $table->string('cargo_name');

            $table->decimal('total_quantity', 12, 2);

            $table->string('unit');

            $table->string('origin')->nullable();

            $table->string('destination')->nullable();

            $table->foreignId('current_checkpoint_id')
                ->nullable()
                ->constrained('checkpoints')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->string('status')->default('DRAFT');

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_sessions');
    }
};