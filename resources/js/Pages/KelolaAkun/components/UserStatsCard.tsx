interface UserStatsCardProps {
    label: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    accent: string;
}

export default function UserStatsCard({
    label,
    value,
    subtitle,
    icon: Icon,
    accent,
}: UserStatsCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div
                    className="flex items-center justify-center rounded-xl"
                    style={{
                        width: 44,
                        height: 44,
                        backgroundColor: `${accent}18`,
                    }}
                >
                    <Icon size={20} style={{ color: accent }} strokeWidth={2} />
                </div>
            </div>

            <div>
                <p
                    className="text-2xl font-bold leading-none"
                    style={{ color: '#06283A' }}
                >
                    {value}
                </p>
                <p className="text-sm text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>

            <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
        </div>
    );
}
