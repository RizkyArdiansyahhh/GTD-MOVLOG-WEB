import { useState } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
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
        question: 'Bagaimana alur pemantauan status kargo secara real-time?',
        answer: 'Status kargo dipantau secara otomatis melalui modul Cargo Monitoring. Setiap kali petugas lapangan memperbarui status pada checkpoint tertentu, sistem akan langsung menyinkronkan status terkini ke dalam papan pantau supervisor dan portal pelanggan.',
    },
    {
        id: 'faq-2',
        category: 'Cargo & Shipping',
        question: 'Apa yang harus dilakukan jika kargo mengalami keterlambatan di checkpoint?',
        answer: 'Jika terjadi penundaan di luar jadwal estimasi, petugas lapangan wajib mengisi catatan kendala di modul Worker Sessions. Catatan ini akan otomatis memicu alert pada halaman Monitoring Checkpoint untuk ditindaklanjuti oleh Supervisor.',
    },
    {
        id: 'faq-3',
        category: 'Documents & Verification',
        question: 'Berapa lama proses verifikasi dokumen oleh Supervisor?',
        answer: 'Verifikasi dokumen PIB, Manifest, dan Bill of Lading dilakukan secara berkala. Standar Operasional Prosedur (SOP) verifikasi berkas diselesaikan maksimal 1x24 jam kerja setelah dokumen diunggah oleh staf operasional.',
    },
    {
        id: 'faq-4',
        category: 'Documents & Verification',
        question: 'Bagaimana prosedur perbaikan jika dokumen ditolak (Rejected)?',
        answer: 'Dokumen yang ditolak akan menampilkan alasan penolakan pada modul Verify Documents. Staf dapat mengklik detail penolakan, memperbaiki berkas sesuai catatan revisi, dan mengunggah kembali melalui modul Submit Documents.',
    },
    {
        id: 'faq-5',
        category: 'Account & Access',
        question: 'Bagaimana cara mengubah kata sandi atau memperbarui informasi profil?',
        answer: 'Anda dapat mengklik nama profil Anda di pojok kanan atas layar, lalu pilih "Edit Profil". Pada halaman tersebut, Anda dapat memperbarui nama, email, serta kata sandi akun Anda secara mandiri.',
    },
    {
        id: 'faq-6',
        category: 'Account & Access',
        question: 'Siapa yang berwenang menambah atau menonaktifkan akun staf?',
        answer: 'Penambahan dan penonaktifan akun staf serta penetapan hak akses role berada di bawah wewenang Super Admin melalui modul Account Management.',
    },
];

const categories = ['Semua', 'Cargo & Shipping', 'Documents & Verification', 'Account & Access'];

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');
    const [ticketSubmitted, setTicketSubmitted] = useState(false);
    const [formData, setFormData] = useState({ subject: '', category: 'Cargo & Shipping', message: '' });

    const filteredFaqs = faqData.filter((faq) => {
        const matchesCategory = selectedCategory === 'Semua' || faq.category === selectedCategory;
        const matchesSearch =
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) return;
        setTicketSubmitted(true);
        setTimeout(() => {
            setFormData({ subject: '', category: 'Cargo & Shipping', message: '' });
            setTicketSubmitted(false);
        }, 4000);
    };

    return (
        <DashboardLayout title="Help Center - GTD Logistics">
            <Head title="Help Center - GTD Logistics" />

            <div className="max-w-5xl mx-auto space-y-10 pb-12">
                {/* -- Luxury Header Section -- */}
                <div className="text-center space-y-3 pt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                        Pusat Bantuan & Layanan Operational
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Bagaimana Kami Dapat Membantu Anda Hari Ini?
                    </h1>
                    <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                        Temukan solusi cepat terkait operasional logistik, verifikasi dokumen, dan pengelolaan akun sistem GTD.
                    </p>

                    {/* Clean Search Input */}
                    <div className="pt-4 max-w-xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari masalah, dokumen, atau kata kunci..."
                                className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* -- Category Tabs -- */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* -- FAQ Accordion Section -- */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-900">Pertanyaan yang Sering Diajukan (FAQ)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Penjelasan teknis dan jawaban standar operasional sistem.</p>
                    </div>

                    {filteredFaqs.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredFaqs.map((faq) => {
                                const isExpanded = expandedFaq === faq.id;
                                return (
                                    <div key={faq.id} className="py-4 first:pt-2 last:pb-0">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                                            className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                                        >
                                            <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                                                {faq.question}
                                            </span>
                                            <span className="p-1 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </span>
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
                            Tidak ada pertanyaan yang sesuai dengan pencarian Anda.
                        </div>
                    )}
                </div>

                {/* -- Clean Support Contact & Ticket Section -- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Direct Contact Info */}
                    <div className="md:col-span-1 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                                Layanan Bantuan 24/7
                            </span>
                            <h3 className="text-xl font-bold tracking-tight">Hubungi Tim Operasional</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Apabila Anda memerlukan bantuan darurat di luar jam kerja umum, tim support GTD siap membantu Anda.
                            </p>
                        </div>

                        <div className="space-y-3 border-t border-slate-800 pt-4 text-xs">
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Email Support</p>
                                <p className="font-semibold text-slate-200 mt-0.5">support@gtd-logistics.com</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Hotline Operasional</p>
                                <p className="font-semibold text-slate-200 mt-0.5">+62 21 8000 9988</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Jam Kerja Helpdesk</p>
                                <p className="font-semibold text-slate-200 mt-0.5">Senin - Minggu: 24 Jam Non-Stop</p>
                            </div>
                        </div>
                    </div>

                    {/* Support Ticket Form */}
                    <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                        <div className="mb-6">
                            <h3 className="text-base font-bold text-slate-900">Kirimkan Tiket Bantuan</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Isi formulir di bawah ini untuk kendala operasional yang membutuhkan penanganan teknis.</p>
                        </div>

                        {ticketSubmitted ? (
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                                <div>
                                    <p className="text-xs font-bold">Tiket Bantuan Berhasil Terkirim</p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">Tim teknis GTD akan segera menghubungi Anda dalam waktu maksimal 30 menit.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Kategori Kendala
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        >
                                            <option value="Cargo & Shipping">Cargo & Shipping</option>
                                            <option value="Documents & Verification">Documents & Verification</option>
                                            <option value="Account & Access">Account & Access</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Subjek Kendala
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Contoh: Berkas PIB Gagal Diunggah"
                                            className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Deskripsi Kendala Secara Detail
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Jelaskan kronologi kendala, nomor dokumen/sesi terkait, dan pesan error jika ada..."
                                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                                >
                                    <Send size={14} />
                                    <span>Kirimkan Tiket</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
