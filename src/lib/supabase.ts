import { createClient } from '@supabase/supabase-js';
import type { Teacher, School, LeaveRequest, User } from './types';

// 1. Supabase Client Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Helper function for robust date parsing
const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
};

// 3. Helper function to map snake_case from DB to camelCase in the app
const teacherFromDb = (dbTeacher: any): Teacher => {
    return {
        id: dbTeacher.id,
        staffId: dbTeacher.staff_id,
        firstName: dbTeacher.first_name,
        lastName: dbTeacher.last_name,
        dateOfBirth: parseDate(dbTeacher.date_of_birth),
        gender: dbTeacher.gender,
        registeredNo: dbTeacher.registered_no,
        ghanaCardNo: dbTeacher.ghana_card_no,
        ssnitNo: dbTeacher.ssnit_no,
        tinNo: dbTeacher.tin_no,
        phoneNo: dbTeacher.phone_no,
        homeTown: dbTeacher.home_town,
        email: dbTeacher.email,
        address: dbTeacher.address,
        academicQualification: dbTeacher.academic_qualification,
        professionalQualification: dbTeacher.professional_qualification,
        otherProfessionalQualification: dbTeacher.other_professional_qualification,
        rank: dbTeacher.rank,
        job: dbTeacher.job,
        subjects: dbTeacher.subjects,
        leadershipPosition: dbTeacher.leadership_position,
        otherLeadershipPosition: dbTeacher.other_leadership_position,
        areaOfSpecialization: dbTeacher.area_of_specialization,
        lastPromotionDate: parseDate(dbTeacher.last_promotion_date),
        previousSchool: dbTeacher.previous_school,
        schoolId: dbTeacher.school_id,
        datePostedToCurrentSchool: parseDate(dbTeacher.date_posted_to_current_school),
        licensureNo: dbTeacher.licensure_no,
        firstAppointmentDate: parseDate(dbTeacher.first_appointment_date),
        dateConfirmed: parseDate(dbTeacher.date_confirmed),
        teacherUnion: dbTeacher.teacher_union,
        photo: dbTeacher.photo,
        bankName: dbTeacher.bank_name,
        bankBranch: dbTeacher.bank_branch,
        accountNumber: dbTeacher.account_number,
        salaryScale: dbTeacher.salary_scale,
        documents: dbTeacher.documents || [],
    };
};

const teacherToDb = (appTeacher: Partial<Teacher>): any => {
    return {
        id: appTeacher.id,
        staff_id: appTeacher.staffId,
        first_name: appTeacher.firstName,
        last_name: appTeacher.lastName,
        date_of_birth: appTeacher.dateOfBirth,
        gender: appTeacher.gender,
        registered_no: appTeacher.registeredNo,
        ghana_card_no: appTeacher.ghanaCardNo,
        ssnit_no: appTeacher.ssnitNo,
        tin_no: appTeacher.tinNo,
        phone_no: appTeacher.phoneNo,
        home_town: appTeacher.homeTown,
        email: appTeacher.email,
        address: appTeacher.address,
        academic_qualification: appTeacher.academicQualification,
        professional_qualification: appTeacher.professionalQualification,
        other_professional_qualification: appTeacher.otherProfessionalQualification,
        rank: appTeacher.rank,
        job: appTeacher.job,
        subjects: appTeacher.subjects,
        leadership_position: appTeacher.leadershipPosition,
        other_leadership_position: appTeacher.otherLeadershipPosition,
        area_of_specialization: appTeacher.areaOfSpecialization,
        last_promotion_date: appTeacher.lastPromotionDate,
        previous_school: appTeacher.previousSchool,
        school_id: appTeacher.schoolId,
        date_posted_to_current_school: appTeacher.datePostedToCurrentSchool,
        licensure_no: appTeacher.licensureNo,
        first_appointment_date: appTeacher.firstAppointmentDate,
        date_confirmed: appTeacher.dateConfirmed,
        teacher_union: appTeacher.teacherUnion,
        photo: appTeacher.photo,
        bank_name: appTeacher.bankName,
        bank_branch: appTeacher.bankBranch,
        account_number: appTeacher.accountNumber,
        salary_scale: appTeacher.salaryScale,
        documents: appTeacher.documents,
    };
};

// --- Teacher Data ---

export const getTeachers = async (page: number = 0, limit: number = 20, searchTerm: string = ''): Promise<Teacher[]> => {
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('teachers')
        .select(`
            *,
            school:schools(name)
        `)
        .order('first_name', { ascending: true })
        .range(from, to);

    if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,area_of_specialization.ilike.%${searchTerm}%`);
    }
        
    const { data, error } = await query;

    if (error) {
        console.error("Error fetching teachers:", error);
        throw new Error("Could not fetch teachers.");
    }

    return data.map(teacherFromDb) || [];
};

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error("Error fetching teacher by id:", error);
        }
        return null;
    }
    return data ? teacherFromDb(data) : null;
};

// --- School Data ---

export const getSchools = async (columns: string = '*'): Promise<Partial<School>[]> => {
    const { data, error } = await supabase.from('schools').select(columns).order('name');
    if (error) {
        console.error("Error fetching schools:", error);
        throw new Error("Could not fetch schools.");
    }
    return data || [];
};

export const getSchoolById = async (id: string): Promise<School | null> => {
    const { data, error } = await supabase.from('schools').select('*').eq('id', id).single();
    if (error) {
        if (error.code !== 'PGRST116') {
            console.error("Error fetching school by id:", error);
        }
        return null;
    }
    return data;
};

export const addSchool = async (school: Omit<School, 'id'>): Promise<School> => {
    const { data, error } = await supabase.from('schools').insert([school]).select().single();
    if (error) {
        console.error("Error adding school:", error);
        throw new Error("Could not add school.");
    }
    return data;
};

export const updateSchool = async (school: School): Promise<School> => {
    const { data, error } = await supabase.from('schools').update(school).eq('id', school.id).select().single();
    if (error) {
        console.error("Error updating school:", error);
        throw new Error("Could not update school.");
    }
    return data;
};

export const deleteSchool = async (id: string): Promise<void> => {
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) {
        console.error("Error deleting school:", error);
        throw new Error("Could not delete school.");
    }
};

// --- Leave Request Data ---

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data, error } = await supabase.from('leave_requests').select('*').order('start_date', { ascending: false });
    if (error) {
        console.error("Error fetching leave requests:", error);
        throw new Error("Could not fetch leave requests.");
    }
    return data.map(r => ({
        ...r,
        startDate: parseDate(r.start_date),
        returnDate: parseDate(r.return_date)
    })) as LeaveRequest[];
};

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> => {
    const newRequest = { ...request, status: 'Pending' as const };
    const { data, error } = await supabase.from('leave_requests').insert([newRequest]).select().single();
    if (error) {
        console.error("Error adding leave request:", error);
        throw new Error("Could not add leave request.");
    }
    return { ...data, startDate: parseDate(data.start_date), returnDate: parseDate(data.return_date)} as LeaveRequest;
};

export const updateLeaveRequest = async (request: LeaveRequest): Promise<LeaveRequest> => {
    const { data, error } = await supabase.from('leave_requests').update(request).eq('id', request.id).select().single();
    if (error) {
        console.error("Error updating leave request:", error);
        throw new Error("Could not update leave request.");
    }
    return { ...data, startDate: parseDate(data.start_date), returnDate: parseDate(data.return_date)} as LeaveRequest;
};

// --- User Data ---

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').order('username');
    if (error) {
        console.error("Error fetching users:", error);
        throw new Error("Could not fetch users.");
    }
    return data || [];
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user by username:", error);
        throw new Error("Could not fetch user.");
    }
    return data;
};

// --- Mutation Functions ---

export const addTeacher = async (teacher: Partial<Omit<Teacher, 'id'>>): Promise<Teacher> => {
    const { data, error } = await supabase.from('teachers').insert([teacherToDb(teacher)]).select().single();
    if (error) {
        console.error("Error adding teacher:", error);
        throw new Error("Could not add teacher.");
    }
    return teacherFromDb(data);
};

export const updateTeacher = async (teacher: Teacher): Promise<Teacher> => {
    const { data, error } = await supabase.from('teachers').update(teacherToDb(teacher)).eq('id', teacher.id).select().single();
    if (error) {
        console.error("Error updating teacher:", error);
        throw new Error("Could not update teacher.");
    }
    return teacherFromDb(data);
};

export const deleteTeacher = async (id: string): Promise<void> => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) {
        console.error("Error deleting teacher:", error);
        throw new Error("Could not delete teacher.");
    }
};
