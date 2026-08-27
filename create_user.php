<?php
use App\Models\User;

$user = User::firstOrCreate(
    ['email' => 'admin@gtd.com'],
    [
        'name' => 'Admin GTD',
        'password' => bcrypt('password123'),
        'email_verified_at' => now(),
    ]
);

echo "User: " . $user->email . " (ID: " . $user->id . ")\n";
