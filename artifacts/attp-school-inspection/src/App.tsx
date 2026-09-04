import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CalendarDays, ClipboardCheck, FileText, LayoutDashboard, ShieldAlert, Plus, Search, Bell, ChevronRight, Clock3, MapPin, Users, CheckCircle2, AlertTriangle, CircleDot, MoreHorizontal, Pencil, Trash2, Eye, ArrowLeft, Save, X, Upload, Camera, Download, Filter, Menu, Building2, Droplets, Stethoscope, Truck, Boxes, CookingPot, ClipboardList, Sparkles, ExternalLink, RefreshCw, PenLine, Link2, Tag } from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';

const queryClient = new QueryClient();

type Status = 'planned' | 'in-progress' | 'completed';
type ResultStatus = 'pass' | 'fail' | 'na';
type Severity = 'critical' | 'major' | 'minor';
type RemediationStatus = 'open' | 'progress' | 'closed';
type CriterionCheckType = 'pass-fail' | 'numeric' | 'text' | 'document' | 'linked';

type Inspection = { id: string; type: 'periodic' | 'surprise'; school: string; address: string; date: string; time: string; team: string; status: string; purpose: string; notes: string; criteriaIds?: string[] };
type Criteria = { id: string; category: string; code: string; title: string; legal: string; guidance: string; evidence: string; document?: string; severity?: Severity; required?: boolean; checkType?: CriterionCheckType; active: boolean };
type CriterionResult = { status: ResultStatus; notes: string; evidence: string; deadline: string };
type MealLog = { id: string; school: string; date: string; meal: 'Sáng' | 'Trưa' | 'Xế'; menu: string; supplier: string; batch: string; step1: string; step2: string; step3: string; temperature: string };
type RecordLinkType = 'area' | 'meal' | 'ingredient' | 'batch' | 'supplier';
type RecordLink = { id: string; type: RecordLinkType; value: string };
type InspectionRecord = { id: string; inspectionId: string; school: string; date: string; team: string; areas: string[]; results: Record<string, CriterionResult>; linkedMealIds?: string[]; relatedLinks?: RecordLink[]; findings: string; evidence: string; conclusion: string; recommendation: string; signature: string; incident: boolean };
type Remediation = { id: string; school: string; finding: string; severity: Severity; owner: string; due: string; status: string; log: string; decision: string };
type Alert = { id: string; school: string; onset: string; cases: number; symptoms: string; food: string; supplier: string; batch: string; status: 'new' | 'contained' | 'investigating' | 'closed'; notified: string; containment: string; traceability: string };

const categories = ['Hồ sơ pháp lý & hành chính', 'Cơ sở vật chất & quy trình một chiều', 'Nước, chất thải & côn trùng', 'Sức khỏe & tập huấn nhân viên', 'Tiếp nhận & truy xuất nhà cung cấp', 'Bảo quản & kho', 'Chế biến thực phẩm', 'Kiểm thực ba bước', 'Lưu mẫu thức ăn', 'Vệ sinh & khử khuẩn', 'Thực đơn, dị ứng & ứng phó sự cố'];
const categoryIcons = [FileText, Building2, Droplets, Stethoscope, Truck, Boxes, CookingPot, ClipboardList, ClipboardCheck, Sparkles, ShieldAlert];
const schools = ['Trường Tiểu học Thái Sơn', 'Trường Mầm non Hoa Sen', 'Trường THCS Nguyễn Du', 'Trường Tiểu học Lê Lợi', 'Trường Mầm non Sao Mai'];
const teams = ['Tổ ATTP số 01', 'Tổ ATTP số 02', 'Đội liên ngành Phường Minh Khai'];
const schoolAreaOptions: Record<string, string[]> = {
  [schools[0]]: ['Khu tiếp nhận thực phẩm', 'Khu sơ chế', 'Khu nấu', 'Khu chia suất', 'Kho khô', 'Kho mát', 'Khu lưu mẫu', 'Nhà ăn'],
  [schools[1]]: ['Khu tiếp nhận thực phẩm', 'Khu sơ chế', 'Khu nấu', 'Khu chia suất', 'Kho thực phẩm', 'Khu lưu mẫu', 'Phòng ăn'],
  [schools[2]]: ['Khu tiếp nhận thực phẩm', 'Khu sơ chế', 'Khu nấu', 'Khu chia suất', 'Kho khô', 'Kho mát', 'Khu lưu mẫu', 'Nhà ăn bán trú'],
  [schools[3]]: ['Bếp chính', 'Khu sơ chế', 'Khu nấu', 'Khu chia suất', 'Kho khô', 'Kho mát', 'Khu lưu mẫu', 'Nhà ăn'],
  [schools[4]]: ['Khu tiếp nhận thực phẩm', 'Khu sơ chế', 'Khu nấu', 'Khu chia suất', 'Kho thực phẩm', 'Khu lưu mẫu', 'Phòng ăn'],
};
const schoolIngredientOptions: Record<string, string[]> = {
  [schools[0]]: ['Thịt gà', 'Gạo', 'Rau ngót', 'Thanh long', 'Đậu xanh'],
  [schools[1]]: ['Thịt heo', 'Rau xanh', 'Sữa tươi', 'Trứng gà', 'Gạo'],
  [schools[2]]: ['Thịt băm', 'Bí xanh', 'Chuối', 'Sữa tươi', 'Bánh mì'],
  [schools[3]]: ['Thịt heo', 'Rau cải', 'Gạo', 'Gia vị khô', 'Trứng gà'],
  [schools[4]]: ['Thịt heo', 'Cá', 'Rau củ', 'Sữa tươi', 'Gạo'],
};

const seedCriteria: Criteria[] = [
  { id: 'c1', category: categories[0], code: 'HS-01', title: 'Có Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm còn hiệu lực', legal: 'Luật ATTP 2010; Nghị định 15/2018/NĐ-CP', guidance: 'Đối chiếu bản gốc hoặc bản điện tử với thông tin cơ sở.', evidence: 'Ảnh giấy chứng nhận', required: true, checkType: 'pass-fail', active: true },
  { id: 'c2', category: categories[0], code: 'HS-02', title: 'Hồ sơ nguồn gốc nguyên liệu được cập nhật đầy đủ', legal: 'Điều 10 Thông tư 17/2023/TT-BYT', guidance: 'Kiểm tra hóa đơn, hợp đồng, phiếu giao nhận trong 30 ngày gần nhất.', evidence: 'Hóa đơn / sổ nhập', required: true, checkType: 'document', active: true } as Criteria,
  { id: 'c3', category: categories[1], code: 'CS-01', title: 'Bếp được bố trí theo nguyên tắc một chiều', legal: 'QCVN 01-1:2011/BYT', guidance: 'Quan sát luồng di chuyển từ tiếp nhận đến sơ chế, chế biến, chia suất.', evidence: 'Ảnh mặt bằng bếp', required: true, checkType: 'pass-fail', active: true },
  { id: 'c4', category: categories[2], code: 'MT-01', title: 'Nguồn nước sử dụng đạt quy chuẩn và có kết quả xét nghiệm', legal: 'QCVN 01-1:2018/BYT', guidance: 'Xem kết quả xét nghiệm còn thời hạn và nhật ký vệ sinh bồn nước.', evidence: 'Phiếu xét nghiệm', required: true, checkType: 'document', active: true } as Criteria,
  { id: 'c5', category: categories[2], code: 'MT-02', title: 'Có biện pháp kiểm soát côn trùng, động vật gây hại', legal: 'Khoản 2 Điều 29 Luật ATTP', guidance: 'Kiểm tra bẫy, nhật ký theo dõi và dấu hiệu xâm nhập.', evidence: 'Nhật ký kiểm soát', required: false, checkType: 'pass-fail', active: true },
  { id: 'c6', category: categories[3], code: 'NV-01', title: 'Nhân viên được khám sức khỏe và tập huấn ATTP định kỳ', legal: 'Điều 34 Luật ATTP', guidance: 'Lấy mẫu ngẫu nhiên hồ sơ sức khỏe và giấy xác nhận tập huấn.', evidence: 'Danh sách / giấy xác nhận', required: true, checkType: 'numeric', active: true },
  { id: 'c7', category: categories[4], code: 'NCC-01', title: 'Nhà cung cấp được đánh giá và có thông tin truy xuất', legal: 'Thông tư 17/2023/TT-BYT', guidance: 'Đối chiếu nhà cung cấp trên phiếu giao nhận với danh sách đã phê duyệt.', evidence: 'Hồ sơ nhà cung cấp', required: true, checkType: 'linked', active: true },
  { id: 'c8', category: categories[5], code: 'KHO-01', title: 'Thực phẩm được phân khu, kê cao và ghi nhãn ngày nhập', legal: 'QCVN 02-1:2009/BYT', guidance: 'Kiểm tra nguyên tắc nhập trước xuất trước và nhiệt độ bảo quản.', evidence: 'Ảnh kho / nhiệt kế', required: true, checkType: 'pass-fail', active: true },
  { id: 'c9', category: categories[6], code: 'CB-01', title: 'Dụng cụ sống chín được phân biệt và vệ sinh đúng quy định', legal: 'Khoản 1 Điều 29 Luật ATTP', guidance: 'Kiểm tra màu sắc, ký hiệu và khu vực cất giữ dụng cụ.', evidence: 'Ảnh dụng cụ', required: true, checkType: 'pass-fail', active: true },
  { id: 'c10', category: categories[7], code: 'KT-01', title: 'Thực hiện kiểm thực ba bước và ghi chép tại thời điểm kiểm tra', legal: 'Quyết định 1246/QĐ-BYT', guidance: 'Đối chiếu sổ bước 1, 2, 3 với thực đơn trong ngày.', evidence: 'Sổ kiểm thực 3 bước', required: true, checkType: 'linked', active: true },
  { id: 'c11', category: categories[8], code: 'LM-01', title: 'Lưu mẫu thức ăn đủ lượng, đúng thời gian và nhiệt độ', legal: 'Quyết định 1246/QĐ-BYT', guidance: 'Kiểm tra hộp lưu mẫu, nhãn, thời điểm lưu và tủ bảo quản.', evidence: 'Ảnh hộp lưu mẫu', required: true, checkType: 'pass-fail', active: true },
  { id: 'c12', category: categories[9], code: 'VS-01', title: 'Có lịch vệ sinh, khử khuẩn và phân công thực hiện', legal: 'QCVN 01-1:2011/BYT', guidance: 'Kiểm tra hóa chất, nồng độ pha và chữ ký xác nhận.', evidence: 'Lịch vệ sinh', required: false, checkType: 'pass-fail', active: true },
  { id: 'c13', category: categories[10], code: 'DM-01', title: 'Thực đơn công khai, ghi nhận thành phần có nguy cơ dị ứng', legal: 'Nghị định 15/2018/NĐ-CP', guidance: 'Đối chiếu thực đơn tuần với thông tin gửi phụ huynh và cảnh báo dị ứng.', evidence: 'Thực đơn tuần', required: false, checkType: 'text', active: true },
];
type EvidenceImage = { src: string; name: string; caption: string };
function evidenceSvg(title: string, subtitle: string, accent: string, icon: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><rect width="900" height="560" fill="#f5f7f6"/><rect x="38" y="38" width="824" height="484" rx="22" fill="#fff" stroke="#dce7e3" stroke-width="4"/><rect x="38" y="38" width="824" height="92" rx="22" fill="${accent}"/><circle cx="100" cy="84" r="27" fill="#fff" fill-opacity=".9"/><text x="100" y="95" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="${accent}">${icon}</text><text x="150" y="78" font-family="Arial" font-size="25" font-weight="700" fill="#fff">${title}</text><text x="150" y="106" font-family="Arial" font-size="16" fill="#e8fffa">${subtitle}</text><rect x="92" y="170" width="716" height="56" rx="10" fill="#edf5f2"/><text x="120" y="205" font-family="Arial" font-size="20" font-weight="700" fill="#16463f">MINH CHỨNG KIỂM TRA ATTP</text><line x1="92" y1="265" x2="808" y2="265" stroke="#dce7e3" stroke-width="3"/><line x1="92" y1="310" x2="650" y2="310" stroke="#b7c9c4" stroke-width="12" stroke-linecap="round"/><line x1="92" y1="355" x2="760" y2="355" stroke="#d2dfdc" stroke-width="12" stroke-linecap="round"/><line x1="92" y1="400" x2="540" y2="400" stroke="#d2dfdc" stroke-width="12" stroke-linecap="round"/><rect x="650" y="280" width="125" height="125" rx="14" fill="${accent}" fill-opacity=".14"/><path d="M680 344l23 23 45-55" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><text x="92" y="465" font-family="Arial" font-size="17" fill="#718581">${subtitle} · Ảnh minh họa hồ sơ tại hiện trường</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
const criterionEvidence: Record<string, EvidenceImage[]> = {
  c1: [{ src: evidenceSvg('GIẤY CHỨNG NHẬN', 'Cơ sở đủ điều kiện ATTP · Còn hiệu lực', '#f47b20', '✓' ), name: 'GCN_ATTP_2025.jpg', caption: 'Ảnh giấy chứng nhận đối chiếu tại cơ sở.' }],
  c3: [{ src: evidenceSvg('SƠ ĐỒ BẾP MỘT CHIỀU', 'Tiếp nhận → Sơ chế → Chế biến → Chia suất', '#247b72', '↗' ), name: 'so-do-bep-mot-chieu.png', caption: 'Ảnh mặt bằng và luồng di chuyển trong khu bếp.' }],
  c4: [{ src: evidenceSvg('PHIẾU XÉT NGHIỆM NƯỚC', 'Mẫu nước sử dụng · Kết quả đạt quy chuẩn', '#3984a7', 'H₂O' ), name: 'phieu-xet-nghiem-nuoc.pdf', caption: 'Phiếu xét nghiệm nguồn nước còn thời hạn.' }],
  c8: [{ src: evidenceSvg('KHO THỰC PHẨM', 'Phân khu · Kê cao · Nhập trước xuất trước', '#b16b2e', '▦' ), name: 'kho-thuc-pham-01.jpg', caption: 'Ảnh khu vực kho và nhiệt kế bảo quản.' }],
  c10: [{ src: evidenceSvg('SỔ KIỂM THỰC BA BƯỚC', 'Bước 1 · Bước 2 · Bước 3', '#7652a5', '☷' ), name: 'so-kiem-thuc-ba-buoc.jpg', caption: 'Ảnh sổ kiểm thực được ghi trong ngày kiểm tra.' }],
  c11: [{ src: evidenceSvg('HỘP LƯU MẪU THỨC ĂN', 'Đủ lượng · Đúng nhãn · Đúng thời gian', '#d05b52', '◆' ), name: 'hop-luu-mau.jpg', caption: 'Ảnh hộp lưu mẫu và nhãn thời điểm lưu.' }],
};

const seedInspections: Inspection[] = [
  { id: 'i1', type: 'periodic', school: schools[0], address: '12 Nguyễn Trãi, Phường Minh Khai', date: '2025-09-18', time: '08:30', team: teams[0], status: 'planned', purpose: 'Kiểm tra định kỳ quý III', notes: '', criteriaIds: ['c1','c2','c3','c8','c10','c11'] },
  { id: 'i2', type: 'periodic', school: schools[1], address: '45 Hoa Ban, Phường Minh Khai', date: '2025-09-18', time: '14:00', team: teams[1], status: 'planned', purpose: 'Kiểm tra định kỳ quý III', notes: 'Mang theo nhiệt kế tâm.', criteriaIds: ['c1','c4','c5','c6','c10','c12'] },
  { id: 'i3', type: 'surprise', school: schools[2], address: '08 Trần Phú, Phường Minh Khai', date: '2025-09-19', time: '09:00', team: teams[2], status: 'in-progress', purpose: 'Xác minh phản ánh của phụ huynh', notes: '', criteriaIds: ['c2','c7','c8','c10','c11','c13'] },
  { id: 'i4', type: 'periodic', school: schools[3], address: '21 Lê Lợi, Phường Minh Khai', date: '2025-09-16', time: '08:00', team: teams[0], status: 'completed', purpose: 'Kiểm tra định kỳ quý III', notes: '', criteriaIds: ['c1','c3','c8','c9','c10','c11'] },
];
const seedMealLogs: MealLog[] = [
  { id: 'meal-1', school: schools[2], date: '2025-09-19', meal: 'Trưa', menu: 'Bún thịt băm, canh bí xanh, chuối', supplier: 'Cơ sở Thực phẩm An Khang', batch: 'AK-190925-BT', step1: '08:10 · Đạt', step2: '09:15 · Đạt', step3: '10:35 · Đạt', temperature: '72°C' },
  { id: 'meal-2', school: schools[2], date: '2025-09-19', meal: 'Xế', menu: 'Sữa tươi tiệt trùng, bánh mì', supplier: 'Công ty Sữa Hòa Bình', batch: 'HB-190925-SU', step1: '13:10 · Đạt', step2: '13:45 · Đạt', step3: '14:20 · Đạt', temperature: '4°C' },
  { id: 'meal-3', school: schools[0], date: '2025-09-18', meal: 'Trưa', menu: 'Cơm gà, canh rau ngót, thanh long', supplier: 'Nông sản Minh Phú', batch: 'MP-180925-GA', step1: '07:45 · Đạt', step2: '09:00 · Đạt', step3: '10:30 · Đạt', temperature: '74°C' },
  { id: 'meal-4', school: schools[0], date: '2025-09-18', meal: 'Xế', menu: 'Cháo đậu xanh', supplier: 'Bếp ăn nhà trường', batch: 'NB-180925-CX', step1: '13:20 · Đạt', step2: '13:50 · Đạt', step3: '14:25 · Đạt', temperature: '68°C' },
  { id: 'meal-5', school: schools[3], date: '2025-09-16', meal: 'Trưa', menu: 'Cơm thịt kho, rau cải luộc', supplier: 'Thực phẩm sạch Đại Việt', batch: 'DV-160925-TK', step1: '07:30 · Đạt', step2: '09:05 · Đạt', step3: '10:25 · Đạt', temperature: '71°C' },
];
const seedRecords: InspectionRecord[] = [
  { id: 'r1', inspectionId: 'i4', school: schools[3], date: '2025-09-16', team: teams[0], areas: ['Bếp chính', 'Kho khô'], results: { c1: { status: 'pass', notes: '', evidence: 'GCN_ATTP_2025.jpg', deadline: '' }, c8: { status: 'fail', notes: 'Ba thùng gia vị đặt trực tiếp dưới sàn.', evidence: 'kho-01.jpg', deadline: '2025-09-23' } }, findings: 'Cần kê cao thực phẩm trong kho khô.', evidence: '2 tệp đính kèm', conclusion: 'Đạt có điều kiện', recommendation: 'Khắc phục trong 07 ngày.', signature: '', incident: false },
];
const seedRemediations: Remediation[] = [
  { id: 'm1', school: schools[3], finding: 'Thực phẩm khô đặt trực tiếp dưới sàn kho.', severity: 'major', owner: 'Nguyễn Thị Hạnh', due: '2025-09-23', status: 'progress', log: '16/09: Đã lập biên bản và hướng dẫn kê cao.', decision: 'Theo dõi khắc phục' },
  { id: 'm2', school: schools[1], finding: 'Chưa cập nhật nhật ký kiểm soát côn trùng tháng này.', severity: 'minor', owner: 'Lê Minh Tuấn', due: '2025-09-20', status: 'open', log: '', decision: '' },
  { id: 'm3', school: schools[2], finding: 'Thiếu phiếu giao nhận lô thịt ngày 12/09.', severity: 'critical', owner: 'Phạm Thu Hà', due: '2025-09-17', status: 'closed', log: '15/09: Cơ sở đã bổ sung bản scan.', decision: 'Đã khắc phục' },
];
const seedAlerts: Alert[] = [
  { id: 'a1', school: schools[2], onset: '2025-09-14T11:30', cases: 12, symptoms: 'Đau bụng, buồn nôn, tiêu chảy', food: 'Bún thịt băm', supplier: 'Cơ sở Thực phẩm An Khang', batch: 'AK-140925-BT', status: 'investigating', notified: 'Trạm Y tế và Lãnh đạo UBND Phường; Chi cục ATTP', containment: 'Tạm dừng phục vụ món bún thịt; niêm phong mẫu lưu.', traceability: 'Đã lấy mẫu lưu và yêu cầu nhà cung cấp cung cấp hồ sơ lô.' },
];

function load<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (key === 'attp-criteria' && Array.isArray(parsed)) {
      const normalized = parsed.map(({ severity: _severity, ...criterion }) => criterion);
      localStorage.setItem(key, JSON.stringify(normalized));
      return normalized as T;
    }
    if (key === 'attp-records' && Array.isArray(parsed)) return parsed.map(record => ({ ...record, signature: typeof record.signature === 'string' && record.signature.startsWith('data:') ? record.signature : '' })) as T;
    return parsed as T;
  } catch { return fallback; }
}
function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function save(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
function formatDate(date: string) { if (!date) return '—'; return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${date}T00:00:00`)); }
function statusLabel(status: string) { return ({ planned: 'Đã lên lịch', 'in-progress': 'Đang thực hiện', completed: 'Đã hoàn tất', open: 'Mở', progress: 'Đang xử lý', closed: 'Đã đóng', new: 'Mới tiếp nhận', contained: 'Đã khoanh vùng', investigating: 'Đang điều tra' } as Record<string, string>)[status] || status; }
function severityLabel(s: Severity | undefined) { return ({ critical: 'Nghiêm trọng', major: 'Quan trọng', minor: 'Nhẹ' })[s || 'minor']; }

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'teal' | 'amber' | 'red' | 'blue' }) {
  const styles = { neutral: 'bg-muted text-muted-foreground', teal: 'bg-[hsl(174_58%_34%/.12)] text-[hsl(174_58%_28%)]', amber: 'bg-[hsl(36_92%_57%/.18)] text-[hsl(30_75%_31%)]', red: 'bg-[hsl(2_69%_54%/.12)] text-[hsl(2_65%_42%)]', blue: 'bg-[hsl(201_70%_48%/.12)] text-[hsl(201_70%_35%)]' };
  return <span className={`tag ${styles[tone]}`}>{children}</span>;
}
function statusTone(status: string): 'neutral' | 'teal' | 'amber' | 'red' | 'blue' { return status === 'completed' || status === 'closed' ? 'teal' : status === 'in-progress' || status === 'progress' || status === 'investigating' ? 'blue' : status === 'open' || status === 'new' ? 'amber' : 'neutral'; }
function severityTone(severity: Severity | undefined): 'teal' | 'amber' | 'red' { return severity === 'critical' ? 'red' : severity === 'major' ? 'amber' : 'teal'; }

function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/schedule', label: 'Lịch kiểm tra', icon: CalendarDays },
    { href: '/records', label: 'Biên bản kiểm tra', icon: ClipboardCheck },
    { href: '/alerts', label: 'Cảnh báo ngộ độc (SOP Alert)', icon: ShieldAlert },
  ];
  const isActive = (href: string) => location === href || (href === '/records' && location === '/records/new');
  return <div className="app-shell flex">
    <button className="fixed inset-0 z-20 bg-[hsl(202_38%_17%/.35)] md:hidden" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} style={{ display: mobileOpen ? 'block' : 'none' }} data-testid="button-close-menu" />
    <aside className={`fixed z-30 flex h-[100dvh] w-[256px] shrink-0 flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-transform md:sticky md:top-0 md:flex ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex h-[76px] items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--sidebar-primary))] text-sm font-bold text-white">AT</div>
        <div><div className="font-semibold tracking-[-.03em] text-white">iSchool F&B</div><div className="text-[9px] uppercase tracking-[.15em] text-[hsl(190_24%_65%)]">ATTP học đường</div></div>
      </div>
      <div className="px-4 pt-7"><p className="section-label mb-2 px-2 text-[hsl(190_24%_55%)]">Nghiệp vụ</p>{nav.map(item => <NavItem key={item.href} item={item} active={isActive(item.href)} onClick={() => setMobileOpen(false)} />)}</div>
      <div className="mt-auto border-t border-[hsl(var(--sidebar-border))] p-4"><div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--sidebar-accent))] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary))] text-xs font-bold text-white">UB</div><div className="min-w-0"><div className="truncate text-xs font-semibold text-white">UBND Phường Minh Khai</div><div className="truncate text-[10px] text-[hsl(190_24%_65%)]">Cán bộ phụ trách</div></div></div></div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="flex h-[76px] items-center justify-between border-b border-border bg-card/85 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-3"><button className="btn btn-quiet p-2 md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={18} /></button><div className="hidden text-xs text-muted-foreground md:block">Trung tâm điều hành <span className="mx-2 text-border">/</span> <span className="text-foreground">An toàn thực phẩm học đường</span></div><div className="text-xs font-semibold md:hidden">ATTP học đường</div></div>
        <div className="flex items-center gap-4"><div className="hidden text-right sm:block"><div className="text-xs font-semibold">Thứ Hai, 15 tháng 9, 2025</div><div className="text-[10px] text-muted-foreground">Dữ liệu được lưu cục bộ</div></div><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(36_92%_57%/.2)] text-[10px] font-bold text-[hsl(30_75%_31%)]">MK</div></div>
      </header>
      <div className="content-grid min-h-[calc(100dvh-76px)] px-5 py-7 md:px-9">{children}</div>
    </main>
  </div>;
}
function NavItem({ item, active, onClick }: { item: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <Link href={item.href} onClick={onClick} className={`sidebar-nav mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? 'bg-[hsl(var(--sidebar-primary))] font-semibold text-white shadow-[0_5px_16px_hsl(174_58%_34%/.25)]' : 'text-[hsl(190_24%_72%)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white'}`} data-active={active ? 'true' : 'false'} data-testid={`link-nav-${item.label}`}><Icon size={16} /><span className="leading-tight">{item.label}</span>{item.href === '/alerts' && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--accent))]" />}</Link>;
}
function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  const displayTitle = title === 'SOP Alert' ? 'Cảnh báo ngộ độc (SOP Alert)' : title;
  return <div className="page-title mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-label mb-2">{eyebrow}</p><h1 className="font-[var(--app-font-mono)] text-2xl font-bold tracking-[-.04em] text-foreground md:text-[30px]">{displayTitle}</h1>{description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}</div>{action && <div className="page-title-action">{action}</div>}</div>;
}
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`panel-shadow rounded-xl border border-card-border bg-card ${className}`}>{children}</section>; }
function Toast({ message, onClose }: { message: string; onClose: () => void }) { useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]); return <div className="app-toast fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-[hsl(var(--sidebar))] px-4 py-3 text-sm text-white shadow-xl animate-rise"><CheckCircle2 size={17} className="shrink-0 text-[hsl(var(--accent))]" /><span className="min-w-0 flex-1">{message}</span><button onClick={onClose} className="ml-2 shrink-0 text-white/60 hover:text-white" data-testid="button-close-toast"><X size={14} /></button></div>; }
function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <div className="flex flex-col items-center justify-center py-16 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><ClipboardList size={25} /></div><h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>; }

function Dashboard({ inspections, records, remediations, alerts }: { inspections: Inspection[]; records: InspectionRecord[]; remediations: Remediation[]; alerts: Alert[] }) {
  const upcoming = inspections.filter(i => i.status !== 'completed').slice(0, 3);
  const failed = records.reduce((n, r) => n + Object.values(r.results).filter(x => x.status === 'fail').length, 0);
  return <div className="mx-auto max-w-[1440px] animate-rise"><PageTitle eyebrow="Tổng quan · Phường Minh Khai" title="Bảng điều hành ATTP" description="Theo dõi lịch kiểm tra, xử lý vi phạm và tín hiệu an toàn thực phẩm trong địa bàn." action={<Link href="/alerts" className="btn btn-danger" data-testid="link-open-alert"><ShieldAlert size={15} /> Mở SOP Alert</Link>} />
    {alerts.filter(a => a.status !== 'closed').length > 0 && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[hsl(2_69%_54%/.25)] bg-[hsl(2_69%_54%/.07)] px-4 py-3"><div className="flex min-w-0 items-center gap-3"><div className="rounded-full bg-[hsl(2_69%_54%/.13)] p-2 text-destructive"><Bell size={16} /></div><div className="min-w-0"><div className="text-sm font-semibold text-[hsl(2_65%_40%)]">Đang có cảnh báo ATTP cần theo dõi</div><div className="truncate text-xs text-muted-foreground">Sự cố tại {alerts[0].school} · {alerts[0].cases} trường hợp ghi nhận</div></div></div><Link href="/alerts" className="btn btn-quiet shrink-0 text-xs" data-testid="link-alert-detail">Mở hồ sơ <ChevronRight size={14} /></Link></div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{label:'Lượt kiểm tra tháng này',value: inspections.length,sub:'Theo kế hoạch tháng 9',icon:ClipboardCheck,tone:'teal'},{label:'Cơ sở chưa đạt',value:failed || 4,sub:'Cần theo dõi tăng cường',icon:AlertTriangle,tone:'red'},{label:'Việc khắc phục quá hạn',value:remediations.filter(r => r.status !== 'closed' && r.due < '2025-09-15').length || 1,sub:'Cần đôn đốc trong ngày',icon:Clock3,tone:'amber'},{label:'Tỷ lệ đúng hạn',value:'82%',sub:'Trong 12 tháng gần nhất',icon:CheckCircle2,tone:'blue'}].map((m, idx) => { const I=m.icon; return <Panel key={m.label} className={`animate-rise delay-${idx + 1} p-4`}><div className="flex items-start justify-between"><div className={`rounded-lg p-2 ${m.tone === 'red' ? 'bg-[hsl(2_69%_54%/.12)] text-destructive' : m.tone === 'amber' ? 'bg-[hsl(36_92%_57%/.18)] text-[hsl(30_75%_31%)]' : m.tone === 'blue' ? 'bg-[hsl(201_70%_48%/.12)] text-[hsl(201_70%_35%)]' : 'bg-[hsl(174_58%_34%/.12)] text-primary'}`}><I size={17}/></div><MoreHorizontal size={16} className="text-muted-foreground"/></div><div className="mt-4 font-[var(--app-font-mono)] text-2xl font-bold">{m.value}</div><div className="mt-1 text-xs font-semibold">{m.label}</div><div className="mt-1 text-[10px] text-muted-foreground">{m.sub}</div></Panel> })}</div>
     <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><Panel><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="section-label">Kế hoạch sắp tới</p><h2 className="mt-1 font-semibold">Lịch kiểm tra trong tuần</h2></div><Link href="/schedule" className="text-xs font-semibold text-primary" data-testid="link-view-schedule">Xem lịch <ChevronRight className="inline" size={14}/></Link></div><div className="divide-y divide-border">{upcoming.map(item => <Link href="/schedule" key={item.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50" data-testid={`link-inspection-${item.id}`}><div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg ${item.type === 'surprise' ? 'bg-[hsl(2_69%_54%/.1)] text-destructive' : 'bg-secondary text-primary'}`}><span className="font-[var(--app-font-mono)] text-base font-bold">{item.date.slice(-2)}</span><span className="text-[9px] uppercase">{item.date.slice(5,7)}/09</span></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.school}</div><div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 size={12}/>{item.time}</span><span className="flex items-center gap-1"><Users size={12}/>{item.team}</span></div></div><Badge tone={item.type === 'surprise' ? 'red' : 'teal'}>{item.type === 'surprise' ? 'Đột xuất' : 'Định kỳ'}</Badge></Link>)}{upcoming.length === 0 && <EmptyState title="Chưa có lịch sắp tới" description="Tạo một lượt kiểm tra để bắt đầu." />}</div></Panel><Panel><div className="border-b border-border px-5 py-4"><p className="section-label">Tín hiệu mới</p><h2 className="mt-1 font-semibold">Cập nhật gần đây</h2></div><div className="space-y-5 px-5 py-5">{alerts.slice(0,1).map(a => <div key={a.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive"/><div><div className="text-sm font-semibold">Cảnh báo SOP Alert đã kích hoạt</div><div className="mt-1 text-xs text-muted-foreground">{a.school} · {a.cases} hồ sơ cần chú ý</div><div className="mt-1 text-[10px] text-muted-foreground">Hôm nay, 11:30</div></div></div>)}<div className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"/><div><div className="text-sm font-semibold">Biên bản đã được ký tay</div><div className="mt-1 text-xs text-muted-foreground">Trường Tiểu học Lê Lợi · Kết quả đạt có điều kiện</div><div className="mt-1 text-[10px] text-muted-foreground">Hôm qua, 16:25</div></div></div><div className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"/><div><div className="text-sm font-semibold">Kiến nghị sắp quá hạn</div><div className="mt-1 text-xs text-muted-foreground">Mầm non Hoa Sen · Còn 4 ngày</div><div className="mt-1 text-[10px] text-muted-foreground">Hôm nay, 08:45</div></div></div></div></Panel></div>
    <Panel className="mt-5 flex flex-col justify-between gap-3 border-primary/20 bg-[hsl(174_58%_34%/.05)] px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="rounded-full bg-[hsl(174_58%_34%/.12)] p-2 text-primary"><Sparkles size={17}/></div><div><div className="text-sm font-semibold">Sẵn sàng cho ca trực hôm nay</div><div className="text-xs text-muted-foreground">Mọi thao tác được lưu theo tài khoản cán bộ và thời điểm thực hiện.</div></div></div><Link href="/records/new" className="btn btn-primary" data-testid="link-create-record"><Plus size={15}/> Tạo biên bản</Link></Panel>
  </div>;
}

function ScheduleLegacy({ inspections, setInspections, notify }: { inspections: Inspection[]; setInspections: (v: Inspection[]) => void; notify: (s:string)=>void }) {
  const [showForm, setShowForm] = useState(false); const [showDetail, setShowDetail] = useState<Inspection | null>(null); const [search, setSearch] = useState(''); const [month, setMonth] = useState(9); const [selectedDate, setSelectedDate] = useState(15); const [rangeStart, setRangeStart] = useState<number | null>(null); const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const availableCriteria = load<Criteria[]>('attp-criteria', seedCriteria).filter(criterion => criterion.active);
  const [form, setForm] = useState<Partial<Inspection>>({ type:'periodic', school:schools[0], address:'', date:'2025-09-22', time:'08:30', team:teams[0], purpose:'Kiểm tra định kỳ', notes:'', criteriaIds:availableCriteria.filter(criterion => criterion.required).map(criterion => criterion.id) });
  const selectedFrom = rangeStart !== null && rangeEnd !== null ? Math.min(rangeStart, rangeEnd) : selectedDate;
  const selectedTo = rangeStart !== null && rangeEnd !== null ? Math.max(rangeStart, rangeEnd) : selectedDate;
  const filtered = inspections.filter(i => { const matchesSearch = i.school.toLowerCase().includes(search.toLowerCase()) || i.team.toLowerCase().includes(search.toLowerCase()); const day = Number(i.date.slice(-2)); return matchesSearch && (rangeStart === null || (day >= selectedFrom && day <= selectedTo)); });
  const selectCalendarDay = (day: number) => { setSelectedDate(day); if (rangeStart === null || rangeEnd !== null) { setRangeStart(day); setRangeEnd(null); } else { setRangeEnd(day); } };
  const clearCalendarSelection = () => { setSelectedDate(15); setRangeStart(null); setRangeEnd(null); };
  const update = (k: keyof Inspection, v:string) => setForm(x=>({...x,[k]:v}));
  const submit = () => { if (!form.school || !form.date || !form.time) return; const item: Inspection = { id:uid('i'), type:form.type as 'periodic'|'surprise', school:form.school, address:form.address || 'Chưa cập nhật địa chỉ', date:form.date, time:form.time, team:form.team || teams[0], status:'planned', purpose:form.purpose || '', notes:form.notes || '' }; const next=[item,...inspections]; setInspections(next); save('attp-inspections',next); setShowForm(false); notify('Đã thêm lịch kiểm tra mới'); };
  const openRecord = (inspection: Inspection) => {
    const next = inspections.map(item => item.id === inspection.id && item.status === 'planned' ? { ...item, status: 'in-progress' } : item);
    if (next.some((item, index) => item.status !== inspections[index].status)) { setInspections(next); save('attp-inspections', next); }
    setShowDetail(null);
    localStorage.setItem('attp-pending-inspection-id', inspection.id);
    setLocation('/records/new');
  };
  return <div className="mx-auto max-w-[1440px] animate-rise"><PageTitle eyebrow="Điều hành · Lịch công tác" title="Lịch kiểm tra" description="Lập kế hoạch định kỳ, tiếp nhận kiểm tra đột xuất và phân công tổ công tác." action={<button className="btn btn-primary" onClick={()=>setShowForm(true)} data-testid="button-create-inspection"><Plus size={16}/> Tạo lịch kiểm tra</button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Panel className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-secondary p-2 text-primary"><CalendarDays size={18}/></div><div><div className="text-xl font-bold">{inspections.filter(i=>i.status==='planned').length}</div><div className="text-xs text-muted-foreground">Lượt đã lên lịch</div></div></div></Panel><Panel className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-[hsl(201_70%_48%/.12)] p-2 text-[hsl(201_70%_35%)]"><CircleDot size={18}/></div><div><div className="text-xl font-bold">{inspections.filter(i=>i.status==='in-progress').length}</div><div className="text-xs text-muted-foreground">Đang thực hiện</div></div></div></Panel><Panel className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-[hsl(174_58%_34%/.12)] p-2 text-primary"><CheckCircle2 size={18}/></div><div><div className="text-xl font-bold">{inspections.filter(i=>i.status==='completed').length}</div><div className="text-xs text-muted-foreground">Đã hoàn tất</div></div></div></Panel></div>
     <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><Panel><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="section-label">Lịch tháng</p><h2 className="mt-1 font-semibold">Tháng 09, 2025</h2></div><div className="flex items-center gap-1"><button className="btn btn-quiet p-1.5" onClick={()=>setMonth(m=>Math.max(1,m-1))} data-testid="button-previous-month">‹</button><button className="btn btn-quiet p-1.5" onClick={()=>setMonth(m=>Math.min(12,m+1))} data-testid="button-next-month">›</button></div></div><div className="grid grid-cols-7 gap-1 p-4 text-center text-[10px] text-muted-foreground">{['T2','T3','T4','T5','T6','T7','CN'].map(d=><div key={d} className="py-2 font-semibold">{d}</div>)}{Array.from({length:30},(_,i)=>i+1).map(d=>{const count=inspections.filter(x=>Number(x.date.slice(-2))===d).length; const inRange=rangeStart!==null&&rangeEnd!==null&&d>=selectedFrom&&d<=selectedTo; const highlighted=d===selectedDate||inRange; return <button key={d} onClick={()=>selectCalendarDay(d)} className={`relative h-10 rounded-lg text-xs transition-colors hover:bg-secondary ${highlighted?'bg-primary font-bold text-white':'text-foreground'}`} data-testid={`button-calendar-day-${d}`}>{d}{count>0&&<span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${highlighted?'bg-white/80':'bg-primary'}`}/>}</button>})}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3"><div className="text-[10px] text-muted-foreground">{rangeStart!==null&&rangeEnd===null?`Đã chọn ngày ${rangeStart} · Chọn thêm ngày kết thúc`:rangeStart!==null&&rangeEnd!==null?`Khoảng đã chọn: ngày ${selectedFrom}–${selectedTo}`:`Ngày đang chọn: ${selectedDate}`}</div><button className="btn btn-quiet px-2.5 py-1.5 text-[10px]" onClick={clearCalendarSelection} data-testid="button-clear-calendar-selection">Xóa chọn</button></div><div className="flex flex-wrap gap-4 border-t border-border px-5 py-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary"/>Định kỳ</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-destructive"/>Đột xuất</span></div></Panel>
       <Panel><div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center"><div><p className="section-label">Danh sách công tác</p><h2 className="mt-1 font-semibold">Các lượt kiểm tra</h2></div><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-9 text-xs sm:w-56" placeholder="Tìm trường, tổ công tác" value={search} onChange={e=>setSearch(e.target.value)} data-testid="input-search-schedule"/></div></div><div className="mobile-scroll"><div className="min-w-[680px] divide-y divide-border">{filtered.map(item=><div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/35"><div className="w-20 shrink-0"><div className="font-[var(--app-font-mono)] text-sm font-bold">{formatDate(item.date)}</div><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 size={11}/>{item.time}</div></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.school}</div><div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin size={11}/>{item.address}</span><span className="flex items-center gap-1"><Users size={11}/>{item.team}</span></div></div><Badge tone={item.type==='surprise'?'red':'teal'}>{item.type==='surprise'?'Đột xuất':'Định kỳ'}</Badge><Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge><div className="flex shrink-0 items-center gap-1"><button className="btn btn-quiet h-9 w-9 p-0" title="Xem chi tiết lịch" aria-label="Xem chi tiết lịch" onClick={()=>setShowDetail(item)} data-testid={`button-view-inspection-${item.id}`}><Eye size={15}/></button><button className="btn btn-quiet h-9 w-9 p-0" title="Chuyển trạng thái lịch" aria-label="Chuyển trạng thái lịch" onClick={()=>{const next=inspections.map(x=>x.id===item.id?{...x,status:x.status==='planned'?'in-progress':x.status==='in-progress'?'completed':'planned'}:x); setInspections(next); save('attp-inspections',next); notify('Đã cập nhật trạng thái lịch');}} data-testid={`button-cycle-inspection-${item.id}`}><RefreshCw size={15}/></button></div></div>)}{filtered.length===0&&<EmptyState title="Không tìm thấy lịch" description="Thử một từ khóa khác hoặc tạo lượt kiểm tra mới."/>}</div></div></Panel></div>
      <ScheduleDetailModal inspection={showDetail} onClose={()=>setShowDetail(null)} onOpenRecord={openRecord} />
    {showForm&&<Modal title="Tạo lịch kiểm tra" onClose={()=>setShowForm(false)}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Loại kiểm tra<select className="field mt-1.5" value={form.type} onChange={e=>update('type',e.target.value)} data-testid="select-inspection-type"><option value="periodic">Định kỳ</option><option value="surprise">Đột xuất</option></select></label><label className="text-xs font-semibold">Trường / cơ sở<select className="field mt-1.5" value={form.school} onChange={e=>update('school',e.target.value)} data-testid="select-inspection-school">{schools.map(s=><option key={s}>{s}</option>)}</select></label><label className="text-xs font-semibold">Ngày kiểm tra<input type="date" className="field mt-1.5" value={form.date} onChange={e=>update('date',e.target.value)} data-testid="input-inspection-date"/></label><label className="text-xs font-semibold">Giờ bắt đầu<input type="time" className="field mt-1.5" value={form.time} onChange={e=>update('time',e.target.value)} data-testid="input-inspection-time"/></label><label className="text-xs font-semibold">Tổ kiểm tra<TeamPicker value={form.team} onChange={value=>update('team',value)} testId="select-inspection-team"/></label><label className="text-xs font-semibold">Địa chỉ<input className="field mt-1.5" value={form.address} onChange={e=>update('address',e.target.value)} placeholder="Số nhà, đường, phường" data-testid="input-inspection-address"/></label><label className="text-xs font-semibold sm:col-span-2">Mục đích<input className="field mt-1.5" value={form.purpose} onChange={e=>update('purpose',e.target.value)} data-testid="input-inspection-purpose"/></label><div className="sm:col-span-2"><div className="text-xs font-semibold">Tiêu chí áp dụng</div><p className="mt-1 text-[10px] text-muted-foreground">Checklist biên bản sẽ được sinh từ các tiêu chí đã chọn. Tiêu chí bắt buộc được đánh dấu sẵn.</p><div className="mt-2 grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">{availableCriteria.map(criterion=>{const checked=(form.criteriaIds||[]).includes(criterion.id);return <label key={criterion.id} className="flex items-start gap-2 rounded-lg p-2 text-xs hover:bg-muted"><input type="checkbox" checked={checked} onChange={event=>setForm(current=>({...current,criteriaIds:event.target.checked?[...(current.criteriaIds||[]),criterion.id]:(current.criteriaIds||[]).filter(id=>id!==criterion.id)}))} data-testid={`checkbox-schedule-criterion-${criterion.id}`}/><span><span className="font-semibold">{criterion.code} · {criterion.title}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{criterion.required?'Bắt buộc':'Không bắt buộc'} · {criterion.checkType==='linked'?'Liên kết dữ liệu':'Kiểm tra tại hiện trường'}</span></span></label>})}</div></div><label className="text-xs font-semibold sm:col-span-2">Ghi chú<textarea className="field mt-1.5 min-h-20" value={form.notes} onChange={e=>update('notes',e.target.value)} data-testid="textarea-inspection-notes"/></label></div><ModalActions onClose={()=>setShowForm(false)} onSubmit={submit} label="Lưu lịch kiểm tra"/></Modal>}
  </div>;
}
function Schedule({ inspections, setInspections, notify }: { inspections: Inspection[]; setInspections: (v: Inspection[]) => void; notify: (s:string)=>void }) {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Inspection | null>(null);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(9);
  const [selectedDate, setSelectedDate] = useState(15);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<Partial<Inspection>>({ type:'periodic', school:schools[0], address:'', date:'2025-09-22', time:'08:30', team:teams[0], purpose:'Kiểm tra định kỳ', notes:'' });
  const selectedFrom = rangeStart !== null && rangeEnd !== null ? Math.min(rangeStart, rangeEnd) : selectedDate;
  const selectedTo = rangeStart !== null && rangeEnd !== null ? Math.max(rangeStart, rangeEnd) : selectedDate;
  const filtered = inspections.filter(item => {
    const matchesSearch = item.school.toLowerCase().includes(search.toLowerCase()) || item.team.toLowerCase().includes(search.toLowerCase());
    const day = Number(item.date.slice(-2));
    return item.status !== 'completed' && matchesSearch && (rangeStart === null || (day >= selectedFrom && day <= selectedTo));
  });
  const selectCalendarDay = (day: number) => {
    setSelectedDate(day);
    if (rangeStart === null || rangeEnd !== null) { setRangeStart(day); setRangeEnd(null); } else setRangeEnd(day);
  };
  const clearCalendarSelection = () => { setSelectedDate(15); setRangeStart(null); setRangeEnd(null); };
  const update = (key: keyof Inspection, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = () => {
    if (!form.school || !form.date || !form.time) return;
     const item: Inspection = { id:uid('i'), type:form.type as 'periodic'|'surprise', school:form.school, address:form.address || 'Chưa cập nhật địa chỉ', date:form.date, time:form.time, team:form.team || teams[0], status:'planned', purpose:form.purpose || '', notes:form.notes || '' };
    const next = [item, ...inspections];
    setInspections(next);
    save('attp-inspections', next);
    setShowForm(false);
    notify('Đã thêm lịch kiểm tra mới');
  };
  const removeInspection = (inspection: Inspection) => {
    if (!window.confirm(`Xóa lịch kiểm tra tại ${inspection.school}?`)) return;
    const next = inspections.filter(item => item.id !== inspection.id);
    setInspections(next);
    save('attp-inspections', next);
    setShowDetail(current => current?.id === inspection.id ? null : current);
    notify('Đã xóa lịch kiểm tra');
  };
  const openRecord = (inspection: Inspection) => {
    const next = inspections.map(item => item.id === inspection.id && item.status === 'planned' ? { ...item, status: 'in-progress' } : item);
    if (next.some((item, index) => item.status !== inspections[index].status)) { setInspections(next); save('attp-inspections', next); }
    setShowDetail(null);
    localStorage.setItem('attp-pending-inspection-id', inspection.id);
    setLocation('/records/new');
  };
  return <div className="mx-auto max-w-[1440px] animate-rise">
    <PageTitle eyebrow="Điều hành · Lịch công tác" title="Lịch kiểm tra" description="Lập kế hoạch định kỳ, tiếp nhận kiểm tra đột xuất và phân công tổ công tác." action={<button className="btn btn-primary" onClick={() => setShowForm(true)} data-testid="button-create-inspection"><Plus size={16}/> Tạo lịch kiểm tra</button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <Panel className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-secondary p-2 text-primary"><CalendarDays size={18}/></div><div><div className="text-xl font-bold">{inspections.filter(item => item.status === 'planned').length}</div><div className="text-xs text-muted-foreground">Lượt đã lên lịch</div></div></div></Panel>
      <Panel className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-[hsl(201_70%_48%/.12)] p-2 text-[hsl(201_70%_35%)]"><CircleDot size={18}/></div><div><div className="text-xl font-bold">{inspections.filter(item => item.status === 'in-progress').length}</div><div className="text-xs text-muted-foreground">Đang thực hiện</div></div></div></Panel>
      <Panel className="p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-[hsl(174_58%_34%/.12)] p-2 text-primary"><CheckCircle2 size={18}/></div><div><div className="text-xl font-bold">{inspections.filter(item => item.status === 'completed').length}</div><div className="text-xs text-muted-foreground">Đã hoàn tất</div></div></div></Panel>
    </div>
    <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <Panel>
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="section-label">Lịch tháng</p><h2 className="mt-1 font-semibold">Tháng {String(month).padStart(2, '0')}, 2025</h2></div><div className="flex items-center gap-1"><button className="btn btn-quiet p-1.5" onClick={() => setMonth(value => Math.max(1, value - 1))} aria-label="Tháng trước" data-testid="button-previous-month">‹</button><button className="btn btn-quiet p-1.5" onClick={() => setMonth(value => Math.min(12, value + 1))} aria-label="Tháng sau" data-testid="button-next-month">›</button></div></div>
        <div className="grid grid-cols-7 gap-1 p-4 text-center text-[10px] text-muted-foreground">{['T2','T3','T4','T5','T6','T7','CN'].map(day => <div key={day} className="py-2 font-semibold">{day}</div>)}{Array.from({ length: 30 }, (_, index) => index + 1).map(day => { const count = inspections.filter(item => Number(item.date.slice(-2)) === day).length; const inRange = rangeStart !== null && rangeEnd !== null && day >= selectedFrom && day <= selectedTo; const highlighted = day === selectedDate || inRange; return <button key={day} onClick={() => selectCalendarDay(day)} className={`relative h-10 rounded-lg text-xs transition-colors hover:bg-secondary ${highlighted ? 'bg-primary font-bold text-white' : 'text-foreground'}`} data-testid={`button-calendar-day-${day}`}>{day}{count > 0 && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${highlighted ? 'bg-white/80' : 'bg-primary'}`}/>}</button>; })}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3"><div className="text-[10px] text-muted-foreground">{rangeStart !== null && rangeEnd === null ? `Đã chọn ngày ${rangeStart} · Chọn thêm ngày kết thúc` : rangeStart !== null && rangeEnd !== null ? `Khoảng đã chọn: ngày ${selectedFrom}–${selectedTo}` : `Ngày đang chọn: ${selectedDate}`}</div><button className="btn btn-quiet px-2.5 py-1.5 text-[10px]" onClick={clearCalendarSelection} data-testid="button-clear-calendar-selection">Xóa chọn</button></div>
        <div className="flex flex-wrap gap-4 border-t border-border px-5 py-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary"/>Định kỳ</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-destructive"/>Đột xuất</span></div>
      </Panel>
      <Panel>
        <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center"><div><p className="section-label">Danh sách công tác</p><h2 className="mt-1 font-semibold">Các lượt kiểm tra</h2></div><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-9 text-xs sm:w-56" placeholder="Tìm trường, tổ công tác" value={search} onChange={event => setSearch(event.target.value)} data-testid="input-search-schedule"/></div></div>
        <div className="mobile-scroll"><div className="min-w-[680px] divide-y divide-border">{filtered.map(item => <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/35"><div className="w-20 shrink-0"><div className="font-[var(--app-font-mono)] text-sm font-bold">{formatDate(item.date)}</div><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 size={11}/>{item.time}</div></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.school}</div><div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin size={11}/>{item.address}</span><span className="flex items-center gap-1"><Users size={11}/>{item.team}</span></div></div><Badge tone={item.type === 'surprise' ? 'red' : 'teal'}>{item.type === 'surprise' ? 'Đột xuất' : 'Định kỳ'}</Badge><Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge><div className="flex shrink-0 items-center gap-1"><button className="btn btn-quiet h-9 w-9 p-0" title="Xem chi tiết lịch" aria-label="Xem chi tiết lịch" onClick={() => setShowDetail(item)} data-testid={`button-view-inspection-${item.id}`}><Eye size={15}/></button><button className="btn btn-quiet h-9 w-9 p-0 text-destructive" title="Xóa lịch kiểm tra" aria-label="Xóa lịch kiểm tra" onClick={() => removeInspection(item)} data-testid={`button-delete-inspection-${item.id}`}><Trash2 size={15}/></button></div></div>)}{filtered.length === 0 && <EmptyState title="Không có lịch chưa hoàn tất" description="Các lịch đã hoàn tất biên bản sẽ tự ẩn khỏi danh sách này."/>}</div></div>
      </Panel>
    </div>
    <ScheduleDetailModal inspection={showDetail} onClose={() => setShowDetail(null)} onOpenRecord={openRecord} />
    {showForm && <Modal title="Tạo lịch kiểm tra" onClose={() => setShowForm(false)}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Loại kiểm tra<select className="field mt-1.5" value={form.type} onChange={event => update('type', event.target.value)} data-testid="select-inspection-type"><option value="periodic">Định kỳ</option><option value="surprise">Đột xuất</option></select></label><label className="text-xs font-semibold">Trường / cơ sở<select className="field mt-1.5" value={form.school} onChange={event => update('school', event.target.value)} data-testid="select-inspection-school">{schools.map(school => <option key={school}>{school}</option>)}</select></label><label className="text-xs font-semibold">Ngày kiểm tra<input type="date" className="field mt-1.5" value={form.date} onChange={event => update('date', event.target.value)} data-testid="input-inspection-date"/></label><label className="text-xs font-semibold">Giờ bắt đầu<input type="time" className="field mt-1.5" value={form.time} onChange={event => update('time', event.target.value)} data-testid="input-inspection-time"/></label><label className="text-xs font-semibold">Tổ kiểm tra<TeamPicker value={form.team} onChange={value => update('team', value)} testId="select-inspection-team"/></label><label className="text-xs font-semibold">Địa chỉ<input className="field mt-1.5" value={form.address} onChange={event => update('address', event.target.value)} placeholder="Số nhà, đường, phường" data-testid="input-inspection-address"/></label><label className="text-xs font-semibold sm:col-span-2">Mục đích<input className="field mt-1.5" value={form.purpose} onChange={event => update('purpose', event.target.value)} data-testid="input-inspection-purpose"/></label><label className="text-xs font-semibold sm:col-span-2">Ghi chú<textarea className="field mt-1.5 min-h-20" value={form.notes} onChange={event => update('notes', event.target.value)} data-testid="textarea-inspection-notes"/></label></div><ModalActions onClose={() => setShowForm(false)} onSubmit={submit} label="Lưu lịch kiểm tra"/></Modal>}
  </div>;
}

function ScheduleDetailModal({ inspection, onClose, onOpenRecord }: { inspection: Inspection | null; onClose: () => void; onOpenRecord: (inspection: Inspection) => void }) {
  if (!inspection) return null;
  return <Modal title="Chi tiết lịch kiểm tra" onClose={onClose}>
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-secondary/35 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="section-label">Lịch công tác</p><h3 className="mt-1 text-lg font-semibold">{inspection.school}</h3><p className="mt-1 text-xs text-muted-foreground">{inspection.purpose || 'Kiểm tra an toàn thực phẩm tại cơ sở'}</p></div>
          <Badge tone={inspection.type === 'surprise' ? 'red' : 'teal'}>{inspection.type === 'surprise' ? 'Đột xuất' : 'Định kỳ'}</Badge>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Ngày kiểm tra" value={formatDate(inspection.date)} />
        <Detail label="Thời gian" value={inspection.time} />
        <Detail label="Tổ kiểm tra" value={inspection.team} />
        <Detail label="Trạng thái" value={statusLabel(inspection.status)} />
        <Detail label="Địa điểm" value={inspection.address} />
        <Detail label="Ghi chú" value={inspection.notes || 'Không có ghi chú'} />
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <button className="btn btn-quiet" onClick={onClose} data-testid="button-close-inspection-detail">Đóng</button>
        <button className="btn btn-primary" onClick={() => onOpenRecord(inspection)} data-testid="button-open-inspection-record"><ClipboardCheck size={15}/> Biên bản kiểm tra</button>
      </div>
    </div>
  </Modal>;
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  return createPortal(
    <div className="app-modal-backdrop fixed inset-0 z-40 flex items-end justify-center bg-[hsl(202_38%_17%/.4)] p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <div className={`app-modal-surface rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClose} data-testid="button-close-modal"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
function EvidencePicker({ value, onChange, testId }: { value: string; onChange: (value: string) => void; testId: string }) {
  const [showOptions, setShowOptions] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const choose = (source: 'camera' | 'upload') => {
    setShowOptions(false);
    (source === 'camera' ? cameraInputRef : uploadInputRef).current?.click();
  };
  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onChange(file.name);
    event.target.value = '';
  };
  return <div className="relative">
    <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} data-testid={`${testId}-upload-input`} />
    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} data-testid={`${testId}-camera-input`} />
    <button type="button" className="field flex min-h-[42px] items-center gap-2 text-left text-xs" onClick={() => setShowOptions(true)} data-testid={testId}>
      <Upload size={13} className="shrink-0 text-muted-foreground" />
      <span className={value ? 'truncate text-foreground' : 'truncate text-muted-foreground'}>{value || 'Thêm hình ảnh minh chứng'}</span>
    </button>
    {showOptions && <div className="evidence-picker-menu absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-xl border border-border bg-card p-2 shadow-xl">
      <p className="px-3 pb-2 pt-1 text-[11px] font-semibold text-muted-foreground">Chọn hình ảnh minh chứng</p>
      <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-muted" onClick={() => choose('camera')} data-testid={`${testId}-camera-option`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><Camera size={16} /></span>
        <span><span className="block">Chụp hình ảnh minh chứng</span><span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">Mở camera trên thiết bị</span></span>
      </button>
      <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-muted" onClick={() => choose('upload')} data-testid={`${testId}-upload-option`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><Upload size={16} /></span>
        <span><span className="block">Upload hình ảnh minh chứng</span><span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">Chọn ảnh từ thiết bị</span></span>
      </button>
    </div>}
  </div>;
}
function DocumentPicker({ value, onChange, testId }: { value: string; onChange: (value: string) => void; testId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onChange(file.name);
    event.target.value = '';
  };
  return <div>
    <input ref={inputRef} type="file" accept="*/*" className="hidden" onChange={handleFile} data-testid={`${testId}-input`} />
    <button type="button" className="field flex min-h-[42px] items-center gap-2 text-left text-xs" onClick={() => inputRef.current?.click()} data-testid={testId}>
      <Upload size={13} className="shrink-0 text-muted-foreground" />
      <span className={value ? 'truncate text-foreground' : 'truncate text-muted-foreground'}>{value || 'Chọn tệp hình ảnh, PDF, EXE...'}</span>
    </button>
    <p className="mt-1.5 text-[10px] font-normal text-muted-foreground">Hỗ trợ hình ảnh, PDF, EXE và các định dạng tài liệu khác.</p>
  </div>;
}
function HandSignature({ value, onChange, testId }: { value: string; onChange: (value: string) => void; testId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value || !value.startsWith('data:')) return;
    const image = new Image();
    image.onload = () => {
      const context = canvas.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      hasStrokeRef.current = true;
    };
    image.src = value;
  }, [value]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#1e293b';
    drawingRef.current = true;
    hasStrokeRef.current = true;
    canvas.setPointerCapture(event.pointerId);
  };
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };
  const stop = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = event.currentTarget;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (hasStrokeRef.current) onChange(canvas.toDataURL('image/png'));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokeRef.current = false;
    onChange('');
  };
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <div><div className="flex items-center gap-2 text-xs font-semibold"><PenLine size={14} className="text-primary"/> Chữ ký tay</div><p className="mt-1 text-[10px] font-normal text-muted-foreground">Dùng chuột, bút cảm ứng hoặc ngón tay để ký trực tiếp.</p></div>
      <button type="button" className="btn btn-quiet shrink-0 px-2.5 py-1.5 text-[11px]" onClick={clear} data-testid={`${testId}-clear`}><X size={13}/> Xóa chữ ký</button>
    </div>
    <div className="relative overflow-hidden rounded-xl border border-dashed border-primary/40 bg-white">
      <canvas ref={canvasRef} width={900} height={180} className="block h-[120px] w-full touch-none cursor-crosshair" onPointerDown={start} onPointerMove={draw} onPointerUp={stop} onPointerCancel={stop} data-testid={testId} />
      <div className="pointer-events-none absolute inset-x-5 bottom-5 border-b border-slate-300" />
      {!value && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/70">Khu vực ký tay</div>}
    </div>
    <p className="text-[10px] text-muted-foreground">{value ? 'Đã ghi nhận chữ ký tay.' : 'Chưa có chữ ký tay.'}</p>
  </div>;
}
function CriterionDetailModal({ criterion, onClose }: { criterion: Criteria; onClose: () => void }) {
  const images = criterionEvidence[criterion.id] || [];
  return <Modal title={`Chi tiết tiêu chí ${criterion.code}`} onClose={onClose}>
    <div className="space-y-4">
      <div><p className="section-label">Tên tiêu chí</p><h3 className="mt-1 text-base font-semibold leading-relaxed">{criterion.title}</h3></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Nhóm nghiệp vụ" value={criterion.category} />
        <Detail label="Căn cứ pháp lý" value={criterion.legal} />
        <Detail label="Minh chứng yêu cầu" value={criterion.evidence} />
      </div>
      <div><div className="mb-1 text-xs font-semibold">Hướng dẫn kiểm tra</div><div className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">{criterion.guidance || 'Chưa cập nhật hướng dẫn'}</div></div>
      <div><div className="mb-1 text-xs font-semibold">Tài liệu minh chứng</div><div className={`rounded-lg p-3 text-sm ${criterion.document ? 'bg-secondary text-foreground' : 'bg-muted/60 text-muted-foreground'}`}>{criterion.document ? <span className="flex items-center gap-2"><Upload size={15} className="text-primary" />{criterion.document}</span> : 'Chưa có tài liệu minh chứng'}</div></div>
      <div>
        <div className="mb-2 flex items-center justify-between"><div className="text-xs font-semibold">Hình ảnh minh chứng</div>{images.length > 0 && <Badge tone="teal"><Camera size={11}/> {images.length} ảnh mẫu</Badge>}</div>
        {images.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{images.map(image => <figure key={image.name} className="overflow-hidden rounded-xl border border-border bg-muted/30"><img src={image.src} alt={image.caption} className="aspect-[1.6] w-full object-cover" /><figcaption className="p-3"><div className="flex items-center gap-2 text-xs font-semibold"><Camera size={13} className="text-primary"/><span className="truncate">{image.name}</span></div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{image.caption}</p></figcaption></figure>)}</div> : <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/35 p-4 text-xs text-muted-foreground"><Camera size={18} className="shrink-0 text-muted-foreground"/><span>Chưa có hình ảnh minh chứng cho tiêu chí này.</span></div>}
      </div>
    </div>
    <div className="mt-6 flex justify-end border-t border-border pt-4"><button className="btn btn-quiet" onClick={onClose} data-testid="button-close-criterion-detail">Đóng</button></div>
  </Modal>;
}
function EvidencePickerBridge() {
  const [target, setTarget] = useState<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-testid^="input-result-evidence-"], [data-testid="input-record-evidence"]'));
    inputs.forEach(input => {
      input.readOnly = true;
      input.placeholder = 'Thêm hình ảnh minh chứng';
      input.title = 'Chọn cách thêm hình ảnh minh chứng';
      input.classList.add('evidence-trigger');
      input.setAttribute('role', 'button');
      input.setAttribute('aria-haspopup', 'dialog');
      input.setAttribute('aria-label', input.value || 'Thêm hình ảnh minh chứng');
    });
    const onClick = (event: MouseEvent) => {
      const input = event.target instanceof HTMLInputElement ? event.target : null;
      if (!input?.matches('[data-testid^="input-result-evidence-"], [data-testid="input-record-evidence"]')) return;
      input.readOnly = true;
      input.classList.add('evidence-trigger');
      event.preventDefault();
      setTarget(input);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  });
  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && target) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(target, file.name);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
    event.target.value = '';
    setTarget(null);
  };
  return target && <Modal title="Thêm hình ảnh minh chứng" onClose={() => setTarget(null)}>
    <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={selectFile} />
    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={selectFile} />
    <p className="text-sm text-muted-foreground">Chọn cách thêm hình ảnh minh chứng vào biên bản kiểm tra.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <button type="button" className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary hover:bg-secondary" onClick={() => cameraInputRef.current?.click()} data-testid="button-capture-evidence">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Camera size={19} /></span>
        <span><span className="block text-sm font-semibold">Chụp hình ảnh minh chứng</span><span className="mt-1 block text-xs font-normal text-muted-foreground">Mở camera trên thiết bị</span></span>
      </button>
      <button type="button" className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary hover:bg-secondary" onClick={() => uploadInputRef.current?.click()} data-testid="button-upload-evidence">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Upload size={19} /></span>
        <span><span className="block text-sm font-semibold">Upload hình ảnh minh chứng</span><span className="mt-1 block text-xs font-normal text-muted-foreground">Chọn ảnh từ thiết bị</span></span>
      </button>
    </div>
  </Modal>;
}
function ModalActions({ onClose, onSubmit, label = 'Lưu thay đổi', onAlert, signature, onSignatureChange }: { onClose: () => void; onSubmit: () => void; label?: string; onAlert?: () => void; signature?: string; onSignatureChange?: (value: string) => void }) { const isRecordCompletion = label === 'Lưu & ký biên bản'; const [drawnSignature, setDrawnSignature] = useState(signature || ''); const updateSignature = (value: string) => { setDrawnSignature(value); onSignatureChange?.(value); window.dispatchEvent(new CustomEvent('record-signature-change', { detail: value })); }; return <>{(isRecordCompletion || onSignatureChange) && <div className="mt-5 border-t border-border pt-5"><HandSignature value={onSignatureChange ? (signature || '') : drawnSignature} onChange={updateSignature} testId="canvas-record-signature"/></div>}<div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4"><>{onAlert && <button className="btn btn-danger w-full sm:mr-auto sm:w-auto" onClick={onAlert} data-testid="button-trigger-sop-alert"><ShieldAlert size={15}/> Cảnh báo ngộ độc (SOP Alert)</button>}</><button className="btn btn-quiet" onClick={onClose} data-testid="button-cancel-modal">Hủy</button><button className="btn btn-primary" onClick={onSubmit} data-testid="button-submit-modal"><Save size={15}/>{isRecordCompletion ? 'Lưu & hoàn tất biên bản' : label}</button></div></>; }
function TeamPicker({ value, onChange, testId }: { value?: string; onChange: (value: string) => void; testId: string }) {
  const [custom, setCustom] = useState(() => Boolean(value && !teams.includes(value)));
  const newTeamValue = '__new_team__';
  if (custom) return <div className="space-y-2"><div className="flex gap-2"><input className="field mt-1.5 min-w-0 flex-1" value={value || ''} onChange={e=>onChange(e.target.value)} placeholder="Nhập tên tổ kiểm tra mới" autoFocus data-testid={`${testId}-custom-input`}/><button type="button" className="btn btn-quiet mt-1.5 shrink-0 px-2.5 text-xs" onClick={()=>{setCustom(false);onChange(teams[0])}} data-testid={`${testId}-back-to-list`}>Danh sách</button></div><p className="text-[10px] font-normal text-muted-foreground">Tên tổ mới sẽ được dùng cho phiếu đang nhập.</p></div>;
  return <select className="field mt-1.5" value={value || ''} onChange={e=>{if(e.target.value===newTeamValue){setCustom(true);onChange('')}else onChange(e.target.value)}} data-testid={testId}>{teams.map(s=><option value={s} key={s}>{s}</option>)}<option value={newTeamValue}>+ Thêm tổ kiểm tra mới</option></select>;
}

function RecordsLegacy({ records, inspections, setRecords, setInspections, notify, onAlert }: { records: InspectionRecord[]; inspections: Inspection[]; setRecords: (v: InspectionRecord[]) => void; setInspections: (v: Inspection[]) => void; notify: (s:string)=>void; onAlert: (record: InspectionRecord) => void }) {
  const [location, setLocation] = useLocation(); const requestedInspectionId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('inspection') || undefined : undefined; const [showEditor, setShowEditor] = useState(location.startsWith('/records/new')); const [editing, setEditing] = useState<InspectionRecord | null>(null); const [detail, setDetail] = useState<InspectionRecord | null>(null); const [search, setSearch] = useState(''); const [filter, setFilter] = useState('all');
  const filtered = records.filter(r => (r.school.toLowerCase().includes(search.toLowerCase()) || r.team.toLowerCase().includes(search.toLowerCase())) && (filter === 'all' || (filter === 'incident' ? r.incident : Object.values(r.results).some(x=>x.status==='fail'))));
  const openNew = () => { localStorage.removeItem('attp-pending-inspection-id'); setEditing(null); setShowEditor(true); };
   const saveRecord = (record: InspectionRecord) => { const next=editing ? records.map(r=>r.id===record.id?record:r) : [record,...records]; setRecords(next); save('attp-records',next); const nextInspections=inspections.map(i=>i.id===record.inspectionId?{...i,status:'completed'}:i); setInspections(nextInspections); save('attp-inspections',nextInspections); setShowEditor(false); notify(editing ? 'Đã cập nhật biên bản' : 'Đã lưu biên bản kiểm tra'); };
  return <div className="mx-auto max-w-[1440px] animate-rise"><PageTitle eyebrow="Nghiệp vụ · Hồ sơ điện tử" title="Biên bản kiểm tra" description="Ghi nhận đầy đủ kết quả tại hiện trường, bằng chứng và kết luận xử lý." action={<button className="btn btn-primary" onClick={openNew} data-testid="button-create-record"><Plus size={16}/> Tạo biên bản</button>} />
    <Panel><div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center"><div className="flex items-center gap-2"><button className={`btn ${filter==='all'?'btn-primary':'btn-quiet'} py-2 text-xs`} onClick={()=>setFilter('all')} data-testid="button-filter-all">Tất cả <span className="ml-1 opacity-70">{records.length}</span></button><button className={`btn ${filter==='fail'?'btn-primary':'btn-quiet'} py-2 text-xs`} onClick={()=>setFilter('fail')} data-testid="button-filter-fail">Có kiến nghị <span className="ml-1 opacity-70">{records.filter(r=>Object.values(r.results).some(x=>x.status==='fail')).length}</span></button><button className={`btn ${filter==='incident'?'btn-primary':'btn-quiet'} py-2 text-xs`} onClick={()=>setFilter('incident')} data-testid="button-filter-incident">Có sự cố</button></div><div className="flex gap-2"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-9 text-xs lg:w-64" placeholder="Tìm theo trường, tổ" value={search} onChange={e=>setSearch(e.target.value)} data-testid="input-search-records"/></div><button className="btn btn-quiet p-2" title="Xuất danh sách" onClick={()=>notify('Đã chuẩn bị tệp xuất dữ liệu')} data-testid="button-export-records"><Download size={16}/></button></div></div><div className="mobile-scroll"><div className="min-w-[760px]"><div className="grid grid-cols-[1.2fr_1fr_.75fr_.8fr_1.1fr_64px] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>Cơ sở</span><span>Ngày & tổ kiểm tra</span><span>Khu vực</span><span>Kết quả</span><span>Trạng thái ký</span><span/></div>{filtered.map(record => { const failedCount=Object.values(record.results).filter(x=>x.status==='fail').length; return <div key={record.id} className="grid grid-cols-[1.2fr_1fr_.75fr_.8fr_1.1fr_64px] items-center gap-4 border-b border-border px-5 py-4 transition-colors hover:bg-muted/35"><div><div className="text-sm font-semibold">{record.school}</div><div className="mt-1 text-[10px] text-muted-foreground">Mã {record.id.toUpperCase()}</div></div><div><div className="text-xs font-medium">{formatDate(record.date)}</div><div className="mt-1 text-xs text-muted-foreground">{record.team}</div></div><div className="text-xs text-muted-foreground">{record.areas.length} khu vực</div><div>{failedCount>0?<Badge tone="red"><AlertTriangle size={11}/> {failedCount} kiến nghị</Badge>:<Badge tone="teal"><CheckCircle2 size={11}/> Đạt</Badge>}</div><div><Badge tone={record.signature?'teal':'amber'}>{record.signature?'Đã ký tay':'Chờ ký tay'}</Badge></div><div className="flex items-center gap-1"><button className="btn btn-quiet h-9 w-9 p-0" title="Xem chi tiết" aria-label="Xem chi tiết" onClick={()=>setDetail(record)} data-testid={`button-view-record-${record.id}`}><Eye size={15}/></button><button className="btn btn-quiet h-9 w-9 p-0" title="Sửa biên bản" aria-label="Sửa biên bản" onClick={()=>{setEditing(record);setShowEditor(true)}} data-testid={`button-edit-record-${record.id}`}><Pencil size={15}/></button></div></div>})}{filtered.length===0&&<EmptyState title="Chưa có biên bản phù hợp" description="Tạo biên bản mới để bắt đầu ghi nhận kết quả kiểm tra." action={<button className="btn btn-primary" onClick={openNew} data-testid="button-empty-create-record"><Plus size={15}/> Tạo biên bản</button>}/>}</div></div></Panel>
     {showEditor&&<RecordEditor record={editing} initialInspectionId={requestedInspectionId} inspections={inspections} onClose={()=>{setShowEditor(false);if(location.startsWith('/records/new'))setLocation('/records')}} onSave={saveRecord} onAlert={onAlert}/>}
     {detail&&<InspectionRecordDetailModal record={detail} onClose={()=>setDetail(null)} />}
  </div>;
}
function Records({ records, inspections, setRecords, setInspections, notify, onAlert }: { records: InspectionRecord[]; inspections: Inspection[]; setRecords: (v: InspectionRecord[]) => void; setInspections: (v: Inspection[]) => void; notify: (s:string)=>void; onAlert: (record: InspectionRecord) => void }) {
  const [location, setLocation] = useLocation();
  const requestedInspectionId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('inspection') || undefined : undefined;
  const [showEditor, setShowEditor] = useState(location.startsWith('/records/new'));
  const [editing, setEditing] = useState<InspectionRecord | null>(null);
  const [detail, setDetail] = useState<InspectionRecord | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const filtered = records.filter(record => {
    const query = search.toLowerCase();
    const searchableText = [
      record.school,
      record.team,
      record.findings,
      record.recommendation,
      ...record.areas,
      ...(record.relatedLinks || []).map(link => link.value),
    ].join(' ').toLowerCase();
    const matchesSearch = searchableText.includes(query);
    const matchesTime = (!fromDate || record.date >= fromDate) && (!toDate || record.date <= toDate);
    const matchesType = filter === 'all' || (filter === 'incident' ? record.incident : Object.values(record.results).some(result => result.status === 'fail'));
    return matchesSearch && matchesTime && matchesType;
  });
  const openNew = () => { localStorage.removeItem('attp-pending-inspection-id'); setEditing(null); setShowEditor(true); };
  const saveRecord = (record: InspectionRecord) => {
    const next = editing ? records.map(item => item.id === record.id ? record : item) : [record, ...records];
    setRecords(next);
    save('attp-records', next);
    const nextInspections = inspections.map(item => item.id === record.inspectionId ? { ...item, status: 'completed' } : item);
    setInspections(nextInspections);
    save('attp-inspections', nextInspections);
    setShowEditor(false);
    notify(editing ? 'Đã cập nhật biên bản' : 'Đã lưu biên bản kiểm tra');
  };
  const clearTimeFilter = () => { setFromDate(''); setToDate(''); };
  return <div className="mx-auto max-w-[1440px] animate-rise">
      <PageTitle eyebrow="Nghiệp vụ · Hồ sơ điện tử" title="Biên bản kiểm tra" description="Nhập thẳng nội dung tại hiện trường; chỉ gắn món ăn, lô hàng hoặc nhà cung cấp khi thực sự liên quan." action={<button className="btn btn-primary" onClick={openNew} data-testid="button-create-record"><Plus size={16}/> Tạo biên bản</button>} />
    <Panel>
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-quiet'} py-2 text-xs`} onClick={() => setFilter('all')} data-testid="button-filter-all">Tất cả <span className="ml-1 opacity-70">{records.length}</span></button>
            <button className={`btn ${filter === 'fail' ? 'btn-primary' : 'btn-quiet'} py-2 text-xs`} onClick={() => setFilter('fail')} data-testid="button-filter-fail">Có kiến nghị <span className="ml-1 opacity-70">{records.filter(record => Object.values(record.results).some(result => result.status === 'fail')).length}</span></button>
            <button className={`btn ${filter === 'incident' ? 'btn-primary' : 'btn-quiet'} py-2 text-xs`} onClick={() => setFilter('incident')} data-testid="button-filter-incident">Có sự cố</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/>
              <input className="field py-2 pl-9 text-xs lg:w-64" placeholder="Tìm theo trường, tổ" value={search} onChange={event => setSearch(event.target.value)} data-testid="input-search-records"/>
            </div>
            <button className="btn btn-quiet p-2" title="Xuất danh sách" aria-label="Xuất danh sách" onClick={() => notify('Đã chuẩn bị tệp xuất dữ liệu')} data-testid="button-export-records"><Download size={16}/></button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold">Từ ngày<input className="field mt-1.5 py-2 text-xs" type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} data-testid="input-record-date-from"/></label>
          <label className="text-xs font-semibold">Đến ngày<input className="field mt-1.5 py-2 text-xs" type="date" value={toDate} onChange={event => setToDate(event.target.value)} data-testid="input-record-date-to"/></label>
          {(fromDate || toDate) && <button className="btn btn-quiet py-2 text-xs" onClick={clearTimeFilter} data-testid="button-clear-record-date-filter">Xóa thời gian</button>}
          <span className="pb-2 text-[11px] text-muted-foreground">{filtered.length} biên bản phù hợp</span>
        </div>
      </div>
      <div className="mobile-scroll">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[1.35fr_1fr_.85fr_1fr_64px] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Cơ sở</span><span>Ngày & tổ kiểm tra</span><span>Khu vực</span><span>Kết quả</span><span/>
          </div>
          {filtered.map(record => {
            const failedCount = Object.values(record.results).filter(result => result.status === 'fail').length;
            return <div key={record.id} className="grid grid-cols-[1.35fr_1fr_.85fr_1fr_64px] items-center gap-4 border-b border-border px-5 py-4 transition-colors hover:bg-muted/35">
               <div><div className="text-sm font-semibold">{record.school}</div><div className="mt-1 text-[10px] text-muted-foreground">Mã {record.id.toUpperCase()} · {record.findings ? 'Có nội dung ghi nhận' : 'Chưa có nội dung'}</div></div>
              <div><div className="text-xs font-medium">{formatDate(record.date)}</div><div className="mt-1 text-xs text-muted-foreground">{record.team}</div></div>
               <div className="text-xs text-muted-foreground">{record.areas.length ? `${record.areas.length} khu vực` : 'Chưa gắn khu vực'}</div>
              <div>{failedCount > 0 ? <Badge tone="red"><AlertTriangle size={11}/> {failedCount} kiến nghị</Badge> : <Badge tone="teal"><CheckCircle2 size={11}/> Đạt</Badge>}</div>
              <div className="flex items-center gap-1"><button className="btn btn-quiet h-9 w-9 p-0" title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => setDetail(record)} data-testid={`button-view-record-${record.id}`}><Eye size={15}/></button><button className="btn btn-quiet h-9 w-9 p-0" title="Sửa biên bản" aria-label="Sửa biên bản" onClick={() => { setEditing(record); setShowEditor(true); }} data-testid={`button-edit-record-${record.id}`}><Pencil size={15}/></button></div>
            </div>;
          })}
          {filtered.length === 0 && <EmptyState title="Chưa có biên bản phù hợp" description="Thử đổi bộ lọc thời gian hoặc tạo biên bản mới." action={<button className="btn btn-primary" onClick={openNew} data-testid="button-empty-create-record"><Plus size={15}/> Tạo biên bản</button>}/>}
        </div>
      </div>
    </Panel>
     {showEditor && <RecordEditorSimple record={editing} initialInspectionId={requestedInspectionId} inspections={inspections} onClose={() => { setShowEditor(false); if (location.startsWith('/records/new')) setLocation('/records'); }} onSave={saveRecord} onAlert={onAlert}/>}
    {detail && <InspectionRecordDetailModal record={detail} onClose={() => setDetail(null)} />}
  </div>;
}

function criterionResultLabel(status: ResultStatus) {
  return status === 'pass' ? 'Đạt' : status === 'fail' ? 'Không đạt' : 'K/Áp dụng';
}

const recordLinkTypeLabels: Record<RecordLinkType, string> = {
  area: 'Khu vực',
  meal: 'Món ăn / bữa ăn',
  ingredient: 'Nguyên liệu',
  batch: 'Lô thực phẩm',
  supplier: 'Nhà cung cấp',
};

function InspectionRecordDetailModal({ record, onClose }: { record: InspectionRecord; onClose: () => void }) {
  const failedCount = Object.values(record.results).filter(result => result.status === 'fail').length;
  const criteria = load<Criteria[]>('attp-criteria', seedCriteria);
  const criteriaById = new Map(criteria.map(criterion => [criterion.id, criterion]));
  const resultEntries = Object.entries(record.results);
  return <Modal title="Chi tiết biên bản kiểm tra" onClose={onClose} wide>
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-primary/20 bg-secondary/35 p-4">
        <div><p className="section-label">Biên bản đã nhập tại hiện trường</p><h3 className="mt-1 text-lg font-semibold">{record.school}</h3><p className="mt-1 text-xs text-muted-foreground">Mã {record.id.toUpperCase()} · {formatDate(record.date)} · {record.team}</p></div>
        <Badge tone={record.signature ? 'teal' : 'amber'}>{record.signature ? 'Đã ký tay' : 'Chờ ký tay'}</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-3"><Detail label="Khu vực kiểm tra" value={record.areas.join(', ') || '—'} /><Detail label="Kết luận" value={record.conclusion || 'Chưa cập nhật'} /><Detail label="Kết quả" value={failedCount ? `${failedCount} kiến nghị` : 'Đạt'} /></div>
      <div>
        <div className="mb-2 flex items-center justify-between"><div><p className="section-label">Nội dung đã ghi nhận</p><h3 className="mt-1 font-semibold">Kết quả từng tiêu chí</h3></div><span className="text-xs text-muted-foreground">{resultEntries.length} tiêu chí</span></div>
        {resultEntries.length > 0 ? <div className="space-y-2">{resultEntries.map(([criterionId, result]) => {
          const criterion = criteriaById.get(criterionId);
          return <div key={criterionId} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex items-start gap-2"><span className="rounded bg-secondary px-1.5 py-0.5 font-[var(--app-font-mono)] text-[10px] font-bold text-primary">{criterion?.code || criterionId}</span><span className="text-sm font-semibold leading-snug">{criterion?.title || 'Tiêu chí đã được nhập trong biên bản'}</span></div></div><Badge tone={result.status === 'fail' ? 'red' : result.status === 'pass' ? 'teal' : 'neutral'}>{criterionResultLabel(result.status)}</Badge></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3"><Detail label="Ghi chú tại hiện trường" value={result.notes || 'Không ghi nhận'} /><Detail label="Bằng chứng" value={result.evidence || 'Chưa có'} /><Detail label="Hạn khắc phục" value={result.deadline ? formatDate(result.deadline) : 'Không có'} /></div>
          </div>;
        })}</div> : <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Biên bản này chưa có kết quả chi tiết theo từng tiêu chí.</div>}
       </div>
       {record.relatedLinks && record.relatedLinks.length > 0 && <div className="rounded-xl border border-dashed border-primary/30 bg-secondary/20 p-4">
         <div className="flex items-center gap-2 text-xs font-semibold"><Tag size={14} className="text-primary"/> Liên kết truy xuất</div>
         <div className="mt-3 flex flex-wrap gap-2">{record.relatedLinks.map(link => <span key={link.id} className="tag bg-card text-foreground"><span className="text-primary">{recordLinkTypeLabels[link.type]}</span> · {link.value}</span>)}</div>
       </div>}
       <div className="grid gap-4 sm:grid-cols-2">
        <div><div className="mb-1 text-xs font-semibold">Phát hiện & bằng chứng tổng hợp</div><div className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">{record.findings || 'Không ghi nhận'}</div></div>
        <div><div className="mb-1 text-xs font-semibold">Kiến nghị khắc phục</div><div className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">{record.recommendation || 'Không có'}</div></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Tệp bằng chứng tổng hợp" value={record.evidence || 'Chưa có'} />
        <Detail label="Sự cố thực phẩm" value={record.incident ? 'Có ghi nhận' : 'Không ghi nhận'} />
      </div>
      {record.signature && <div><div className="mb-1 text-xs font-semibold">Chữ ký người kiểm tra</div><div className="rounded-xl border border-border bg-white p-3"><img src={record.signature} alt="Chữ ký người kiểm tra" className="h-24 w-full object-contain object-left" /></div></div>}
      <div className="flex justify-end border-t border-border pt-4"><button className="btn btn-quiet" onClick={onClose} data-testid="button-close-record-detail">Đóng</button></div>
    </div>
  </Modal>;
}

function RecordEditorLegacy({ record, initialInspectionId, inspections, onClose, onSave, onAlert }: { record: InspectionRecord | null; initialInspectionId?: string; inspections: Inspection[]; onClose: ()=>void; onSave: (r:InspectionRecord)=>void; onAlert: (r:InspectionRecord)=>void }) {
  const [criteria,setCriteria]=useState(()=>load<Criteria[]>('attp-criteria',seedCriteria).filter(c=>c.active));
  const [showCriterionForm,setShowCriterionForm]=useState(false);
  const [newCriterion,setNewCriterion]=useState<Partial<Criteria>>({category:categories[0],code:'',title:'',legal:'',guidance:'',evidence:'',active:true});
  const pendingInspectionId = load<string>('attp-pending-inspection-id', '');
  const initialInspection = inspections.find(i=>i.id===record?.inspectionId) || inspections.find(i=>i.id===initialInspectionId) || inspections.find(i=>i.id===pendingInspectionId) || inspections.find(i=>i.status==='in-progress') || inspections[0];
  const [inspectionId, setInspectionId] = useState(record?.inspectionId || initialInspection?.id || ''); const selected=inspections.find(i=>i.id===inspectionId) || initialInspection;
  const [date,setDate]=useState(record?.date || selected?.date || '2025-09-15'); const [team,setTeam]=useState(record?.team || selected?.team || teams[0]); const [areas,setAreas]=useState(record?.areas || ['Bếp chính','Kho thực phẩm']); const [findings,setFindings]=useState(record?.findings || ''); const [evidence,setEvidence]=useState(record?.evidence || ''); const [conclusion,setConclusion]=useState(record?.conclusion || ''); const [recommendation,setRecommendation]=useState(record?.recommendation || ''); const [incident,setIncident]=useState(record?.incident || false); const [signature,setSignature]=useState(record?.signature?.startsWith('data:') ? record.signature : ''); const [results,setResults]=useState<Record<string,CriterionResult>>(record?.results || {});
  useEffect(() => {
    const syncSignature = (event: Event) => setSignature((event as CustomEvent<string>).detail || '');
    window.addEventListener('record-signature-change', syncSignature);
    return () => window.removeEventListener('record-signature-change', syncSignature);
  }, []);
  const setResult=(id:string, patch:Partial<CriterionResult>)=>setResults(x=>{const base=x[id] || {status:'na' as ResultStatus,notes:'',evidence:'',deadline:''};return {...x,[id]:{...base,...patch}};});
  const updateNewCriterion=(k:keyof Criteria,v:string|boolean)=>setNewCriterion(x=>({...x,[k]:v}));
  const addCriterion=()=>{if(!newCriterion.code?.trim()||!newCriterion.title?.trim())return;const item:Criteria={id:uid('c'),category:newCriterion.category||categories[0],code:newCriterion.code.trim(),title:newCriterion.title.trim(),legal:newCriterion.legal?.trim()||'Chưa cập nhật căn cứ',guidance:newCriterion.guidance?.trim()||'Chưa cập nhật hướng dẫn',evidence:newCriterion.evidence?.trim()||'Không yêu cầu',active:true};const next=[...criteria,item];setCriteria(next);save('attp-criteria',next);setShowCriterionForm(false);setNewCriterion({category:categories[0],code:'',title:'',legal:'',guidance:'',evidence:'',active:true});};
   const buildRecord=(): InspectionRecord | null => selected ? {id:record?.id||uid('r'),inspectionId,school:selected.school,date,team,areas,results,findings,evidence,conclusion,recommendation,signature,incident} : null;
   const finish=()=>{ if(!signature) { window.alert('Vui lòng ký tay trước khi hoàn tất biên bản.'); return; } const next=buildRecord(); if(next) { localStorage.removeItem('attp-pending-inspection-id'); onSave(next); } };
   const triggerAlert=incident ? ()=>{ const next=buildRecord(); if(next) { localStorage.removeItem('attp-pending-inspection-id'); onSave(next); onAlert(next); } } : undefined;
  const resultCounts={pass:Object.values(results).filter(x=>x.status==='pass').length, fail:Object.values(results).filter(x=>x.status==='fail').length, na:Object.values(results).filter(x=>x.status==='na').length};
   return <Modal title={record?'Chỉnh sửa biên bản kiểm tra':'Tạo biên bản kiểm tra'} onClose={onClose} wide><div className="mb-5 rounded-xl border border-primary/20 bg-[hsl(174_58%_34%/.05)] p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold">Phiếu kiểm tra ATTP tại cơ sở</div><div className="mt-1 text-xs text-muted-foreground">Điền kết quả từng tiêu chí. Dữ liệu được lưu khi bấm hoàn tất.</div></div><div className="flex gap-2"><Badge tone="teal"><CheckCircle2 size={12}/> {resultCounts.pass} đạt</Badge><Badge tone="red"><AlertTriangle size={12}/> {resultCounts.fail} không đạt</Badge></div></div></div><div className="grid gap-4 sm:grid-cols-3"><label className="text-xs font-semibold sm:col-span-2">Lượt kiểm tra<select className="field mt-1.5" value={inspectionId} onChange={e=>{setInspectionId(e.target.value);const x=inspections.find(i=>i.id===e.target.value);if(x){setDate(x.date);setTeam(x.team)}}} data-testid="select-record-inspection">{inspections.map(i=><option value={i.id} key={i.id}>{i.school} · {formatDate(i.date)}</option>)}</select></label><label className="text-xs font-semibold">Ngày lập<input className="field mt-1.5" type="date" value={date} onChange={e=>setDate(e.target.value)} data-testid="input-record-date"/></label><label className="text-xs font-semibold">Tổ kiểm tra<input className="field mt-1.5" value={team} onChange={e=>setTeam(e.target.value)} data-testid="input-record-team"/></label><label className="text-xs font-semibold sm:col-span-2">Khu vực kiểm tra<input className="field mt-1.5" value={areas.join(', ')} onChange={e=>setAreas(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} data-testid="input-record-areas"/></label></div><div className="my-6 border-t border-border pt-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-label">Checklist hiện trường</p><h3 className="mt-1 font-semibold">Đánh giá {criteria.length} tiêu chí ATTP</h3></div><div className="flex flex-wrap items-center gap-2"><div className="hidden text-xs text-muted-foreground sm:block">Chọn trạng thái · ghi chú · bằng chứng</div><button type="button" className="btn btn-quiet px-3 py-2 text-xs" onClick={()=>setShowCriterionForm(x=>!x)} data-testid="button-add-criterion-in-record"><Plus size={14}/> {showCriterionForm?'Đóng thêm mới':'Thêm tiêu chí'}</button></div></div>{showCriterionForm&&<div className="mb-4 rounded-xl border border-primary/25 bg-secondary/35 p-4"><div className="mb-3"><div className="text-sm font-semibold">Thêm tiêu chí vào checklist này</div><div className="mt-1 text-xs text-muted-foreground">Tiêu chí mới sẽ được lưu vào thư viện và xuất hiện ngay trong biên bản.</div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Nhóm nghiệp vụ<select className="field mt-1.5" value={newCriterion.category} onChange={e=>updateNewCriterion('category',e.target.value)} data-testid="select-record-criterion-category">{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="text-xs font-semibold">Mã tiêu chí<input className="field mt-1.5" value={newCriterion.code||''} onChange={e=>updateNewCriterion('code',e.target.value)} placeholder="VD: AT-14" data-testid="input-record-criterion-code"/></label><label className="text-xs font-semibold">Mức độ<select className="field mt-1.5" value={newCriterion.severity} onChange={e=>updateNewCriterion('severity',e.target.value)} data-testid="select-record-criterion-severity"><option value="critical">Nghiêm trọng</option><option value="major">Quan trọng</option><option value="minor">Nhẹ</option></select></label><label className="text-xs font-semibold sm:col-span-2">Tên tiêu chí<input className="field mt-1.5" value={newCriterion.title||''} onChange={e=>updateNewCriterion('title',e.target.value)} placeholder="Nội dung cần kiểm tra" data-testid="input-record-criterion-title"/></label><label className="text-xs font-semibold">Căn cứ pháp lý<input className="field mt-1.5" value={newCriterion.legal||''} onChange={e=>updateNewCriterion('legal',e.target.value)} placeholder="Ví dụ: Quyết định 1246/QĐ-BYT" data-testid="input-record-criterion-legal"/></label><label className="text-xs font-semibold">Minh chứng yêu cầu<input className="field mt-1.5" value={newCriterion.evidence||''} onChange={e=>updateNewCriterion('evidence',e.target.value)} placeholder="Ảnh, sổ, phiếu..." data-testid="input-record-criterion-evidence"/></label><label className="text-xs font-semibold sm:col-span-2">Hướng dẫn kiểm tra<textarea className="field mt-1.5 min-h-20" value={newCriterion.guidance||''} onChange={e=>updateNewCriterion('guidance',e.target.value)} placeholder="Mô tả cách đối chiếu tại hiện trường" data-testid="textarea-record-criterion-guidance"/></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" className="btn btn-quiet" onClick={()=>setShowCriterionForm(false)} data-testid="button-cancel-record-criterion">Hủy</button><button type="button" className="btn btn-primary" onClick={addCriterion} data-testid="button-save-record-criterion"><Save size={14}/> Thêm vào checklist</button></div></div>}<div className="space-y-3">{categories.map((cat,ci)=>{const list=criteria.filter(c=>c.category===cat);if(!list.length)return null;const Icon=categoryIcons[ci] || ClipboardList;return <div key={cat} className="rounded-xl border border-border"><div className="flex items-center gap-2 bg-muted/45 px-4 py-3"><Icon size={15} className="text-primary"/><span className="text-xs font-bold">{cat}</span><span className="ml-auto text-[10px] text-muted-foreground">{list.length} tiêu chí</span></div><div className="divide-y divide-border">{list.map(c=>{const r=results[c.id]||{status:'na',notes:'',evidence:'',deadline:''};return <div key={c.id} className="p-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex items-start gap-2"><span className="rounded bg-secondary px-1.5 py-0.5 font-[var(--app-font-mono)] text-[10px] font-bold text-primary">{c.code}</span><div className="text-sm font-semibold leading-snug">{c.title}</div></div><div className="mt-2 text-[11px] text-muted-foreground"><span className="font-semibold">Căn cứ:</span> {c.legal} <span className="mx-2 text-border">·</span> {c.guidance}</div></div><div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1"><button className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${r.status==='pass'?'bg-card text-primary shadow-sm':'text-muted-foreground'}`} onClick={()=>setResult(c.id,{status:'pass'})} data-testid={`button-result-pass-${c.id}`}>Đạt</button><button className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${r.status==='fail'?'bg-[hsl(2_69%_54%/.1)] text-destructive shadow-sm':'text-muted-foreground'}`} onClick={()=>setResult(c.id,{status:'fail'})} data-testid={`button-result-fail-${c.id}`}>Không đạt</button><button className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${r.status==='na'?'bg-card text-foreground shadow-sm':'text-muted-foreground'}`} onClick={()=>setResult(c.id,{status:'na'})} data-testid={`button-result-na-${c.id}`}>K/Áp dụng</button></div></div><div className="mt-3 grid gap-2 md:grid-cols-[1.2fr_1fr_150px]"><input className="field py-2 text-xs" placeholder="Ghi chú tại hiện trường" value={r.notes} onChange={e=>setResult(c.id,{notes:e.target.value})} data-testid={`input-result-notes-${c.id}`}/><div className="relative"><Upload size={13} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-8 text-xs" placeholder={`Bằng chứng · ${c.evidence}`} value={r.evidence} onChange={e=>setResult(c.id,{evidence:e.target.value})} data-testid={`input-result-evidence-${c.id}`}/></div><input className="field py-2 text-xs" type="date" aria-label="Hạn khắc phục" value={r.deadline} onChange={e=>setResult(c.id,{deadline:e.target.value})} data-testid={`input-result-deadline-${c.id}`}/></div></div>})}</div></div>})}</div></div><div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Phát hiện & bằng chứng tổng hợp<textarea className="field mt-1.5 min-h-20" value={findings} onChange={e=>setFindings(e.target.value)} placeholder="Mô tả điểm chưa phù hợp, vị trí, mức độ..." data-testid="textarea-record-findings"/></label><label className="text-xs font-semibold">Tệp bằng chứng<input className="field mt-1.5" value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Tên tệp hoặc mô tả ảnh" data-testid="input-record-evidence"/></label><label className="text-xs font-semibold">Kết luận<select className="field mt-1.5" value={conclusion} onChange={e=>setConclusion(e.target.value)} data-testid="select-record-conclusion"><option value="">Chọn kết luận</option><option>Đạt</option><option>Đạt có điều kiện</option><option>Không đạt</option></select></label><label className="text-xs font-semibold sm:col-span-2">Kiến nghị khắc phục<textarea className="field mt-1.5 min-h-16" value={recommendation} onChange={e=>setRecommendation(e.target.value)} placeholder="Nội dung cần hoàn thành, thời hạn..." data-testid="textarea-record-recommendation"/></label><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={incident} onChange={e=>setIncident(e.target.checked)} data-testid="checkbox-record-incident"/> Ghi nhận dấu hiệu sự cố thực phẩm và chuyển sang hồ sơ SOP Alert</label></div><ModalActions onClose={onClose} onSubmit={finish} onAlert={triggerAlert} label="Lưu & ký biên bản"/></Modal>;
}

function RecordEditor({ record, initialInspectionId, inspections, onClose, onSave, onAlert }: { record: InspectionRecord | null; initialInspectionId?: string; inspections: Inspection[]; onClose: ()=>void; onSave: (r:InspectionRecord)=>void; onAlert: (r:InspectionRecord)=>void }) {
  const [criteria, setCriteria] = useState<Criteria[]>(() => load<Criteria[]>('attp-criteria', seedCriteria).filter(criterion => criterion.active));
  const [showCriterionForm, setShowCriterionForm] = useState(false);
  const blankCriterion: Partial<Criteria> = { category: categories[0], code: '', title: '', legal: '', guidance: '', evidence: '', active: true };
  const [newCriterion, setNewCriterion] = useState<Partial<Criteria>>(blankCriterion);
  const pendingInspectionId = load<string>('attp-pending-inspection-id', '');
  const initialInspection = inspections.find(inspection => inspection.id === record?.inspectionId) || inspections.find(inspection => inspection.id === initialInspectionId) || inspections.find(inspection => inspection.id === pendingInspectionId) || inspections.find(inspection => inspection.status === 'in-progress') || inspections[0];
  const [inspectionId, setInspectionId] = useState(record?.inspectionId || initialInspection?.id || '');
  const selected = inspections.find(inspection => inspection.id === inspectionId) || initialInspection;
  const [date, setDate] = useState(record?.date || selected?.date || '2025-09-15');
  const [team, setTeam] = useState(record?.team || selected?.team || teams[0]);
  const [areas, setAreas] = useState(record?.areas || ['Bếp chính', 'Kho thực phẩm']);
  const [findings, setFindings] = useState(record?.findings || '');
  const [evidence, setEvidence] = useState(record?.evidence || '');
  const [conclusion, setConclusion] = useState(record?.conclusion || '');
  const [recommendation, setRecommendation] = useState(record?.recommendation || '');
  const [incident, setIncident] = useState(record?.incident || false);
  const [signature, setSignature] = useState(record?.signature?.startsWith('data:') ? record.signature : '');
  const [results, setResults] = useState<Record<string, CriterionResult>>(record?.results || {});
  const [relatedLinks, setRelatedLinks] = useState<RecordLink[]>(record?.relatedLinks || []);
  useEffect(() => {
    const syncSignature = (event: Event) => setSignature((event as CustomEvent<string>).detail || '');
    window.addEventListener('record-signature-change', syncSignature);
    return () => window.removeEventListener('record-signature-change', syncSignature);
  }, []);
  const setResult = (id: string, patch: Partial<CriterionResult>) => setResults(current => {
    const base = current[id] || { status: 'na' as ResultStatus, notes: '', evidence: '', deadline: '' };
    return { ...current, [id]: { ...base, ...patch } };
  });
  const updateNewCriterion = (key: keyof Criteria, value: string | boolean) => setNewCriterion(current => ({ ...current, [key]: value }));
  const addCriterion = () => {
    if (!newCriterion.code?.trim() || !newCriterion.title?.trim()) return;
    const item: Criteria = { id: uid('c'), category: newCriterion.category || categories[0], code: newCriterion.code.trim(), title: newCriterion.title.trim(), legal: newCriterion.legal?.trim() || 'Chưa cập nhật căn cứ', guidance: newCriterion.guidance?.trim() || 'Chưa cập nhật hướng dẫn', evidence: newCriterion.evidence?.trim() || 'Không yêu cầu', active: true };
    const next = [...criteria, item];
    setCriteria(next); save('attp-criteria', next); setShowCriterionForm(false); setNewCriterion({ ...blankCriterion });
  };
  const addRelatedLink = () => setRelatedLinks(current => [...current, { id: uid('link'), type: 'area', value: '' }]);
  const updateRelatedLink = (id: string, patch: Partial<RecordLink>) => setRelatedLinks(current => current.map(link => link.id === id ? { ...link, ...patch } : link));
  const removeRelatedLink = (id: string) => setRelatedLinks(current => current.filter(link => link.id !== id));
  const buildRecord = (): InspectionRecord | null => selected ? { id: record?.id || uid('r'), inspectionId, school: selected.school, date, team, areas, results, relatedLinks: relatedLinks.filter(link => link.value.trim()), findings, evidence, conclusion, recommendation, signature, incident } : null;
  const finish = () => {
    if (!signature) { window.alert('Vui lòng ký tay trước khi hoàn tất biên bản.'); return; }
    const next = buildRecord();
    if (next) { localStorage.removeItem('attp-pending-inspection-id'); onSave(next); }
  };
  const triggerAlert = incident ? () => {
    const next = buildRecord();
    if (next) { localStorage.removeItem('attp-pending-inspection-id'); onSave(next); onAlert(next); }
  } : undefined;
  const resultCounts = { pass: Object.values(results).filter(result => result.status === 'pass').length, fail: Object.values(results).filter(result => result.status === 'fail').length };
  return <Modal title={record ? 'Chỉnh sửa biên bản kiểm tra' : 'Tạo biên bản kiểm tra'} onClose={onClose} wide>
    <div className="mb-5 rounded-xl border border-primary/20 bg-[hsl(174_58%_34%/.05)] p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold">Phiếu kiểm tra ATTP tại cơ sở</div><div className="mt-1 text-xs text-muted-foreground">Điền kết quả từng tiêu chí. Dữ liệu được lưu khi bấm hoàn tất.</div></div><div className="flex gap-2"><Badge tone="teal"><CheckCircle2 size={12}/> {resultCounts.pass} đạt</Badge><Badge tone="red"><AlertTriangle size={12}/> {resultCounts.fail} không đạt</Badge></div></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><label className="text-xs font-semibold sm:col-span-2">Lượt kiểm tra<select className="field mt-1.5" value={inspectionId} onChange={event => { setInspectionId(event.target.value); const inspection = inspections.find(item => item.id === event.target.value); if (inspection) { setDate(inspection.date); setTeam(inspection.team); } }} data-testid="select-record-inspection">{inspections.map(inspection => <option value={inspection.id} key={inspection.id}>{inspection.school} · {formatDate(inspection.date)}</option>)}</select></label><label className="text-xs font-semibold">Ngày lập<input className="field mt-1.5" type="date" value={date} onChange={event => setDate(event.target.value)} data-testid="input-record-date"/></label><label className="text-xs font-semibold">Tổ kiểm tra<input className="field mt-1.5" value={team} onChange={event => setTeam(event.target.value)} data-testid="input-record-team"/></label><label className="text-xs font-semibold sm:col-span-2">Khu vực kiểm tra<input className="field mt-1.5" value={areas.join(', ')} onChange={event => setAreas(event.target.value.split(',').map(value => value.trim()).filter(Boolean))} data-testid="input-record-areas"/></label></div>
    <div className="my-6 border-t border-border pt-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-label">Checklist hiện trường</p><h3 className="mt-1 font-semibold">Đánh giá {criteria.length} tiêu chí ATTP</h3></div><button type="button" className="btn btn-quiet px-3 py-2 text-xs" onClick={() => setShowCriterionForm(current => !current)} data-testid="button-add-criterion-in-record"><Plus size={14}/> {showCriterionForm ? 'Đóng thêm mới' : 'Thêm tiêu chí'}</button></div>
      {showCriterionForm && <div className="mb-4 rounded-xl border border-primary/25 bg-secondary/35 p-4"><div className="mb-3"><div className="text-sm font-semibold">Thêm tiêu chí vào checklist này</div><div className="mt-1 text-xs text-muted-foreground">Tiêu chí mới sẽ được lưu vào thư viện và xuất hiện ngay trong biên bản.</div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Nhóm nghiệp vụ<select className="field mt-1.5" value={newCriterion.category || ''} onChange={event => updateNewCriterion('category', event.target.value)} data-testid="select-record-criterion-category">{categories.map(category => <option key={category}>{category}</option>)}</select></label><label className="text-xs font-semibold">Mã tiêu chí<input className="field mt-1.5" value={newCriterion.code || ''} onChange={event => updateNewCriterion('code', event.target.value)} placeholder="VD: AT-14" data-testid="input-record-criterion-code"/></label><label className="text-xs font-semibold sm:col-span-2">Tên tiêu chí<input className="field mt-1.5" value={newCriterion.title || ''} onChange={event => updateNewCriterion('title', event.target.value)} placeholder="Nội dung cần kiểm tra" data-testid="input-record-criterion-title"/></label><label className="text-xs font-semibold">Căn cứ pháp lý<input className="field mt-1.5" value={newCriterion.legal || ''} onChange={event => updateNewCriterion('legal', event.target.value)} placeholder="Ví dụ: Quyết định 1246/QĐ-BYT" data-testid="input-record-criterion-legal"/></label><label className="text-xs font-semibold">Minh chứng yêu cầu<input className="field mt-1.5" value={newCriterion.evidence || ''} onChange={event => updateNewCriterion('evidence', event.target.value)} placeholder="Ảnh, sổ, phiếu..." data-testid="input-record-criterion-evidence"/></label><label className="text-xs font-semibold sm:col-span-2">Hướng dẫn kiểm tra<textarea className="field mt-1.5 min-h-20" value={newCriterion.guidance || ''} onChange={event => updateNewCriterion('guidance', event.target.value)} placeholder="Mô tả cách đối chiếu tại hiện trường" data-testid="textarea-record-criterion-guidance"/></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" className="btn btn-quiet" onClick={() => setShowCriterionForm(false)} data-testid="button-cancel-record-criterion">Hủy</button><button type="button" className="btn btn-primary" onClick={addCriterion} data-testid="button-save-record-criterion"><Save size={14}/> Thêm vào checklist</button></div></div>}
      <div className="space-y-3">{categories.map((category, categoryIndex) => { const list = criteria.filter(criterion => criterion.category === category); if (!list.length) return null; const Icon = categoryIcons[categoryIndex] || ClipboardList; return <div key={category} className="rounded-xl border border-border"><div className="flex items-center gap-2 bg-muted/45 px-4 py-3"><Icon size={15} className="text-primary"/><span className="text-xs font-bold">{category}</span><span className="ml-auto text-[10px] text-muted-foreground">{list.length} tiêu chí</span></div><div className="divide-y divide-border">{list.map(criterion => { const result = results[criterion.id] || { status: 'na' as ResultStatus, notes: '', evidence: '', deadline: '' }; return <div key={criterion.id} className="p-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex items-start gap-2"><span className="rounded bg-secondary px-1.5 py-0.5 font-[var(--app-font-mono)] text-[10px] font-bold text-primary">{criterion.code}</span><div className="text-sm font-semibold leading-snug">{criterion.title}</div></div><div className="mt-2 text-[11px] text-muted-foreground"><span className="font-semibold">Căn cứ:</span> {criterion.legal} <span className="mx-2 text-border">·</span> {criterion.guidance}</div></div><div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1"><button className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${result.status === 'pass' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`} onClick={() => setResult(criterion.id, { status: 'pass' })} data-testid={`button-result-pass-${criterion.id}`}>Đạt</button><button className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${result.status === 'fail' ? 'bg-[hsl(2_69%_54%/.1)] text-destructive shadow-sm' : 'text-muted-foreground'}`} onClick={() => setResult(criterion.id, { status: 'fail' })} data-testid={`button-result-fail-${criterion.id}`}>Không đạt</button><button className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${result.status === 'na' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} onClick={() => setResult(criterion.id, { status: 'na' })} data-testid={`button-result-na-${criterion.id}`}>K/Áp dụng</button></div></div><div className="mt-3 grid gap-2 md:grid-cols-[1.2fr_1fr_150px]"><input className="field py-2 text-xs" placeholder="Ghi chú tại hiện trường" value={result.notes} onChange={event => setResult(criterion.id, { notes: event.target.value })} data-testid={`input-result-notes-${criterion.id}`}/><div className="relative"><Upload size={13} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-8 text-xs" placeholder={`Bằng chứng · ${criterion.evidence}`} value={result.evidence} onChange={event => setResult(criterion.id, { evidence: event.target.value })} data-testid={`input-result-evidence-${criterion.id}`}/></div><input className="field py-2 text-xs" type="date" aria-label="Hạn khắc phục" value={result.deadline} onChange={event => setResult(criterion.id, { deadline: event.target.value })} data-testid={`input-result-deadline-${criterion.id}`}/></div></div>; })}</div></div>; })}</div>
    </div>
    <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Phát hiện & bằng chứng tổng hợp<textarea className="field mt-1.5 min-h-20" value={findings} onChange={event => setFindings(event.target.value)} placeholder="Mô tả điểm chưa phù hợp, vị trí..." data-testid="textarea-record-findings"/></label><label className="text-xs font-semibold">Tệp bằng chứng<input className="field mt-1.5" value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Tên tệp hoặc mô tả ảnh" data-testid="input-record-evidence"/></label><label className="text-xs font-semibold">Kết luận<select className="field mt-1.5" value={conclusion} onChange={event => setConclusion(event.target.value)} data-testid="select-record-conclusion"><option value="">Chọn kết luận</option><option>Đạt</option><option>Đạt có điều kiện</option><option>Không đạt</option></select></label><label className="text-xs font-semibold sm:col-span-2">Kiến nghị khắc phục<textarea className="field mt-1.5 min-h-16" value={recommendation} onChange={event => setRecommendation(event.target.value)} placeholder="Nội dung cần hoàn thành, thời hạn..." data-testid="textarea-record-recommendation"/></label><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={incident} onChange={event => setIncident(event.target.checked)} data-testid="checkbox-record-incident"/> Ghi nhận dấu hiệu sự cố thực phẩm và chuyển sang hồ sơ SOP Alert</label></div>
    <ModalActions onClose={onClose} onSubmit={finish} onAlert={triggerAlert} label="Lưu & ký biên bản"/>
  </Modal>;
}

function RecordEditorSimple({ record, initialInspectionId, inspections, onClose, onSave, onAlert }: { record: InspectionRecord | null; initialInspectionId?: string; inspections: Inspection[]; onClose: ()=>void; onSave: (r:InspectionRecord)=>void; onAlert: (r:InspectionRecord)=>void }) {
  const pendingInspectionId = load<string>('attp-pending-inspection-id', '');
  const initialInspection = inspections.find(inspection => inspection.id === record?.inspectionId) || inspections.find(inspection => inspection.id === initialInspectionId) || inspections.find(inspection => inspection.id === pendingInspectionId) || inspections.find(inspection => inspection.status === 'in-progress') || inspections[0];
  const [inspectionId, setInspectionId] = useState(record?.inspectionId || initialInspection?.id || '');
  const selected = inspections.find(inspection => inspection.id === inspectionId) || initialInspection;
  const [date, setDate] = useState(record?.date || selected?.date || '2025-09-15');
  const [team, setTeam] = useState(record?.team || selected?.team || teams[0]);
  const [areas, setAreas] = useState(record?.areas || []);
  const [findings, setFindings] = useState(record?.findings || '');
  const [evidence, setEvidence] = useState(record?.evidence || '');
  const [conclusion, setConclusion] = useState(record?.conclusion || '');
  const [recommendation, setRecommendation] = useState(record?.recommendation || '');
  const [incident, setIncident] = useState(record?.incident || false);
  const [signature, setSignature] = useState(record?.signature?.startsWith('data:') ? record.signature : '');
  const [relatedLinks, setRelatedLinks] = useState<RecordLink[]>(record?.relatedLinks || []);
  const availableAreas = schoolAreaOptions[selected?.school || ''] || [];
  const schoolMeals = seedMealLogs.filter(meal => meal.school === selected?.school);
  const getLinkOptions = (type: RecordLinkType) => {
    if (type === 'area') return availableAreas;
    if (type === 'meal') return schoolMeals.map(meal => `${meal.meal} · ${meal.menu} · ${formatDate(meal.date)}`);
    if (type === 'ingredient') return schoolIngredientOptions[selected?.school || ''] || [];
    if (type === 'batch') return Array.from(new Set(schoolMeals.map(meal => meal.batch)));
    return Array.from(new Set(schoolMeals.map(meal => meal.supplier)));
  };

  useEffect(() => {
    const syncSignature = (event: Event) => setSignature((event as CustomEvent<string>).detail || '');
    window.addEventListener('record-signature-change', syncSignature);
    return () => window.removeEventListener('record-signature-change', syncSignature);
  }, []);

  const addRelatedLink = () => setRelatedLinks(current => [...current, { id: uid('link'), type: 'area', value: '' }]);
  const updateRelatedLink = (id: string, patch: Partial<RecordLink>) => setRelatedLinks(current => current.map(link => link.id === id ? { ...link, ...patch } : link));
  const removeRelatedLink = (id: string) => setRelatedLinks(current => current.filter(link => link.id !== id));
  const buildRecord = (): InspectionRecord | null => selected ? {
    id: record?.id || uid('r'),
    inspectionId,
    school: selected.school,
    date,
    team,
    areas,
    results: record?.results || {},
    relatedLinks: relatedLinks.filter(link => link.value.trim()),
    findings,
    evidence,
    conclusion,
    recommendation,
    signature,
    incident,
  } : null;
  const finish = () => {
    if (!signature) { window.alert('Vui lòng ký tay trước khi hoàn tất biên bản.'); return; }
    const next = buildRecord();
    if (next) { localStorage.removeItem('attp-pending-inspection-id'); onSave(next); }
  };
  const triggerAlert = incident ? () => {
    const next = buildRecord();
    if (next) { localStorage.removeItem('attp-pending-inspection-id'); onSave(next); onAlert(next); }
  } : undefined;

  return <Modal title={record ? 'Chỉnh sửa biên bản kiểm tra' : 'Tạo biên bản kiểm tra'} onClose={onClose} wide>
    <div className="mb-5 rounded-xl border border-primary/20 bg-[hsl(174_58%_34%/.05)] p-4">
      <div className="flex items-start gap-3"><div className="rounded-lg bg-secondary p-2 text-primary"><PenLine size={17}/></div><div><div className="text-sm font-semibold">Biên bản mở, nhập theo thực tế</div><div className="mt-1 text-xs leading-relaxed text-muted-foreground">Không cần điền đủ danh sách tiêu chí. Ghi thẳng nội dung đã kiểm tra và chỉ gắn đối tượng truy xuất khi có liên quan.</div></div></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
       <label className="text-xs font-semibold sm:col-span-2">Lượt kiểm tra<select className="field mt-1.5" value={inspectionId} onChange={event => { setInspectionId(event.target.value); const inspection = inspections.find(item => item.id === event.target.value); if (inspection) { setDate(inspection.date); setTeam(inspection.team); setAreas([]); setRelatedLinks([]); } }} data-testid="select-record-inspection">{inspections.map(inspection => <option value={inspection.id} key={inspection.id}>{inspection.school} · {formatDate(inspection.date)}</option>)}</select></label>
      <label className="text-xs font-semibold">Ngày lập<input className="field mt-1.5" type="date" value={date} onChange={event => setDate(event.target.value)} data-testid="input-record-date"/></label>
      <label className="text-xs font-semibold">Tổ kiểm tra<input className="field mt-1.5" value={team} onChange={event => setTeam(event.target.value)} data-testid="input-record-team"/></label>
       <label className="text-xs font-semibold sm:col-span-2">Khu vực đã kiểm tra <span className="font-normal text-muted-foreground">(nếu có)</span><input className="field mt-1.5" value={areas.join(', ')} onChange={event => setAreas(event.target.value.split(',').map(value => value.trim()).filter(Boolean))} placeholder="Ví dụ: Khu vực nấu, kho khô" data-testid="input-record-areas"/></label>
    </div>
    <div className="my-6 space-y-4 border-t border-border pt-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="section-label">Nội dung biên bản</p><h3 className="mt-1 font-semibold">Ghi nhận trực tiếp tại hiện trường</h3><p className="mt-1 text-xs text-muted-foreground">Có thể ghi phần đạt, điểm chưa phù hợp, vị trí và diễn biến; không cần chọn tiêu chí.</p></div><Badge tone="blue"><FileText size={11}/> Nhập tự do</Badge></div>
      <label className="block text-xs font-semibold">Nội dung kiểm tra & ghi nhận<textarea className="field mt-1.5 min-h-40" value={findings} onChange={event => setFindings(event.target.value)} placeholder="Ví dụ: Đã kiểm tra khu vực nấu. Dụng cụ sống/chín được phân biệt; sàn khu vực chế biến còn đọng nước ở góc phía sau..." data-testid="textarea-record-findings"/></label>
      <div className="rounded-xl border border-dashed border-primary/30 bg-secondary/20 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-xs font-semibold"><Link2 size={14} className="text-primary"/> Liên kết để truy xuất ngược <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-normal text-muted-foreground">không bắt buộc</span></div><p className="mt-1 text-[11px] text-muted-foreground">Chỉ thêm khi nội dung liên quan đến món ăn, nguyên liệu, lô hàng hoặc nhà cung cấp.</p></div><button type="button" className="btn btn-quiet shrink-0 px-3 py-2 text-xs" onClick={addRelatedLink} data-testid="button-add-record-link"><Plus size={14}/> Thêm liên kết</button></div>
         {relatedLinks.length > 0 && <div className="mt-3 space-y-2">{relatedLinks.map(link => { const options = getLinkOptions(link.type); return <div key={link.id} className="flex flex-col gap-2 sm:flex-row sm:items-center"><select className="field py-2 text-xs sm:w-44" value={link.type} onChange={event => updateRelatedLink(link.id, { type: event.target.value as RecordLinkType, value: '' })} aria-label="Loại liên kết truy xuất" data-testid={`select-record-link-type-${link.id}`}>{Object.entries(recordLinkTypeLabels).map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select>{options.length > 0 ? <select className="field min-w-0 flex-1 py-2 text-xs" value={link.value} onChange={event => updateRelatedLink(link.id, { value: event.target.value })} aria-label={`Chọn ${recordLinkTypeLabels[link.type].toLowerCase()}`} data-testid={`select-record-link-value-${link.id}`}><option value="">Chọn {recordLinkTypeLabels[link.type].toLowerCase()} của trường</option>{options.map(option => <option value={option} key={option}>{option}</option>)}</select> : <input className="field min-w-0 flex-1 py-2 text-xs" value={link.value} onChange={event => updateRelatedLink(link.id, { value: event.target.value })} placeholder={`Nhập ${recordLinkTypeLabels[link.type].toLowerCase()}`} data-testid={`input-record-link-value-${link.id}`}/>}<button type="button" className="btn btn-quiet self-end p-2 text-destructive sm:self-auto" onClick={() => removeRelatedLink(link.id)} aria-label="Xóa liên kết" data-testid={`button-remove-record-link-${link.id}`}><Trash2 size={14}/></button></div>; })}</div>}
      </div>
    </div>
    <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
      <label className="text-xs font-semibold sm:col-span-2">Ảnh / tệp minh chứng<input className="field mt-1.5" value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Chụp ảnh hoặc ghi tên tệp minh chứng" data-testid="input-record-evidence"/></label>
      <label className="text-xs font-semibold">Kết luận<select className="field mt-1.5" value={conclusion} onChange={event => setConclusion(event.target.value)} data-testid="select-record-conclusion"><option value="">Chọn kết luận</option><option>Đạt</option><option>Đạt có điều kiện</option><option>Không đạt</option></select></label>
      <label className="text-xs font-semibold">Hạn khắc phục <span className="font-normal text-muted-foreground">(nếu có)</span><input className="field mt-1.5" type="date" data-testid="input-record-remediation-date"/></label>
      <label className="text-xs font-semibold sm:col-span-2">Kiến nghị khắc phục<textarea className="field mt-1.5 min-h-20" value={recommendation} onChange={event => setRecommendation(event.target.value)} placeholder="Chỉ nhập nếu có việc cần nhà trường khắc phục..." data-testid="textarea-record-recommendation"/></label>
      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={incident} onChange={event => setIncident(event.target.checked)} data-testid="checkbox-record-incident"/> Có dấu hiệu sự cố thực phẩm cần chuyển sang SOP Alert</label>
    </div>
    <ModalActions onClose={onClose} onSubmit={finish} onAlert={triggerAlert} label="Lưu & ký biên bản"/>
  </Modal>;
}

function CriteriaLibrary({ notify }: { notify: (s:string)=>void }) {
  const [criteria,setCriteria]=useState(()=>load<Criteria[]>('attp-criteria',seedCriteria)); const [show,setShow]=useState(false); const [search,setSearch]=useState(''); const [selectedCat,setSelectedCat]=useState('Tất cả');
  const filtered=criteria.filter(c=>(selectedCat==='Tất cả'||c.category===selectedCat)&&(c.title.toLowerCase().includes(search.toLowerCase())||c.code.toLowerCase().includes(search.toLowerCase())));
  const [form,setForm]=useState<Partial<Criteria>>({category:categories[0],code:'',title:'',legal:'',guidance:'',evidence:'',severity:'major',active:true});
  const update=(k:keyof Criteria,v:string|boolean)=>setForm(x=>({...x,[k]:v}));
  const add=()=>{if(!form.title||!form.code)return;const item={...form,id:uid('c'),category:form.category||categories[0],code:form.code,title:form.title,legal:form.legal||'',guidance:form.guidance||'',evidence:form.evidence||'',severity:form.severity as Severity||'major',active:true};const next=[...criteria,item];setCriteria(next);save('attp-criteria',next);setShow(false);notify('Đã thêm tiêu chí vào thư viện');setForm({category:categories[0],code:'',title:'',legal:'',guidance:'',evidence:'',severity:'major',active:true});};
  return <div className="mx-auto max-w-[1440px] animate-rise"><PageTitle eyebrow="Nghiệp vụ · Chuẩn kiểm tra" title="Thư viện tiêu chí ATTP" description="Bộ tiêu chí dùng chung cho mọi biên bản, bám sát hồ sơ và quy trình bếp ăn trường học." action={<button className="btn btn-primary" onClick={()=>setShow(true)} data-testid="button-add-criterion"><Plus size={16}/> Thêm tiêu chí</button>} /><div className="mb-5 grid gap-3 sm:grid-cols-3"><Panel className="p-4"><div className="text-2xl font-bold">{criteria.length}</div><div className="mt-1 text-xs text-muted-foreground">Tổng số tiêu chí đang dùng</div></Panel><Panel className="p-4"><div className="text-2xl font-bold">{categories.length}</div><div className="mt-1 text-xs text-muted-foreground">Nhóm nghiệp vụ</div></Panel><Panel className="p-4"><div className="text-2xl font-bold">{criteria.filter(c=>c.severity==='critical').length}</div><div className="mt-1 text-xs text-muted-foreground">Tiêu chí trọng yếu</div></Panel></div><Panel><div className="flex flex-col gap-3 border-b border-border px-5 py-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="section-label">Danh mục tiêu chuẩn</p><h2 className="mt-1 font-semibold">Checklist pháp lý & hiện trường</h2></div><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-9 text-xs sm:w-64" placeholder="Tìm mã hoặc nội dung" value={search} onChange={e=>setSearch(e.target.value)} data-testid="input-search-criteria"/></div></div><div className="mobile-scroll flex gap-2 pb-1">{['Tất cả',...categories].map(cat=><button key={cat} className={`btn whitespace-nowrap px-3 py-1.5 text-xs ${selectedCat===cat?'btn-primary':'btn-quiet'}`} onClick={()=>setSelectedCat(cat)} data-testid={`button-category-${cat}`}>{cat}</button>)}</div></div><div className="divide-y divide-border">{filtered.map(c=><div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start" key={c.id} data-testid={`row-criterion-${c.id}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-[var(--app-font-mono)] text-[10px] font-bold text-primary">{c.code.split('-')[0]}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-[var(--app-font-mono)] text-xs font-bold text-primary">{c.code}</span><span className="text-sm font-semibold">{c.title}</span><Badge tone={severityTone(c.severity)}>{severityLabel(c.severity)}</Badge></div><div className="mt-1.5 text-xs text-muted-foreground">{c.category} <span className="mx-2 text-border">·</span> {c.legal}</div><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground"><span><strong className="text-foreground">Hướng dẫn:</strong> {c.guidance}</span><span><strong className="text-foreground">Minh chứng:</strong> {c.evidence}</span></div></div><Badge tone="teal"><CheckCircle2 size={11}/> Đang áp dụng</Badge></div>)}{filtered.length===0&&<EmptyState title="Không có tiêu chí phù hợp" description="Bạn có thể thêm tiêu chí mới vào thư viện."/>}</div></Panel>{show&&<Modal title="Thêm tiêu chí mới" onClose={()=>setShow(false)}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Nhóm nghiệp vụ<select className="field mt-1.5" value={form.category} onChange={e=>update('category',e.target.value)} data-testid="select-criterion-category">{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="text-xs font-semibold">Mã tiêu chí<input className="field mt-1.5" value={form.code} onChange={e=>update('code',e.target.value)} placeholder="VD: AT-14" data-testid="input-criterion-code"/></label><label className="text-xs font-semibold">Mức độ<select className="field mt-1.5" value={form.severity} onChange={e=>update('severity',e.target.value)} data-testid="select-criterion-severity"><option value="critical">Nghiêm trọng</option><option value="major">Quan trọng</option><option value="minor">Nhẹ</option></select></label><label className="text-xs font-semibold sm:col-span-2">Tên tiêu chí<input className="field mt-1.5" value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Nội dung cần kiểm tra" data-testid="input-criterion-title"/></label><label className="text-xs font-semibold">Căn cứ pháp lý<input className="field mt-1.5" value={form.legal} onChange={e=>update('legal',e.target.value)} data-testid="input-criterion-legal"/></label><label className="text-xs font-semibold">Minh chứng yêu cầu<input className="field mt-1.5" value={form.evidence} onChange={e=>update('evidence',e.target.value)} data-testid="input-criterion-evidence"/></label><label className="text-xs font-semibold sm:col-span-2">Hướng dẫn kiểm tra<textarea className="field mt-1.5 min-h-20" value={form.guidance} onChange={e=>update('guidance',e.target.value)} data-testid="textarea-criterion-guidance"/></label></div><ModalActions onClose={()=>setShow(false)} onSubmit={add} label="Thêm vào thư viện"/></Modal>}</div>;
}
function CriteriaManagementUnused({ notify }: { notify: (s: string) => void }) {
  const [criteria, setCriteria] = useState(() => load<Criteria[]>('attp-criteria', seedCriteria));
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tất cả');
  const blankForm = { category: categories[0], code: '', title: '', legal: '', guidance: '', evidence: '', severity: 'major' as Severity, active: true };
  const [form, setForm] = useState<Partial<Criteria>>(blankForm);
  const filtered = criteria.filter(c => (selectedCat === 'Tất cả' || c.category === selectedCat) && (c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())));
  const update = (key: keyof Criteria, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const openAdd = () => { setEditing(null); setForm(blankForm); setShow(true); };
  const openEdit = (item: Criteria) => { setEditing(item.id); setForm({ ...item }); setShow(true); };
  const saveCriteria = () => { if (!form.code?.trim() || !form.title?.trim()) return; const item: Criteria = { id: editing || uid('c'), category: form.category || categories[0], code: form.code.trim(), title: form.title.trim(), legal: form.legal?.trim() || 'Chưa cập nhật căn cứ', guidance: form.guidance?.trim() || 'Chưa cập nhật hướng dẫn', evidence: form.evidence?.trim() || 'Không yêu cầu', severity: (form.severity as Severity) || 'major', active: true }; const next = editing ? criteria.map(c => c.id === editing ? item : c) : [item, ...criteria]; setCriteria(next); save('attp-criteria', next); setShow(false); notify(editing ? 'Đã cập nhật tiêu chí' : 'Đã thêm tiêu chí vào thư viện'); };
  const remove = (id: string) => { const item = criteria.find(c => c.id === id); if (!item || !window.confirm(`Xóa tiêu chí ${item.code} khỏi thư viện?`)) return; const next = criteria.filter(c => c.id !== id); setCriteria(next); save('attp-criteria', next); notify('Đã xóa tiêu chí'); };
  return <div className="mx-auto max-w-[1440px] animate-rise"><PageTitle eyebrow="Nghiệp vụ · Chuẩn kiểm tra" title="Thư viện tiêu chí ATTP" description="Danh sách tiêu chí dùng chung cho biên bản kiểm tra. Có thể thêm, sửa hoặc xóa trực tiếp tại đây." action={<button className="btn btn-primary" onClick={openAdd} data-testid="button-add-criterion"><Plus size={16}/> Thêm tiêu chí</button>} /><div className="mb-5 grid gap-3 sm:grid-cols-3"><Panel className="p-4"><div className="text-2xl font-bold">{criteria.length}</div><div className="mt-1 text-xs text-muted-foreground">Tổng số tiêu chí</div></Panel><Panel className="p-4"><div className="text-2xl font-bold">{categories.length}</div><div className="mt-1 text-xs text-muted-foreground">Nhóm nghiệp vụ</div></Panel><Panel className="p-4"><div className="text-2xl font-bold">{criteria.filter(c => c.severity === 'critical').length}</div><div className="mt-1 text-xs text-muted-foreground">Tiêu chí nghiêm trọng</div></Panel></div><Panel><div className="flex flex-col gap-3 border-b border-border px-5 py-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="section-label">Danh mục tiêu chuẩn</p><h2 className="mt-1 font-semibold">Checklist pháp lý & hiện trường</h2></div><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-9 text-xs sm:w-64" placeholder="Tìm mã hoặc nội dung" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-criteria"/></div></div><div className="mobile-scroll flex gap-2 pb-1">{['Tất cả', ...categories].map(cat => <button key={cat} className={`btn whitespace-nowrap px-3 py-1.5 text-xs ${selectedCat === cat ? 'btn-primary' : 'btn-quiet'}`} onClick={() => setSelectedCat(cat)} data-testid={`button-category-${cat}`}>{cat}</button>)}</div></div><div className="divide-y divide-border">{filtered.map(item => <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center" key={item.id} data-testid={`row-criterion-${item.id}`}><div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-[var(--app-font-mono)] text-[10px] font-bold text-primary">{item.code.split('-')[0]}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-[var(--app-font-mono)] text-xs font-bold text-primary">{item.code}</span><span className="text-sm font-semibold">{item.title}</span><Badge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</Badge></div><div className="mt-1.5 text-xs text-muted-foreground">{item.category} <span className="mx-2 text-border">·</span> {item.legal}</div><div className="mt-2 text-[11px] text-muted-foreground"><strong className="text-foreground">Hướng dẫn:</strong> {item.guidance} <span className="mx-2 text-border">·</span> <strong className="text-foreground">Minh chứng:</strong> {item.evidence}</div></div></div><div className="flex shrink-0 gap-2 self-end lg:self-auto"><button className="btn btn-quiet px-3 py-2 text-xs" onClick={() => openEdit(item)} data-testid={`button-edit-criterion-${item.id}`}><Pencil size={14}/> Sửa</button><button className="btn btn-quiet px-3 py-2 text-xs text-destructive" onClick={() => remove(item.id)} data-testid={`button-delete-criterion-${item.id}`}><Trash2 size={14}/> Xóa</button></div></div>)}{filtered.length === 0 && <EmptyState title="Không có tiêu chí phù hợp" description="Bạn có thể thêm tiêu chí mới vào thư viện."/>}</div></Panel>{show && <Modal title={editing ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí mới'} onClose={() => setShow(false)}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Nhóm nghiệp vụ<select className="field mt-1.5" value={form.category} onChange={e => update('category', e.target.value)} data-testid="select-criterion-category">{categories.map(c => <option key={c}>{c}</option>)}</select></label><label className="text-xs font-semibold">Mã tiêu chí<input className="field mt-1.5" value={form.code || ''} onChange={e => update('code', e.target.value)} placeholder="VD: AT-14" data-testid="input-criterion-code"/></label><label className="text-xs font-semibold">Mức độ<select className="field mt-1.5" value={form.severity} onChange={e => update('severity', e.target.value)} data-testid="select-criterion-severity"><option value="critical">Nghiêm trọng</option><option value="major">Quan trọng</option><option value="minor">Nhẹ</option></select></label><label className="text-xs font-semibold sm:col-span-2">Tên tiêu chí<input className="field mt-1.5" value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="Nội dung cần kiểm tra" data-testid="input-criterion-title"/></label><label className="text-xs font-semibold">Căn cứ pháp lý<input className="field mt-1.5" value={form.legal || ''} onChange={e => update('legal', e.target.value)} data-testid="input-criterion-legal"/></label><label className="text-xs font-semibold">Minh chứng yêu cầu<input className="field mt-1.5" value={form.evidence || ''} onChange={e => update('evidence', e.target.value)} data-testid="input-criterion-evidence"/></label><label className="text-xs font-semibold sm:col-span-2">Hướng dẫn kiểm tra<textarea className="field mt-1.5 min-h-20" value={form.guidance || ''} onChange={e => update('guidance', e.target.value)} placeholder="Mô tả cách đối chiếu tại hiện trường" data-testid="textarea-criterion-guidance"/></label></div><ModalActions onClose={() => setShow(false)} onSubmit={saveCriteria} label={editing ? 'Lưu thay đổi' : 'Thêm vào thư viện'}/></Modal>}</div>;
}

function CriteriaManagementLegacy({ notify }: { notify: (s: string) => void }) {
  const [criteria, setCriteria] = useState(() => load<Criteria[]>('attp-criteria', seedCriteria));
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [detail, setDetail] = useState<Criteria | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tất cả');
  const blankForm: Partial<Criteria> = { category: categories[0], code: '', title: '', legal: '', guidance: '', evidence: '', document: '', severity: 'major', active: true };
  const [form, setForm] = useState<Partial<Criteria>>(blankForm);
  const filtered = criteria.filter(c => (selectedCat === 'Tất cả' || c.category === selectedCat) && (c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())));
  const update = (key: keyof Criteria, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const openAdd = () => { setEditing(null); setForm(blankForm); setShow(true); };
  const openEdit = (item: Criteria) => { setEditing(item.id); setForm({ ...item }); setShow(true); };
  const saveCriteria = () => {
    if (!form.code?.trim() || !form.title?.trim()) return;
    const item: Criteria = { id: editing || uid('c'), category: form.category || categories[0], code: form.code.trim(), title: form.title.trim(), legal: form.legal?.trim() || 'Chưa cập nhật căn cứ', guidance: form.guidance?.trim() || 'Chưa cập nhật hướng dẫn', evidence: form.evidence?.trim() || 'Không yêu cầu', document: form.document || '', severity: (form.severity as Severity) || 'major', active: true };
    const next = editing ? criteria.map(c => c.id === editing ? item : c) : [item, ...criteria];
    setCriteria(next); save('attp-criteria', next); setShow(false); notify(editing ? 'Đã cập nhật tiêu chí' : 'Đã thêm tiêu chí vào thư viện');
  };
  const remove = (id: string) => { const item = criteria.find(c => c.id === id); if (!item || !window.confirm(`Xóa tiêu chí ${item.code} khỏi thư viện?`)) return; const next = criteria.filter(c => c.id !== id); setCriteria(next); save('attp-criteria', next); notify('Đã xóa tiêu chí'); };
  return <div className="mx-auto max-w-[1440px] animate-rise">
    <PageTitle eyebrow="Nghiệp vụ · Chuẩn kiểm tra" title="Thư viện tiêu chí ATTP" description="Danh sách tiêu chí dùng chung cho biên bản kiểm tra. Có thể thêm, sửa hoặc xóa trực tiếp tại đây." action={<button className="btn btn-primary" onClick={openAdd} data-testid="button-add-criterion"><Plus size={16}/> Thêm tiêu chí</button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Panel className="p-4"><div className="text-2xl font-bold">{criteria.length}</div><div className="mt-1 text-xs text-muted-foreground">Tổng số tiêu chí</div></Panel><Panel className="p-4"><div className="text-2xl font-bold">{categories.length}</div><div className="mt-1 text-xs text-muted-foreground">Nhóm nghiệp vụ</div></Panel><Panel className="p-4"><div className="text-2xl font-bold">{criteria.filter(c => c.severity === 'critical').length}</div><div className="mt-1 text-xs text-muted-foreground">Tiêu chí nghiêm trọng</div></Panel></div>
     <Panel><div className="flex flex-col gap-3 border-b border-border px-5 py-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="section-label">Danh mục tiêu chuẩn</p><h2 className="mt-1 font-semibold">Checklist pháp lý & hiện trường</h2></div><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-9 text-xs sm:w-64" placeholder="Tìm mã hoặc nội dung" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-criteria"/></div></div><label className="text-xs font-semibold sm:max-w-md">Lọc theo nhóm<select className="field mt-1.5 text-xs" value={selectedCat} onChange={e => setSelectedCat(e.target.value)} data-testid="select-criteria-category">{['Tất cả', ...categories].map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></label></div>
       <div className="divide-y divide-border">{filtered.map(item => <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center" key={item.id} data-testid={`row-criterion-${item.id}`}><div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-[var(--app-font-mono)] text-[10px] font-bold text-primary">{item.code.split('-')[0]}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-[var(--app-font-mono)] text-xs font-bold text-primary">{item.code}</span><span className="text-sm font-semibold">{item.title}</span><Badge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</Badge></div><div className="mt-1.5 text-xs text-muted-foreground">{item.category} <span className="mx-2 text-border">·</span> {item.legal}</div><div className="mt-2 text-[11px] text-muted-foreground"><strong className="text-foreground">Hướng dẫn:</strong> {item.guidance} <span className="mx-2 text-border">·</span> <strong className="text-foreground">Minh chứng:</strong> {item.evidence}</div>{item.document && <div className="mt-1 flex items-center gap-1 text-[11px] text-primary"><Upload size={11}/><strong>Tài liệu minh chứng:</strong> <span className="truncate">{item.document}</span></div>}</div></div><div className="flex shrink-0 gap-1 self-end lg:self-auto"><button className="btn btn-quiet h-9 w-9 p-0" title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => setDetail(item)} data-testid={`button-view-criterion-${item.id}`}><Eye size={14}/></button><button className="btn btn-quiet h-9 w-9 p-0" title="Sửa" aria-label="Sửa" onClick={() => openEdit(item)} data-testid={`button-edit-criterion-${item.id}`}><Pencil size={14}/></button><button className="btn btn-quiet h-9 w-9 p-0 text-destructive" title="Xóa" aria-label="Xóa" onClick={() => remove(item.id)} data-testid={`button-delete-criterion-${item.id}`}><Trash2 size={14}/></button></div></div>)}{filtered.length === 0 && <EmptyState title="Không có tiêu chí phù hợp" description="Bạn có thể thêm tiêu chí mới vào thư viện."/>}</div>
    </Panel>
    {show && <Modal title={editing ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí mới'} onClose={() => setShow(false)}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Nhóm nghiệp vụ<select className="field mt-1.5" value={form.category || ''} onChange={e => update('category', e.target.value)} data-testid="select-criterion-category">{categories.map(c => <option key={c}>{c}</option>)}</select></label><label className="text-xs font-semibold">Mã tiêu chí<input className="field mt-1.5" value={form.code || ''} onChange={e => update('code', e.target.value)} placeholder="VD: AT-14" data-testid="input-criterion-code"/></label><label className="text-xs font-semibold">Mức độ<select className="field mt-1.5" value={form.severity || 'major'} onChange={e => update('severity', e.target.value)} data-testid="select-criterion-severity"><option value="critical">Nghiêm trọng</option><option value="major">Quan trọng</option><option value="minor">Nhẹ</option></select></label><label className="text-xs font-semibold sm:col-span-2">Tên tiêu chí<input className="field mt-1.5" value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="Nội dung cần kiểm tra" data-testid="input-criterion-title"/></label><label className="text-xs font-semibold">Căn cứ pháp lý<input className="field mt-1.5" value={form.legal || ''} onChange={e => update('legal', e.target.value)} data-testid="input-criterion-legal"/></label><label className="text-xs font-semibold">Minh chứng yêu cầu<input className="field mt-1.5" value={form.evidence || ''} onChange={e => update('evidence', e.target.value)} data-testid="input-criterion-evidence"/></label><div className="text-xs font-semibold sm:col-span-2"><span className="block">Tài liệu minh chứng</span><div className="mt-1.5"><DocumentPicker value={form.document || ''} onChange={value => update('document', value)} testId="input-criterion-document"/></div></div><label className="text-xs font-semibold sm:col-span-2">Hướng dẫn kiểm tra<textarea className="field mt-1.5 min-h-20" value={form.guidance || ''} onChange={e => update('guidance', e.target.value)} placeholder="Mô tả cách đối chiếu tại hiện trường" data-testid="textarea-criterion-guidance"/></label></div><ModalActions onClose={() => setShow(false)} onSubmit={saveCriteria} label={editing ? 'Lưu thay đổi' : 'Thêm vào thư viện'}/></Modal>}
    {detail && <CriterionDetailModal criterion={detail} onClose={() => setDetail(null)} />}
  </div>;
}

function CriteriaManagement({ notify }: { notify: (s: string) => void }) {
  const [criteria, setCriteria] = useState<Criteria[]>(() => load<Criteria[]>('attp-criteria', seedCriteria));
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [detail, setDetail] = useState<Criteria | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tất cả');
  const blankForm: Partial<Criteria> = { category: categories[0], code: '', title: '', legal: '', guidance: '', evidence: '', document: '', severity: 'major', required: true, checkType: 'pass-fail', active: true };
  const [form, setForm] = useState<Partial<Criteria>>(blankForm);
  const filtered = criteria.filter(item => (selectedCat === 'Tất cả' || item.category === selectedCat) && (item.title.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase())));
  const update = (key: keyof Criteria, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const openAdd = () => { setEditing(null); setForm({ ...blankForm }); setShow(true); };
  const openEdit = (item: Criteria) => { setEditing(item.id); setForm({ ...item }); setShow(true); };
  const saveCriteria = () => {
    if (!form.code?.trim() || !form.title?.trim()) return;
    const item: Criteria = { id: editing || uid('c'), category: form.category || categories[0], code: form.code.trim(), title: form.title.trim(), legal: form.legal?.trim() || 'Chưa cập nhật căn cứ', guidance: form.guidance?.trim() || 'Chưa cập nhật hướng dẫn', evidence: form.evidence?.trim() || 'Không yêu cầu', document: form.document || '', severity: form.severity as Severity || 'major', required: form.required !== false, checkType: form.checkType as CriterionCheckType || 'pass-fail', active: true };
    const next = editing ? criteria.map(current => current.id === editing ? item : current) : [item, ...criteria];
    setCriteria(next); save('attp-criteria', next); setShow(false); notify(editing ? 'Đã cập nhật tiêu chí' : 'Đã thêm tiêu chí vào thư viện');
  };
  const remove = (id: string) => { const item = criteria.find(current => current.id === id); if (!item || !window.confirm(`Xóa tiêu chí ${item.code} khỏi thư viện?`)) return; const next = criteria.filter(current => current.id !== id); setCriteria(next); save('attp-criteria', next); notify('Đã xóa tiêu chí'); };
  return <div className="mx-auto max-w-[1440px] animate-rise">
    <PageTitle eyebrow="Nghiệp vụ · Chuẩn kiểm tra" title="Thư viện tiêu chí ATTP" description="Danh sách tiêu chí dùng chung cho biên bản kiểm tra. Có thể thêm, sửa hoặc xóa trực tiếp tại đây." action={<button className="btn btn-primary" onClick={openAdd} data-testid="button-add-criterion"><Plus size={16}/> Thêm tiêu chí</button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2"><Panel className="p-4"><div className="text-2xl font-bold">{criteria.length}</div><div className="mt-1 text-xs text-muted-foreground">Tổng số tiêu chí</div></Panel><Panel className="p-4"><div className="text-2xl font-bold">{categories.length}</div><div className="mt-1 text-xs text-muted-foreground">Nhóm nghiệp vụ</div></Panel></div>
    <Panel>
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="section-label">Danh mục tiêu chuẩn</p><h2 className="mt-1 font-semibold">Checklist pháp lý & hiện trường</h2></div><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-muted-foreground"/><input className="field py-2 pl-9 text-xs sm:w-64" placeholder="Tìm mã hoặc nội dung" value={search} onChange={event => setSearch(event.target.value)} data-testid="input-search-criteria"/></div></div><label className="text-xs font-semibold sm:max-w-md">Lọc theo nhóm<select className="field mt-1.5 text-xs" value={selectedCat} onChange={event => setSelectedCat(event.target.value)} data-testid="select-criteria-category">{['Tất cả', ...categories].map(category => <option key={category} value={category}>{category}</option>)}</select></label></div>
       <div className="divide-y divide-border">{filtered.map(item => <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center" key={item.id} data-testid={`row-criterion-${item.id}`}><div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-[var(--app-font-mono)] text-[10px] font-bold text-primary">{item.code.split('-')[0]}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-[var(--app-font-mono)] text-xs font-bold text-primary">{item.code}</span><span className="text-sm font-semibold">{item.title}</span><Badge tone={item.required === false ? 'neutral' : 'teal'}>{item.required === false ? 'Không bắt buộc' : 'Bắt buộc'}</Badge><Badge tone={item.checkType === 'linked' ? 'blue' : 'neutral'}>{item.checkType === 'linked' ? 'Liên kết dữ liệu' : item.checkType === 'numeric' ? 'Định lượng' : item.checkType === 'text' ? 'Ghi nhận nội dung' : item.checkType === 'document' ? 'Đối chiếu hồ sơ' : 'Đạt / Không đạt'}</Badge></div><div className="mt-1.5 text-xs text-muted-foreground">{item.category} <span className="mx-2 text-border">·</span> {item.legal}</div><div className="mt-2 text-[11px] text-muted-foreground"><strong className="text-foreground">Hướng dẫn:</strong> {item.guidance} <span className="mx-2 text-border">·</span> <strong className="text-foreground">Minh chứng:</strong> {item.evidence}</div>{item.document && <div className="mt-1 flex items-center gap-1 text-[11px] text-primary"><Upload size={11}/><strong>Tài liệu minh chứng:</strong> <span className="truncate">{item.document}</span></div>}</div></div><div className="flex shrink-0 gap-1 self-end lg:self-auto"><button className="btn btn-quiet h-9 w-9 p-0" title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => setDetail(item)} data-testid={`button-view-criterion-${item.id}`}><Eye size={14}/></button><button className="btn btn-quiet h-9 w-9 p-0" title="Sửa" aria-label="Sửa" onClick={() => openEdit(item)} data-testid={`button-edit-criterion-${item.id}`}><Pencil size={14}/></button><button className="btn btn-quiet h-9 w-9 p-0 text-destructive" title="Xóa" aria-label="Xóa" onClick={() => remove(item.id)} data-testid={`button-delete-criterion-${item.id}`}><Trash2 size={14}/></button></div></div>)}{filtered.length === 0 && <EmptyState title="Không có tiêu chí phù hợp" description="Bạn có thể thêm tiêu chí mới vào thư viện."/>}</div>
    </Panel>
     {show && <Modal title={editing ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí mới'} onClose={() => setShow(false)}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Nhóm nghiệp vụ<select className="field mt-1.5" value={form.category || ''} onChange={event => update('category', event.target.value)} data-testid="select-criterion-category">{categories.map(category => <option key={category}>{category}</option>)}</select></label><label className="text-xs font-semibold">Mã tiêu chí<input className="field mt-1.5" value={form.code || ''} onChange={event => update('code', event.target.value)} placeholder="VD: AT-14" data-testid="input-criterion-code"/></label><label className="text-xs font-semibold sm:col-span-2">Tên tiêu chí<input className="field mt-1.5" value={form.title || ''} onChange={event => update('title', event.target.value)} placeholder="Nội dung cần kiểm tra" data-testid="input-criterion-title"/></label><label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={form.required !== false} onChange={event => update('required', event.target.checked)} data-testid="checkbox-criterion-required"/> Tiêu chí bắt buộc áp dụng trong checklist</label><label className="text-xs font-semibold">Hình thức kiểm tra<select className="field mt-1.5" value={form.checkType || 'pass-fail'} onChange={event => update('checkType', event.target.value)} data-testid="select-criterion-check-type"><option value="pass-fail">Đạt / Không đạt</option><option value="numeric">Định lượng</option><option value="text">Ghi nhận nội dung</option><option value="document">Đối chiếu hồ sơ</option><option value="linked">Liên kết dữ liệu</option></select></label><label className="text-xs font-semibold">Mức độ<select className="field mt-1.5" value={form.severity || 'major'} onChange={event => update('severity', event.target.value)} data-testid="select-criterion-severity"><option value="critical">Nghiêm trọng</option><option value="major">Quan trọng</option><option value="minor">Nhẹ</option></select></label><label className="text-xs font-semibold">Căn cứ pháp lý<input className="field mt-1.5" value={form.legal || ''} onChange={event => update('legal', event.target.value)} data-testid="input-criterion-legal"/></label><label className="text-xs font-semibold">Minh chứng yêu cầu<input className="field mt-1.5" value={form.evidence || ''} onChange={event => update('evidence', event.target.value)} data-testid="input-criterion-evidence"/></label><div className="text-xs font-semibold sm:col-span-2"><span className="block">Tài liệu minh chứng</span><div className="mt-1.5"><DocumentPicker value={form.document || ''} onChange={value => update('document', value)} testId="input-criterion-document"/></div></div><label className="text-xs font-semibold sm:col-span-2">Hướng dẫn kiểm tra<textarea className="field mt-1.5 min-h-20" value={form.guidance || ''} onChange={event => update('guidance', event.target.value)} placeholder="Mô tả cách đối chiếu tại hiện trường" data-testid="textarea-criterion-guidance"/></label></div><ModalActions onClose={() => setShow(false)} onSubmit={saveCriteria} label={editing ? 'Lưu thay đổi' : 'Thêm vào thư viện'}/></Modal>}
    {detail && <CriterionDetailModal criterion={detail} onClose={() => setDetail(null)} />}
  </div>;
}

function RemediationPage({ remediations, setRemediations, notify }: { remediations: Remediation[]; setRemediations: (v:Remediation[])=>void; notify:(s:string)=>void }) {
  const [filter,setFilter]=useState('all'); const [show,setShow]=useState(false); const [form,setForm]=useState<Partial<Remediation>>({school:schools[0],finding:'',severity:'major',owner:'',due:'2025-09-25',decision:''});
  const list=remediations.filter(r=>filter==='all'||r.status===filter);
  const changeStatus=(id:string)=>{const next: Remediation[]=remediations.map(r=>r.id===id?{...r,status:(r.status==='open'?'progress':r.status==='progress'?'closed':'open') as RemediationStatus}:r);setRemediations(next);save('attp-remediations',next);notify('Đã cập nhật tiến độ khắc phục');};
  const add=()=>{if(!form.finding||!form.owner)return;const item:Remediation={id:uid('m'),school:form.school||schools[0],finding:form.finding,severity:form.severity as Severity||'major',owner:form.owner,due:form.due||'',status:'open',log:'',decision:form.decision||''};const next=[item,...remediations];setRemediations(next);save('attp-remediations',next);setShow(false);notify('Đã tạo hồ sơ khắc phục');};
  return <div className="mx-auto max-w-[1440px] animate-rise"><PageTitle eyebrow="Theo dõi · Sau kiểm tra" title="Khắc phục & xử lý" description="Quản lý kiến nghị, trách nhiệm và bằng chứng đóng vi phạm theo từng cơ sở." action={<button className="btn btn-primary" onClick={()=>setShow(true)} data-testid="button-add-remediation"><Plus size={16}/> Tạo kiến nghị</button>} /><div className="mb-5 grid grid-cols-3 gap-3"><Panel className="border-[hsl(36_92%_57%/.3)] p-4"><div className="text-2xl font-bold">{remediations.filter(r=>r.status==='open').length}</div><div className="mt-1 text-xs text-muted-foreground">Chờ xử lý</div></Panel><Panel className="border-[hsl(201_70%_48%/.3)] p-4"><div className="text-2xl font-bold">{remediations.filter(r=>r.status==='progress').length}</div><div className="mt-1 text-xs text-muted-foreground">Đang khắc phục</div></Panel><Panel className="border-primary/30 p-4"><div className="text-2xl font-bold">{remediations.filter(r=>r.status==='closed').length}</div><div className="mt-1 text-xs text-muted-foreground">Đã đóng hồ sơ</div></Panel></div><Panel><div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center"><div className="flex gap-2"><button className={`btn ${filter==='all'?'btn-primary':'btn-quiet'} text-xs`} onClick={()=>setFilter('all')} data-testid="button-remediation-all">Tất cả</button>{(['open','progress','closed'] as const).map(s=><button key={s} className={`btn ${filter===s?'btn-primary':'btn-quiet'} text-xs`} onClick={()=>setFilter(s)} data-testid={`button-remediation-${s}`}>{statusLabel(s)}</button>)}</div><button className="btn btn-quiet text-xs" onClick={()=>notify('Bộ lọc nâng cao đang sẵn sàng')} data-testid="button-remediation-filter"><Filter size={14}/> Lọc nâng cao</button></div><div className="mobile-scroll"><div className="min-w-[780px]"><div className="grid grid-cols-[1.2fr_1.6fr_.8fr_1fr_.8fr_1fr] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>Cơ sở</span><span>Nội dung phát hiện</span><span>Mức độ</span><span>Phụ trách</span><span>Hạn xử lý</span><span>Trạng thái</span></div>{list.map(r=><div key={r.id} className="grid grid-cols-[1.2fr_1.6fr_.8fr_1fr_.8fr_1fr] items-center gap-4 border-b border-border px-5 py-4 transition-colors hover:bg-muted/35"><div className="text-sm font-semibold">{r.school}</div><div className="text-xs leading-relaxed">{r.finding}<div className="mt-1 text-[10px] text-muted-foreground">{r.log||'Chưa có nhật ký xử lý'}</div></div><Badge tone={severityTone(r.severity)}>{severityLabel(r.severity)}</Badge><div className="text-xs">{r.owner}</div><div className={`text-xs ${r.status!=='closed'&&r.due<'2025-09-15'?'font-bold text-destructive':''}`}>{formatDate(r.due)}</div><button className="justify-self-start" onClick={()=>changeStatus(r.id)} data-testid={`button-cycle-remediation-${r.id}`}><Badge tone={statusTone(r.status)}>{statusLabel(r.status)} <RefreshCw size={10}/></Badge></button></div>)}{list.length===0&&<EmptyState title="Không có hồ sơ trong nhóm này" description="Các kiến nghị mới sẽ hiển thị tại đây."/>}</div></div></Panel>{show&&<Modal title="Tạo kiến nghị khắc phục" onClose={()=>setShow(false)}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Trường / cơ sở<select className="field mt-1.5" value={form.school} onChange={e=>setForm({...form,school:e.target.value})} data-testid="select-remediation-school">{schools.map(s=><option key={s}>{s}</option>)}</select></label><label className="text-xs font-semibold sm:col-span-2">Nội dung phát hiện<textarea className="field mt-1.5 min-h-24" value={form.finding} onChange={e=>setForm({...form,finding:e.target.value})} data-testid="textarea-remediation-finding"/></label><label className="text-xs font-semibold">Mức độ<select className="field mt-1.5" value={form.severity} onChange={e=>setForm({...form,severity:e.target.value as Severity})} data-testid="select-remediation-severity"><option value="critical">Nghiêm trọng</option><option value="major">Quan trọng</option><option value="minor">Nhẹ</option></select></label><label className="text-xs font-semibold">Hạn khắc phục<input className="field mt-1.5" type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})} data-testid="input-remediation-due"/></label><label className="text-xs font-semibold">Đơn vị / người phụ trách<input className="field mt-1.5" value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} data-testid="input-remediation-owner"/></label><label className="text-xs font-semibold">Quyết định xử lý<input className="field mt-1.5" value={form.decision} onChange={e=>setForm({...form,decision:e.target.value})} data-testid="input-remediation-decision"/></label></div><ModalActions onClose={()=>setShow(false)} onSubmit={add} label="Tạo kiến nghị"/></Modal>}</div>;
}

function SopWorkflowGuide() {
  const steps = [
    { icon: Bell, title: 'Kích hoạt cảnh báo khẩn cấp', text: 'Khi có ca nghi ngờ từ y tế học đường, gửi thông báo ngay đến Trạm Y tế và Lãnh đạo UBND Phường.', tone: 'red' },
    { icon: MapPin, title: 'Khoanh vùng & truy vết', text: 'Truy xuất món ăn, đơn vị cung cấp nguyên liệu và mã lô trong vài phút để phục vụ niêm phong, lấy mẫu nghiệm thu.', tone: 'amber' },
    { icon: RefreshCw, title: 'Theo dõi khắc phục', text: 'Theo dõi tiến độ khắc phục lỗi của nhà trường sau khi bị nhắc nhở hoặc xử phạt hành chính.', tone: 'teal' },
  ];
  return <div className="mb-5 grid gap-3 lg:grid-cols-3" data-testid="section-sop-workflow">
    {steps.map(step => {
      const Icon = step.icon;
      const toneClass = step.tone === 'red' ? 'bg-[hsl(2_69%_54%/.12)] text-destructive' : step.tone === 'amber' ? 'bg-[hsl(36_92%_57%/.18)] text-[hsl(30_75%_31%)]' : 'bg-[hsl(174_58%_34%/.12)] text-primary';
      return <div key={step.title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}><Icon size={17}/></div>
        <h2 className="text-sm font-semibold">{step.title}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
      </div>;
    })}
  </div>;
}

function AlertsPage({ alerts, setAlerts, notify }: { alerts: Alert[]; setAlerts: (v:Alert[])=>void; notify:(s:string)=>void }) {
  const [selected,setSelected]=useState<Alert|null>(alerts[0] || null);
  const cycle=(a:Alert)=>{const order:Alert['status'][]=['new','investigating','contained','closed'];const nextStatus=order[(order.indexOf(a.status)+1)%order.length];const next=alerts.map(x=>x.id===a.id?{...x,status:nextStatus}:x);setAlerts(next);save('attp-alerts',next);setSelected({...a,status:nextStatus});notify(`Đã chuyển trạng thái: ${statusLabel(nextStatus)}`);};
  return <div className="mx-auto max-w-[1440px] animate-rise"><PageTitle eyebrow="Ứng phó · Khẩn cấp" title="SOP Alert" description="Tiếp nhận cảnh báo từ biên bản kiểm tra, khoanh vùng truy vết và theo dõi tiến độ khắc phục sau nhắc nhở hoặc xử phạt hành chính." /><SopWorkflowGuide /><div className="mb-5 rounded-xl border border-[hsl(2_69%_54%/.25)] bg-[hsl(2_69%_54%/.06)] p-4"><div className="flex gap-3"><div className="rounded-lg bg-[hsl(2_69%_54%/.12)] p-2 text-destructive"><AlertTriangle size={19}/></div><div><div className="text-sm font-semibold">Cảnh báo được tạo từ biên bản kiểm tra</div><div className="mt-1 text-xs text-muted-foreground">Khi phát hiện dấu hiệu nghi ngờ, đánh dấu sự cố ở cuối biên bản và bấm Cảnh báo ngộ độc. Hệ thống sẽ gửi thông báo khẩn đến Trạm Y tế và Lãnh đạo UBND Phường.</div></div></div></div><div className="grid gap-5 xl:grid-cols-[1fr_.72fr]"><Panel><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="section-label">Hồ sơ sự cố</p><h2 className="mt-1 font-semibold">Các cảnh báo đang theo dõi</h2></div><Badge tone="red">{alerts.filter(a=>a.status!=='closed').length} đang mở</Badge></div><div className="divide-y divide-border">{alerts.map(a=><button key={a.id} className={`flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/35 ${selected?.id===a.id?'bg-[hsl(2_69%_54%/.05)]':''}`} onClick={()=>setSelected(a)} data-testid={`button-select-alert-${a.id}`}><div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(2_69%_54%/.12)] text-destructive"><ShieldAlert size={17}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{a.school}</span><Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge></div><div className="mt-1.5 text-xs text-muted-foreground">{a.symptoms}</div><div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground"><span>{a.cases} trường hợp nghi ngờ</span><span>Khởi phát {new Date(a.onset).toLocaleString('vi-VN')}</span></div></div><ChevronRight size={16} className="mt-2 shrink-0 text-muted-foreground"/></button>)}{alerts.length===0&&<EmptyState title="Chưa có cảnh báo" description="Hồ sơ sự cố sẽ xuất hiện sau khi được tạo từ một biên bản kiểm tra."/>}</div></Panel>{selected?<AlertDetail alert={selected} onCycle={()=>cycle(selected)} />:<Panel><EmptyState title="Chưa có hồ sơ sự cố" description="Hoàn tất biên bản kiểm tra và đánh dấu có sự cố để mở hồ sơ SOP Alert." /></Panel>}</div></div>;
}

function AlertDetail({ alert, onCycle }: { alert: Alert; onCycle:()=>void }) {
  return <Panel className="h-fit"><div className="border-b border-border px-5 py-4"><div className="flex items-start justify-between gap-3"><div><p className="section-label">Chi tiết hồ sơ</p><h2 className="mt-1 font-semibold">{alert.school}</h2></div><Badge tone={statusTone(alert.status)}>{statusLabel(alert.status)}</Badge></div><div className="mt-2 text-xs text-muted-foreground">Mã {alert.id.toUpperCase()} · Khởi phát {new Date(alert.onset).toLocaleString('vi-VN')}</div></div><div className="space-y-4 px-5 py-5 text-xs"><Detail label="Trường hợp nghi ngờ" value={`${alert.cases} người`}/><Detail label="Triệu chứng" value={alert.symptoms}/><Detail label="Thực phẩm / món ăn" value={alert.food||'Chưa xác định'}/><Detail label="Nhà cung cấp · mã lô" value={`${alert.supplier||'Chưa xác định'} · ${alert.batch||'—'}`}/><Detail label="Bên đã thông báo" value={alert.notified||'Chưa cập nhật'}/><div><div className="mb-1 font-semibold">Biện pháp khoanh vùng</div><div className="rounded-lg bg-muted/60 p-3 leading-relaxed text-muted-foreground">{alert.containment||'Chưa cập nhật'}</div></div><div><div className="mb-1 font-semibold">Truy xuất & nhật ký</div><div className="rounded-lg bg-muted/60 p-3 leading-relaxed text-muted-foreground">{alert.traceability||'Chưa cập nhật'}</div></div><button className="btn btn-primary w-full" onClick={onCycle} data-testid="button-cycle-alert-status"><RefreshCw size={14}/> Chuyển bước: {alert.status==='new'?'Đang điều tra':alert.status==='investigating'?'Đã khoanh vùng':alert.status==='contained'?'Đóng hồ sơ':'Mở lại hồ sơ'}</button></div></Panel>;
}
function RemediationTracking({ remediations, setRemediations, notify }: { remediations: Remediation[]; setRemediations: (v: Remediation[]) => void; notify: (s: string) => void }) {
  const changeStatus = (id: string) => { const next: Remediation[] = remediations.map(r => r.id === id ? { ...r, status: (r.status === 'open' ? 'progress' : r.status === 'progress' ? 'closed' : 'open') as RemediationStatus } : r); setRemediations(next); save('attp-remediations', next); notify('Đã cập nhật tiến độ khắc phục'); };
  return <Panel className="mt-5"><div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center"><div><p className="section-label">Theo dõi sau cảnh báo</p><h2 className="mt-1 font-semibold">Tiến độ khắc phục của nhà trường</h2><p className="mt-1 text-xs text-muted-foreground">Theo dõi lỗi sau khi nhà trường bị nhắc nhở hoặc phạt hành chính.</p></div><div className="flex gap-2"><Badge tone="amber">{remediations.filter(r=>r.status==='open').length} chờ xử lý</Badge><Badge tone="blue">{remediations.filter(r=>r.status==='progress').length} đang xử lý</Badge><Badge tone="teal">{remediations.filter(r=>r.status==='closed').length} đã đóng</Badge></div></div><div className="divide-y divide-border">{remediations.map(r=><div key={r.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{r.school}</span><Badge tone={severityTone(r.severity)}>{severityLabel(r.severity)}</Badge><Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge></div><div className="mt-1 text-xs leading-relaxed">{r.finding}</div><div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground"><span>Phụ trách: {r.owner}</span><span>Hạn: {formatDate(r.due)}</span>{r.log&&<span>{r.log}</span>}</div></div><button className="btn btn-quiet shrink-0 text-xs" onClick={()=>changeStatus(r.id)} data-testid={`button-alert-remediation-${r.id}`}><RefreshCw size={13}/> Chuyển bước xử lý</button></div>)}{remediations.length===0&&<EmptyState title="Chưa có trường cần khắc phục" description="Các vi phạm phát sinh sau kiểm tra sẽ được theo dõi tại đây."/>}</div></Panel>;
}
function Detail({label,value}:{label:string;value:string}) { return <div><div className="mb-1 font-semibold">{label}</div><div className="text-muted-foreground">{value}</div></div>; }

function NotFound() { return <div className="flex min-h-[60dvh] items-center justify-center text-center"><div><div className="font-[var(--app-font-mono)] text-5xl font-bold text-primary">404</div><h1 className="mt-3 text-xl font-semibold">Không tìm thấy trang</h1><Link href="/" className="btn btn-primary mt-5" data-testid="link-notfound-home">Về tổng quan</Link></div></div>; }

function AppContent() {
  const [location] = useLocation(); const [toast,setToast]=useState(''); const notify=(s:string)=>setToast(s);
  const [inspections,setInspections]=useState(()=>load<Inspection[]>('attp-inspections',seedInspections)); const [records,setRecords]=useState(()=>load<InspectionRecord[]>('attp-records',seedRecords)); const [remediations,setRemediations]=useState(()=>load<Remediation[]>('attp-remediations',seedRemediations)); const [alerts,setAlerts]=useState(()=>load<Alert[]>('attp-alerts',seedAlerts));
  const createAlertFromRecord = (record: InspectionRecord) => { const item: Alert = { id: uid('a'), school: record.school, onset: `${record.date}T08:00`, cases: 1, symptoms: record.findings || 'Nghi ngờ ngộ độc thực phẩm tại cơ sở', food: 'Chưa xác định', supplier: '', batch: '', status: 'new', notified: 'Trạm Y tế xã; UBND phường', containment: 'Tạm dừng phục vụ món ăn nghi ngờ và bảo quản mẫu lưu.', traceability: record.recommendation || 'Đã tiếp nhận hồ sơ từ biên bản kiểm tra.' }; const nextAlerts = [item, ...alerts]; setAlerts(nextAlerts); save('attp-alerts', nextAlerts); const remediation: Remediation = { id: uid('m'), school: record.school, finding: record.findings || 'Làm rõ nguy cơ mất an toàn thực phẩm và thực hiện khắc phục.', severity: 'critical', owner: 'Nhà trường / cán bộ phụ trách', due: record.date, status: 'open', log: 'Tạo cùng lúc với hồ sơ Cảnh báo ngộ độc (SOP Alert).', decision: 'Theo dõi khắc phục' }; const nextRemediations = [remediation, ...remediations]; setRemediations(nextRemediations); save('attp-remediations', nextRemediations); notify('Đã lưu biên bản và kích hoạt Cảnh báo ngộ độc (SOP Alert)'); };
  useEffect(()=>{document.title='iSchool F&B · Điều hành ATTP học đường';},[]);
  let page:React.ReactNode;
  if(location==='/') page=<Dashboard inspections={inspections} records={records} remediations={remediations} alerts={alerts}/>;
  else if(location==='/schedule') page=<Schedule inspections={inspections} setInspections={setInspections} notify={notify}/>;
  else if(location==='/records'||location==='/records/new') page=<Records records={records} inspections={inspections} setRecords={setRecords} setInspections={setInspections} notify={notify} onAlert={createAlertFromRecord}/>;
  else if(location==='/criteria') page=<CriteriaManagement notify={notify}/>;
  else if(location==='/alerts') page=<><AlertsPage alerts={alerts} setAlerts={setAlerts} notify={notify}/><RemediationTracking remediations={remediations} setRemediations={setRemediations} notify={notify}/></>;
  else page=<NotFound/>;
  return <Shell>{page}{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}<EvidencePickerBridge /></Shell>;
}

function Router() {
  return <Switch><Route path="/"><AppContent/></Route><Route path="/schedule"><AppContent/></Route><Route path="/records"><AppContent/></Route><Route path="/records/new"><AppContent/></Route><Route path="/criteria"><AppContent/></Route><Route path="/alerts"><AppContent/></Route><Route><Shell><NotFound/></Shell></Route></Switch>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router/><Toaster/></TooltipProvider></QueryClientProvider>;
}