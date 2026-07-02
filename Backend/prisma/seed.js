"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var supabase_js_1 = require("@supabase/supabase-js");
var prisma = new client_1.PrismaClient();
// Ensure we have Supabase service role key for admin auth operations
var supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://cdrlhdwlgvgwqwoewvac.supabase.co';
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
    process.exit(1);
}
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
function clearData() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧹 Clearing old Prisma data...');
                    // Delete in correct order to respect foreign keys
                    return [4 /*yield*/, prisma.attendance.deleteMany()];
                case 1:
                    // Delete in correct order to respect foreign keys
                    _a.sent();
                    return [4 /*yield*/, prisma.liveSession.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.answer.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.examSubmission.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.question.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.exam.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.assessment.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.memorizationSubmission.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.memorizationTask.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.studentProfile.deleteMany()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, prisma.class.deleteMany()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, prisma.notification.deleteMany()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, prisma.message.deleteMany()];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, prisma.profile.deleteMany()];
                case 14:
                    _a.sent();
                    console.log('✅ Prisma data cleared.');
                    return [2 /*return*/];
            }
        });
    });
}
function createSupabaseUser(email, password, fullName, role) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, usersData, listError, user, _b, authData, error;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, supabase.auth.admin.listUsers()];
                case 1:
                    _a = _c.sent(), usersData = _a.data, listError = _a.error;
                    if (listError)
                        throw listError;
                    user = usersData.users.find(function (u) { return u.email === email; });
                    if (!user) return [3 /*break*/, 3];
                    console.log("\u2139\uFE0F User ".concat(email, " already exists in Supabase. Using existing."));
                    // Optionally update password to ensure it's known
                    return [4 /*yield*/, supabase.auth.admin.updateUserById(user.id, { password: password })];
                case 2:
                    // Optionally update password to ensure it's known
                    _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, supabase.auth.admin.createUser({
                        email: email,
                        password: password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: fullName,
                            role: role
                        }
                    })];
                case 4:
                    _b = _c.sent(), authData = _b.data, error = _b.error;
                    if (error)
                        throw error;
                    user = authData.user;
                    console.log("\u2705 Created Supabase Auth user: ".concat(email));
                    _c.label = 5;
                case 5: return [2 /*return*/, user.id];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var defaultPassword, adminId, admin, teacherId, teacher, class1, students, s, email, sId, student;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting database seeding...');
                    return [4 /*yield*/, clearData()];
                case 1:
                    _a.sent();
                    defaultPassword = 'Password123!';
                    return [4 /*yield*/, createSupabaseUser('admin@emaqra2a.com', defaultPassword, 'مدير النظام', client_1.Role.ADMIN)];
                case 2:
                    adminId = _a.sent();
                    return [4 /*yield*/, prisma.profile.create({
                            data: {
                                id: adminId,
                                email: 'admin@emaqra2a.com',
                                fullName: 'مدير النظام',
                                role: client_1.Role.ADMIN,
                                phone: '0500000001',
                            },
                        })];
                case 3:
                    admin = _a.sent();
                    console.log('✅ Admin profile created');
                    return [4 /*yield*/, createSupabaseUser('teacher1@emaqra2a.com', defaultPassword, 'المعلم الأول', client_1.Role.TEACHER)];
                case 4:
                    teacherId = _a.sent();
                    return [4 /*yield*/, prisma.profile.create({
                            data: {
                                id: teacherId,
                                email: 'teacher1@emaqra2a.com',
                                fullName: 'المعلم الأول',
                                role: client_1.Role.TEACHER,
                                phone: '0500000101',
                            },
                        })];
                case 5:
                    teacher = _a.sent();
                    console.log("\u2705 Teacher created");
                    return [4 /*yield*/, prisma.class.create({
                            data: {
                                name: 'حلقة الحفظ - المجموعة الأولى',
                                description: 'حلقة تحفيظ ومراجعة القرآن الكريم بإشراف المعلم الأول',
                                teacherId: teacher.id,
                            },
                        })];
                case 6:
                    class1 = _a.sent();
                    console.log("\u2705 Class created");
                    students = [];
                    s = 1;
                    _a.label = 7;
                case 7:
                    if (!(s <= 2)) return [3 /*break*/, 11];
                    email = "student".concat(s, "@emaqra2a.com");
                    return [4 /*yield*/, createSupabaseUser(email, defaultPassword, "\u0637\u0627\u0644\u0628 ".concat(s), client_1.Role.STUDENT)];
                case 8:
                    sId = _a.sent();
                    return [4 /*yield*/, prisma.profile.create({
                            data: {
                                id: sId,
                                email: email,
                                fullName: "\u0637\u0627\u0644\u0628 ".concat(s),
                                role: client_1.Role.STUDENT,
                                phone: "050000100".concat(s),
                                studentProfile: {
                                    create: {
                                        currentJuz: 30,
                                        currentSurah: 78,
                                        teacherId: teacher.id,
                                        classId: class1.id,
                                    },
                                },
                            },
                        })];
                case 9:
                    student = _a.sent();
                    students.push(student);
                    _a.label = 10;
                case 10:
                    s++;
                    return [3 /*break*/, 7];
                case 11:
                    console.log("\u2705 2 Students created and assigned");
                    // 5. Create Live Sessions
                    return [4 /*yield*/, prisma.liveSession.create({
                            data: {
                                title: "\u062D\u0644\u0642\u0629 \u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629 - ".concat(teacher.fullName),
                                sessionType: client_1.SessionType.MEMORIZATION,
                                teacherId: teacher.id,
                                scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
                                durationMinutes: 60,
                                maxParticipants: 15,
                                meetingUrl: 'https://meet.google.com/test-url',
                            }
                        })];
                case 12:
                    // 5. Create Live Sessions
                    _a.sent();
                    console.log("\u2705 Live Sessions created");
                    // 6. Create Exams
                    return [4 /*yield*/, prisma.exam.create({
                            data: {
                                title: "\u0627\u062E\u062A\u0628\u0627\u0631 \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0634\u0647\u0631 - ".concat(teacher.fullName),
                                examType: client_1.ExamType.MONTHLY,
                                teacherId: teacher.id,
                                startTime: new Date(),
                                endTime: new Date(Date.now() + 86400000 * 3), // 3 days from now
                                timeLimitMinutes: 45,
                                passingScore: 70,
                                status: 'PUBLISHED',
                                questions: {
                                    create: [
                                        {
                                            questionType: client_1.QuestionType.MULTIPLE_CHOICE,
                                            questionText: 'ما هي أطول سورة في القرآن الكريم؟',
                                            options: ['سورة البقرة', 'سورة آل عمران', 'سورة النساء'],
                                            correctAnswer: 'سورة البقرة',
                                            points: 5,
                                            orderIndex: 1,
                                        }
                                    ]
                                }
                            }
                        })];
                case 13:
                    // 6. Create Exams
                    _a.sent();
                    console.log("\u2705 Exams created");
                    console.log('🎉 Seeding finished successfully!');
                    console.log('----------------------------------------------------');
                    console.log(' credentials:');
                    console.log(' - Admin: admin@emaqra2a.com / Password123!');
                    console.log(' - Teacher: teacher1@emaqra2a.com / Password123!');
                    console.log(' - Student 1: student1@emaqra2a.com / Password123!');
                    console.log(' - Student 2: student2@emaqra2a.com / Password123!');
                    console.log('----------------------------------------------------');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
