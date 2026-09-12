import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { PageProps } from '@/types';
import { Search, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';

interface FAQItem {
    id: string;
    category: string;
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        id: 'faq-1',
        category: 'Cargo & Shipping',
        question: 'How does real-time cargo status tracking work?',
        answer: 'Cargo status is monitored automatically through the Cargo Monitoring module. Whenever field workers update status at a designated checkpoint, the system immediately syncs the latest status to the supervisor monitoring board and customer portal.',
    },
    {
        id: 'faq-2',
        category: 'Cargo & Shipping',
        question: 'What should be done if cargo experiences a checkpoint delay?',
        answer: 'If an unexpected delay occurs beyond the estimated schedule, field personnel must enter an issue note in the Worker Sessions module. This note will automatically trigger an alert on the Checkpoint Monitoring page for supervisor escalation.',
    },
    {
        id: 'faq-3',
        category: 'Documents & Verification',
        question: 'How long does document verification take by a Supervisor?',
        answer: 'Verification of PIB, Manifest, and Bill of Lading documents is conducted regularly. The Standard Operating Procedure (SOP) timeline for document verification is completed within a maximum of 1x24 business hours after documents are uploaded by operational staff.',
    },
    {
        id: 'faq-4',
        category: 'Documents & Verification',
        question: 'What is the procedure if a document is rejected?',
        answer: 'Rejected documents will display the reason for rejection in the Verify Documents module. Staff can click on the rejection details, correct the document according to revision remarks, and re-upload through the Submit Documents module.',
    },
    {
        id: 'faq-5',
        category: 'Account & Access',
        question: 'How do I change my password or update profile information?',
        answer: 'Click your profile name in the upper-right corner of the screen, then select \"Edit Profile\". On that page, you can independently update your name, email, and account password.',
    },
    {
        id: 'faq-6',
        category: 'Account & Access',
        question: 'Who is authorized to add or deactivate staff accounts?',
        answer: 'Adding and deactivating staff accounts as well as configuring role access permissions is authorized exclusively for Super Admins via the Account Management module.',
    },
];

const categories = ['All', 'Cargo & Shipping', 'Documents & Verification', 'Account & Access'];

// ── Customer-specific FAQ: written from the Customer Portal point of view
// (Dashboard, Cargo Monitoring, Checkpoint, Shipment Detail, Notifications,
// Edit Profile). No internal modules (Worker Sessions, Verify Documents,
// Account Management) are referenced here.
const customerFaqData: FAQItem[] = [
    {
        id: 'cfaq-1',
        category: 'Cargo Tracking',
        question: 'How do I track the status of my cargo?',
        answer: 'Open the Cargo Monitoring menu in your Customer Portal. Each shipment card shows the assignment number, route, current checkpoint, and live status (Pending, In Transit, or Delivered). Click any shipment to see full details, document status, and the checkpoint timeline.',
    },
    {
        id: 'cfaq-2',
        category: 'Cargo Tracking',
        question: 'What do the checkpoint stages mean?',
        answer: 'Every shipment moves through four stages: Vessel (loading onto the ship), Barge/Tongkang (inter-island transit), Port (unloading and handling at the destination port), and Site (final land delivery). The progress percentage on your dashboard reflects how many stages are completed.',
    },
    {
        id: 'cfaq-3',
        category: 'Shipment Schedule',
        question: 'My cargo seems delayed. What should I do?',
        answer: 'First check the shipment detail page for the latest update time and activity history. If there has been no update for a long time or the schedule has passed, contact our Operations Hotline at +62 817-6086-206 and mention your assignment number (e.g. ASG-...) so the team can escalate immediately.',
    },
    {
        id: 'cfaq-4',
        category: 'Shipment Schedule',
        question: 'What information is available on the shipment detail page?',
        answer: 'The detail page shows cargo information, origin and destination ports, overall status, the checkpoint timeline with dates and personnel in charge, attached shipping documents and their verification status, as well as field photos and progress reports uploaded from the site.',
    },
    {
        id: 'cfaq-5',
        category: 'Notifications',
        question: 'How do shipment notifications work?',
        answer: 'Click the bell icon in the top navigation to see updates such as document verification results and shipment stage progress. Unread notifications are highlighted — clicking one marks it as read and takes you directly to the related shipment.',
    },
    {
        id: 'cfaq-6',
        category: 'Account',
        question: 'How do I update my profile, photo, or password?',
        answer: 'Click your company avatar in the upper-right corner, then select "Edit Profile". There you can update your name, phone number, profile photo, and password. Company name and legal identity are locked for security — please contact GTD Admin to change them.',
    },
];

const customerCategories = ['All', 'Cargo Tracking', 'Shipment Schedule', 'Notifications', 'Account'];

const customerTicketCategories = ['Cargo Tracking', 'Shipment Schedule', 'Notifications', 'Account', 'Other'];

export default function HelpCenter() {
    const { auth } = usePage<PageProps>().props;
    // Customer portal (/customer/pusat-bantuan) must render inside the
    // customer layout; internal staff keep the dashboard layout.
    const isCustomer = auth?.user?.roles?.includes('customer') ?? false;
    const Layout = isCustomer ? CustomerLayout : DashboardLayout;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(isCustomer ? 'cfaq-1' : 'faq-1');
    const [ticketSubmitted, setTicketSubmitted] = useState(false);
    const [formData, setFormData] = useState({ subject: '', category: '', message: '' });

    // Pick the content set matching the audience. Defaults are applied once
    // the audience is known so the first FAQ is expanded and the ticket form
    // preselects a valid category for that audience.
    const activeFaqData = isCustomer ? customerFaqData : faqData;
    const activeCategories = isCustomer ? customerCategories : categories;
    const activeTicketCategories = isCustomer ? customerTicketCategories : ['Cargo & Shipping', 'Documents & Verification', 'Account & Access', 'Other'];
    const defaultCategory = activeTicketCategories[0];
    const ticketCategory = formData.category || defaultCategory;

    const filteredFaqs = activeFaqData.filter((faq) => {
        const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
        const matchesSearch =
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        setTicketSubmitted(true);
        setTimeout(() => {
            setTicketSubmitted(false);
            setFormData({ subject: '', category: defaultCategory, message: '' });
        }, 5000);
    };

    return (
        <Layout title="Help Center - GTD Logistics">
            <Head title="Help Center - GTD Logistics" />

            <div className="max-w-5xl mx-auto space-y-10 pb-12">
                {/* -- Header & Search -- */}
                <div className="text-center space-y-4 pt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                        Help Center & Support
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {isCustomer ? 'How can we help with your shipment today?' : 'How can we assist your operations today?'}
                    </h1>
                    <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                        {isCustomer
                            ? 'Find quick answers about cargo tracking, delivery schedules, notifications, and your customer account.'
                            : 'Find quick answers regarding cargo tracking, document verification procedures, and GTD system usage.'}
                    </p>

                    {/* Clean Search Input */}
                    <div className="max-w-md mx-auto relative pt-2">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isCustomer ? 'Search shipments, schedules, or keywords...' : 'Search issues, documents, or keywords...'}
                                className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200/80 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* -- Category Tabs -- */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {activeCategories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                selectedCategory === category
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* -- Clean Modern Accordion FAQ -- */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-4 mb-2">
                        <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{isCustomer ? 'Quick guides for tracking your cargo and managing your customer account.' : 'Quick guides and answers for common operational issues.'}</p>
                    </div>

                    {filteredFaqs.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredFaqs.map((faq) => {
                                const isExpanded = expandedFaq === faq.id;
                                return (
                                    <div key={faq.id} className="py-4">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                                            className="w-full flex items-center justify-between text-left gap-4 cursor-pointer group"
                                        >
                                            <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                                                {faq.question}
                                            </span>
                                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-500">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-xs text-slate-400">
                            No questions match your search.
                        </div>
                    )}
                </div>

                {/* -- Clean Support Contact & Ticket Section -- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Direct Contact Info */}
                    <div className="md:col-span-1 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                                24/7 Support Desk
                            </span>
                            <h3 className="text-xl font-bold tracking-tight">{isCustomer ? 'Contact Customer Support' : 'Contact Operations Team'}</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {isCustomer
                                    ? 'Need help with your shipment, delivery schedule, or account? Our customer support team is ready to assist you.'
                                    : 'If you require urgent assistance outside standard operating hours, the GTD support team is ready to help.'}
                            </p>
                        </div>

                        <div className="space-y-3 border-t border-slate-800 pt-4 text-xs">
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Support Email</p>
                                <p className="font-semibold text-slate-200 mt-0.5">support@gtd-logistics.com</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Operations Hotline</p>
                                <p className="font-semibold text-slate-200 mt-0.5">+62 817-6086-206</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Helpdesk Hours</p>
                                <p className="font-semibold text-slate-200 mt-0.5">Monday - Sunday: 24 Hours Non-Stop</p>
                            </div>
                        </div>
                    </div>

                    {/* Support Ticket Form */}
                    <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                        <div className="mb-6">
                            <h3 className="text-base font-bold text-slate-900">Submit a Support Ticket</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{isCustomer ? 'Tell us about your shipment or account issue and our team will follow up.' : 'Fill out the form below for operational issues requiring technical attention.'}</p>
                        </div>

                        {ticketSubmitted ? (
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                                <div>
                                    <p className="text-xs font-bold">Support Ticket Submitted Successfully</p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">The GTD technical team will contact you within a maximum of 30 minutes.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Issue Category
                                        </label>
                                        <select
                                            value={ticketCategory}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        >
                                            {activeTicketCategories.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder={isCustomer ? 'Example: Cargo status not updating for ASG-...' : 'Example: PIB Document Upload Failed'}
                                            className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Detailed Issue Description
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder={isCustomer ? 'Describe the issue, your assignment number (e.g. ASG-...), and when it started...' : 'Describe the issue chronology, relevant document/session number, and error messages if any...'}
                                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                                >
                                    <Send size={14} />
                                    <span>Submit Ticket</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
