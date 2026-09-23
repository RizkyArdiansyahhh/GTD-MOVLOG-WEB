<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordRequested extends Notification
{
    use Queueable;

    public readonly string $resetUrl;

    public function __construct(string $token, string $email)
    {
        $this->resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $email,
        ], false));
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset Your GTD-MoveLog Password')
            ->greeting('Hello ' . ($notifiable->name ?? 'there') . ',')
            ->line('We received a request to reset the password for your GlobalTransDjaya account.')
            ->action('Reset Password', $this->resetUrl)
            ->line('This link will expire in 60 minutes.')
            ->line('If you did not request a password reset, no action is required.');
    }
}
