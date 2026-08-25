interface UserRoleBadgeProps {
    role: string;
}

export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
    return (
        <span className="text-sm font-medium text-gray-700">
            {role}
        </span>
    );
}
