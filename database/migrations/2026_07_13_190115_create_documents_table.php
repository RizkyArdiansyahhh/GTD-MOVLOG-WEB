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
        Schema::create('documents', function (Blueprint $table) {

            $table->ulid('id')->primary();

            $table->string('assignment_no_ref');

            $table->foreignUlid('customer_id')
                ->constrained('customers')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignUlid('shipping_session_id')
                ->nullable()
                ->constrained('shipping_sessions')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('document_type_id')
                ->constrained('document_types')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->json('document_data');

            $table->string('file_name');

            $table->text('file_path');

            $table->string('status')->default('PENDING');

            $table->foreignUlid('uploaded_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamp('uploaded_at')->useCurrent();

            $table->foreignUlid('verified_by')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->timestamp('verified_at')->nullable();

            $table->text('remarks')->nullable();

            $table->index('shipping_session_id');

            $table->index('assignment_no_ref');

            $table->unique(['assignment_no_ref', 'document_type_id']);

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};