// --- إعدادات الاتصال بـ Supabase ---
const SUPABASE_URL = 'https://icpcthgueabxwwevowbt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rg857jiJ2tgqje-odQHZIQ_2Sd0UzbD';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ADMIN_EMAIL = 'jawadrissan22@gmail.com';

document.addEventListener('DOMContentLoaded', async () => {
    loadLatestFiles();
    loadStories();
    loadNotificationsCount();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            document.getElementById('user-email-display').innerText = user.email;
        } else {
            document.getElementById('user-email-display').innerText = 'غير مسجل دخول';
        }
    } catch (e) {
        console.log(e);
    }
});

// --- وظائف التفاعل الفوري ---
function switchSection(targetId, btn) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

async function openNotificationsModal() {
    const modal = document.getElementById('notifications-modal');
    modal.style.display = 'flex';
    const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    const listContainer = document.getElementById('notifications-list');
    
    if (!notifs || notifs.length === 0) {
        listContainer.innerHTML = '<p>لا توجد إشعارات جديدة</p>';
        return;
    }
    listContainer.innerHTML = notifs.map(n => `<div class="file-card"><p>${n.message}</p></div>`).join('');
}

async function openReferralModal() {
    document.getElementById('referral-modal').style.display = 'flex';
    const { data: { user } } = await supabase.auth.getUser();
    const codeBox = document.getElementById('user-referral-code');
    if (user && codeBox) {
        codeBox.innerText = `REF-${user.id.substring(0, 6).toUpperCase()}`;
    }
}

async function loadLatestFiles() {
    const container = document.getElementById('latest-files-container');
    if (!container) return;
    const { data: subjects } = await supabase.from('subjects').select('*').order('created_at', { ascending: false });
    if (!subjects || subjects.length === 0) {
        container.innerHTML = '<p>لا توجد ملفات مضافة حالياً</p>';
        return;
    }
    container.innerHTML = subjects.map(sub => `
        <div class="file-card">
            <h3>${sub.subject_name}</h3>
            <p><strong>المدرس:</strong> ${sub.teacher_name}</p>
            <a href="${sub.pdf_url}" target="_blank" class="download-btn">تحميل الملف</a>
        </div>
    `).join('');
}

async function loadStories() {
    const wrapper = document.getElementById('stories-wrapper');
    if (!wrapper) return;
    const { data: stories } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
    let html = `<div class="add-story-btn" onclick="addNewStory()">➕ إضافة ستوري</div>`;
    if (stories && stories.length > 0) {
        html += stories.map(s => `
            <div class="story-item" onclick="alert('عرض الستوري')">
                <img src="${s.media_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
            </div>
        `).join('');
    }
    wrapper.innerHTML = html;
}

async function addNewStory() {
    const mediaUrl = prompt('أدخل رابط صورة الستوري:');
    if (mediaUrl) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('يرجى تسجيل الدخول أولاً');
            return;
        }
        await supabase.from('stories').insert([{ media_url: mediaUrl, user_id: user.id }]);
        loadStories();
    }
}

async function loadNotificationsCount() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
    badge.innerText = count || 0;
}

function handleSearch(query) {
    const container = document.getElementById('search-results-container');
    if (!query) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = '<p>جاري البحث...</p>';
    supabase.from('subjects').select('*').ilike('subject_name', `%${query}%`).then(({ data }) => {
        if (!data || data.length === 0) {
            container.innerHTML = '<p>لا توجد نتائج مطابقة</p>';
            return;
        }
        container.innerHTML = data.map(r => `
            <div class="file-card">
                <h3>${r.subject_name}</h3>
                <a href="${r.pdf_url}" target="_blank" class="download-btn">تحميل</a>
            </div>
        `).join('');
    });
}

function loadSubStages(stageName) {
    const container = document.getElementById('sub-stages-container');
    container.innerHTML = `<p>جاري تحميل محتوى المرحلة (${stageName})...</p>`;
    supabase.from('sub_stages').select('*').eq('stage_name', stageName).then(({ data }) => {
        if (!data || data.length === 0) {
            container.innerHTML = '<p>لا توجد صفوف مضافة لهذه المرحلة حالياً</p>';
            return;
        }
        container.innerHTML = data.map(sub => `
            <div class="file-card">
                <h3>${sub.sub_stage_name}</h3>
            </div>
        `).join('');
    });
}

async function loadUniversityStructure() {
    const container = document.getElementById('university-structure-container');
    container.innerHTML = '<p>جاري تحميل الكليات...</p>';
    const { data: colleges } = await supabase.from('colleges').select('*');
    if (!colleges || colleges.length === 0) {
        container.innerHTML = '<p>لا توجد كليات مضافة</p>';
        return;
    }
    container.innerHTML = `
        <h3>الكليات والأقسام الجامعية</h3>
        <div class="stages-grid">
            ${colleges.map(c => `
                <div class="stage-card">
                    <h4>${c.college_name}</h4>
                    <p>${c.department_name || ''}</p>
                </div>
            `).join('')}
        </div>
    `;
}

async function uploadNewFile() {
    const title = document.getElementById('file-name-input').value;
    const desc = document.getElementById('file-desc-input').value;
    const fileType = document.getElementById('file-type-select').value;
    const fileInput = document.getElementById('actual-file-input').files[0];

    if (!title || !fileInput) {
        alert('الرجاء إدخال اسم الملف واختيار الملف');
        return;
    }

    const filePath = `uploads/${Date.now()}_${fileInput.name}`;
    const { error: uploadError } = await supabase.storage.from('professors-files').upload(filePath, fileInput);

    if (uploadError) {
        alert('خطأ في الرفع: ' + uploadError.message);
        return;
    }

    const { data: publicUrlData } = supabase.storage.from('professors-files').getPublicUrl(filePath);

    await supabase.from('subjects').insert([
        {
            subject_name: title,
            teacher_name: 'أستاذ المادة',
            teacher_info: desc,
            pdf_url: publicUrlData.publicUrl,
            file_type: fileType,
            stage: 'primary'
        }
    ]);

    alert('تم رفع الملف بنجاح!');
    document.getElementById('file-upload-modal').style.display = 'none';
    loadLatestFiles();
}

function sendAdminNotification() {
    const notifText = prompt('أدخل نص الإشعار العام:');
    if (notifText) {
        supabase.from('notifications').insert([{ message: notifText }]).then(() => {
            alert('تم إرسال الإشعار بنجاح');
            loadNotificationsCount();
        });
    }
}
