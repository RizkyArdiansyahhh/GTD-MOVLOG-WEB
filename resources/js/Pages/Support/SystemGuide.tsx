import { useState } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

interface ProcessStep {
    number: string;
    title: string;
    description: string;
    details: string[];
}

interface RoleSop {
    roleId: string;
    roleName: string;
    description: string;
    steps: ProcessStep[];
}

const sopData: RoleSop[] = [
    {
        roleId: 'field-worker',
        roleName: 'Field Worker',
        description: 'Standard operating procedure for managing work sessions and updating checkpoint statuses in cargo and port areas.',
        steps: [
            {
                number: '01',
                title: 'Attendance & Worker Session Initiation',
                description: 'Initiating daily assignment sessions prior to cargo inspection.',
                details: [
                    'Open the Worker Sessions menu from the main navigation.',
                    'Select the assigned unit and confirm your initial location.',
                    'Click "Start Worker Session" to automatically record work commencement timestamp.',
                ],
            },
            {
                number: '02',
                title: 'Cargo Physical Inspection & Checkpoint',
                description: 'Conducting physical verification of containers or vehicle units on-site.',
                details: [
                    'Open the Checkpoint Monitoring module in the system.',
                    'Verify seal status, container serial numbers, and cargo against the manifest.',
                    'Update status to "Passed Checkpoint" once all requirements are met.',
                ],
            },
            {
                number: '03',
                title: 'Field Issue Logging (If Applicable)',
                description: 'Reporting immediately if any cargo discrepancies or physical impediments are detected.',
                details: [
                    'Select "Add Issue Note" on the relevant checkpoint.',
                    'Provide a brief and clear description of the physical issue.',
                    'The system will automatically dispatch an alert notification to the Supervisor on duty.',
                ],
            },
            {
                number: '04',
                title: 'Work Session Finalization',
                description: 'Closing the assignment session after all cargo units have been completed.',
                details: [
                    'Ensure all checkpoints for the respective session are marked as Completed.',
                    'Click "Complete Session" at the top of the session detail page.',
                ],
            },
        ],
    },
    {
        roleId: 'staff-admin',
        roleName: 'Administrative & Document Staff',
        description: 'Procedures for cargo data entry, customs/PIB document uploads, and attachment compliance.',
        steps: [
            {
                number: '01',
                title: 'Shipment Initiation & Customer Registration',
                description: 'Registering customer details and new shipment references.',
                details: [
                    'Access the Submit Documents module from the sidebar.',
                    'Select a registered customer or add a new customer profile.',
                    'Enter the master contract/shipment reference number as the transaction identifier.',
                ],
            },
            {
                number: '02',
                title: 'Main Document Uploads (PIB / Manifest / Bill of Lading)',
                description: 'Uploading official supporting documents in standard PDF format.',
                details: [
                    'Select the document step to upload in the Submit Documents Wizard.',
                    'Ensure file size does not exceed 10MB per document.',
                    'Double-check document numbers for accuracy before clicking Save.',
                ],
            },
            {
                number: '03',
                title: 'Submitting Documents to Verification Queue',
                description: 'Submitting complete documents to the Supervisor for review.',
                details: [
                    'Once all required documents are uploaded, review the document summary.',
                    'Click "Finalize & Submit Verification". The document status changes to Pending Verification.',
                ],
            },
        ],
    },
    {
        roleId: 'supervisor',
        roleName: 'Supervisor',
        description: 'Procedures for document accuracy inspection, approval, and report generation.',
        steps: [
            {
                number: '01',
                title: 'Incoming Document Queue Review',
                description: 'Monitoring document submissions from administrative staff.',
                details: [
                    'Open the Verify Documents module from sidebar navigation.',
                    'Filter documents by Pending Verification status.',
                    'Click on the submission row to open the document review sheet.',
                ],
            },
            {
                number: '02',
                title: 'Data Validation & Discrepancy Testing',
                description: 'Comparing physical/digital document contents against system parameters.',
                details: [
                    'Open document preview using the integrated PDF Viewer.',
                    'Cross-verify cargo quantities, customs values, and shipper identities.',
                ],
            },
            {
                number: '03',
                title: 'Execute Document Approval or Rejection',
                description: 'Determining the outcome of document review.',
                details: [
                    'Click "Verify & Approve" if all documents are valid.',
                    'If errors are found, select "Reject / Request Revision" and specify clear revision notes.',
                ],
            },
            {
                number: '04',
                title: 'Operational Report Generation',
                description: 'Downloading consolidated documents and cargo reports.',
                details: [
                    'Access the Reports module.',
                    'Select the desired reporting date range and export format (PDF / Excel).',
                ],
            },
        ],
    },
    {
        roleId: 'super-admin',
        roleName: 'Super Admin',
        description: 'Procedures for user account administration, role assignment, and access control configuration.',
        steps: [
            {
                number: '01',
                title: 'New User Account Management',
                description: 'Registering operational personnel into the GTD system.',
                details: [
                    'Access the Account Management module.',
                    'Click "Add New User".',
                    'Fill in Employee ID, Full Name, Email Address, and assign a Role (Staff, Supervisor, Worker).',
                ],
            },
            {
                number: '02',
                title: 'Status Configuration & Access Suspension',
                description: 'Managing active/inactive status of staff accounts.',
                details: [
                    'Use the status toggle switch in the user accounts table.',
                    'Deactivated accounts are immediately prevented from authenticating or logging in.',
                ],
            },
        ],
    },
];

export default function SystemGuide() {
    const [activeRole, setActiveRole] = useState('field-worker');

    const currentSop = sopData.find((s) => s.roleId === activeRole) || sopData[0];

    return (
        <DashboardLayout title="System Guide - GTD Logistics">
            <Head title="System Guide - GTD Logistics" />

            <div className="max-w-5xl mx-auto space-y-10 pb-12">
                {/* -- Header -- */}
                <div className="text-center space-y-3 pt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                        Standard Operating Procedure (SOP)
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        GTD Official System Operating Guide
                    </h1>
                    <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                        Step-by-step documentation of operational logistics workflows tailored by user role.
                    </p>
                </div>

                {/* -- Role Selection Tabs -- */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {sopData.map((sop) => (
                        <button
                            key={sop.roleId}
                            type="button"
                            onClick={() => setActiveRole(sop.roleId)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                activeRole === sop.roleId
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                            }`}
                        >
                            {sop.roleName}
                        </button>
                    ))}
                </div>

                {/* -- Active Role Description Card -- */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                            Operational Guide Module
                        </span>
                        <h2 className="text-xl font-extrabold text-slate-900 mt-1">{currentSop.roleName}</h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{currentSop.description}</p>
                    </div>

                    {/* -- Numbered Process Flow (01, 02, 03, 04) -- */}
                    <div className="space-y-6">
                        {currentSop.steps.map((step) => (
                            <div
                                key={step.number}
                                className="relative p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex flex-col sm:flex-row items-start gap-5 transition-all hover:bg-slate-50"
                            >
                                {/* Step Number Badge */}
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base tracking-tight shrink-0 shadow-xs">
                                    {step.number}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 space-y-2">
                                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        {step.description}
                                    </p>

                                    {/* Detailed Checklist Bullets */}
                                    <ul className="pt-2 space-y-1.5 border-t border-slate-200/60 text-xs text-slate-600">
                                        {step.details.map((detail, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* -- Clean Summary Note Footer -- */}
                <div className="p-6 rounded-3xl bg-slate-100/80 border border-slate-200/80 text-center space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        GTD Operational Quality Standard Compliance
                    </h4>
                    <p className="text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        All operations must adhere strictly to the procedures above to ensure logistics audit integrity, customs accuracy, and end-to-end cargo security.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
