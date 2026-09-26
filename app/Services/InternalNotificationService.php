<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Document;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Notifications\DocumentRejectedNotification;
use App\Notifications\DocumentSubmittedNotification;
use App\Notifications\SessionReadyNotification;
use App\Notifications\StageAssignedNotification;
use App\Notifications\StageCompletedInternalNotification;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

/**
 * Internal Notification Service
 *
 * Centralizes recipient resolution and sending for User Internal
 * (super-admin / staff / supervisor / field-worker) database
 * notifications. Mirrors the existing customer fan-out pattern
 * (Customer::users()) but scopes by Spatie role instead of company.
 *
 * Only ACTIVE accounts receive notifications, consistent with
 * eligibility filtering used elsewhere (e.g. getActiveFieldWorkers).
 */
class InternalNotificationService
{
    /**
     * Active users holding any of the given roles.
     *
     * Silently ignores role names that do not exist (Spatie's role()
     * scope throws RoleDoesNotExist otherwise — e.g. partial seeds).
     *
     * @param  list<string>  $roles
     * @return Collection<int, User>
     */
    public function usersInRoles(array $roles): Collection
    {
        $existing = Role::query()->whereIn('name', $roles)->pluck('name')->all();

        if ($existing === []) {
            return collect();
        }

        return User::query()
            ->where('status', UserStatus::Active->value)
            ->role($existing)
            ->get();
    }

    /**
     * Active document verifiers: supervisor + super-admin.
     * (Route verifikasi-berkas is role:supervisor; super-admin is
     * accepted by checkSupervisorAuthorization.)
     *
     * @return Collection<int, User>
     */
    public function verifiers(): Collection
    {
        return $this->usersInRoles([UserRole::Supervisor->value, UserRole::SuperAdmin->value]);
    }

    /**
     * Active session owners: staff + super-admin.
     * (Route sesi-pekerja is role:super-admin|staff.)
     *
     * @return Collection<int, User>
     */
    public function sessionOwners(): Collection
    {
        return $this->usersInRoles([UserRole::Staff->value, UserRole::SuperAdmin->value]);
    }

    /**
     * Active operational monitors: supervisor + staff + super-admin.
     * (Routes monitoring-barang/checkpoint + submit-berkas.)
     *
     * @return Collection<int, User>
     */
    public function monitors(): Collection
    {
        return $this->usersInRoles([
            UserRole::Supervisor->value,
            UserRole::Staff->value,
            UserRole::SuperAdmin->value,
        ]);
    }

    /**
     * Notify verifiers that documents for an assignment were submitted
     * and are waiting for verification.
     */
    public function notifyDocumentSubmitted(string $assignmentNoRef, int $pendingCount): void
    {
        $recipients = $this->verifiers();

        if ($recipients->isNotEmpty()) {
            $recipients->each->notify(new DocumentSubmittedNotification($assignmentNoRef, $pendingCount));
        }
    }

    /**
     * Notify the uploader and verifier peers that a document was rejected.
     */
    public function notifyDocumentRejected(Document $document): void
    {
        $document->loadMissing('uploadedBy');

        /** @var Collection<int, User> $recipients */
        $recipients = $this->verifiers();

        $uploader = $document->uploadedBy;
        if ($uploader instanceof User && $uploader->isActive()) {
            $recipients = $recipients->push($uploader);
        }

        $recipients = $recipients->unique('id')->values();

        if ($recipients->isNotEmpty()) {
            $recipients->each->notify(new DocumentRejectedNotification($document));
        }
    }

    /**
     * Notify session owners that a new shipping session is ready to work on.
     */
    public function notifySessionReady(ShippingSession $session): void
    {
        $recipients = $this->sessionOwners();

        if ($recipients->isNotEmpty()) {
            $recipients->each->notify(new SessionReadyNotification($session));
        }
    }

    /**
     * Notify the assigned field worker directly.
     */
    public function notifyStageAssigned(SessionCheckpoint $sessionCheckpoint, User $assignee): void
    {
        if (! $assignee->isActive()) {
            return;
        }

        $assignee->notify(new StageAssignedNotification($sessionCheckpoint));
    }

    /**
     * Notify monitors (and the next stage PIC, if any) that a stage completed.
     * Exactly one notification per completion.
     */
    public function notifyStageCompleted(
        ShippingSession $session,
        SessionCheckpoint $completedCheckpoint,
        ?SessionCheckpoint $nextCheckpoint = null,
    ): void {
        /** @var Collection<int, User> $recipients */
        $recipients = $this->monitors();

        $nextPicId = $nextCheckpoint?->pic_user_id;
        if (is_string($nextPicId) && $nextPicId !== '') {
            $nextPic = User::query()->find($nextPicId);
            if ($nextPic instanceof User && $nextPic->isActive()) {
                $recipients = $recipients->push($nextPic);
            }
        }

        $recipients = $recipients->unique('id')->values();

        if ($recipients->isNotEmpty()) {
            $recipients->each->notify(
                new StageCompletedInternalNotification($session, $completedCheckpoint, $nextCheckpoint)
            );
        }
    }
}
