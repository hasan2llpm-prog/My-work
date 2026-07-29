// --- إعدادات الاتصال الحقيقية بـ Supabase ---
const SUPABASE_URL = 'https://icpcthgueabxwwevowbt.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_rg857jiJ2tgqje-odQHZIQ_2Sd0UzbD';

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// حساب الأدمن A1
const ADMIN_EMAIL = 'jawadrissan22@gmail.com';

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    loadStages();
    loadStories();
    loadLatestFiles();
    loadNotificationsCount();
    initSearch();
    initModalEvents();
    
    try {
        await checkUserSessionAndMandatorySignup();
    } catch (e) {
        console.log('Session check skipped');
    }
});

// --- 2. التنقل بين الأقسام والشريط السفلي والقائمة الجانبية ---
function initNavigation() {
    const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const targetId = e.target.getAttribute('data-target');
            document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    const sidebar = document.getElementById('sidebar');
    document.getElementById('open-sidebar-btn').addEventListener('click', () => sidebar.classList.add('open'));
    document.getElementById('close-sidebar-btn').addEventListener('click', () => sidebar.classList.remove('open'));

    // أزرار القائمة الجانبية
    document.getElementById('referral-btn').addEventListener('click', () => {
        document.getElementById('referral-modal').style.display = 'flex';
        loadReferralCode();
    });
    document.getElementById('whatsapp-support-btn').addEventListener('click', () => {
        window.open('https://wa.me/9640000000000', '_blank');
    });
}

// --- 3. أحداث النوافذ المنبثقة وحمايتها داخل DOMContentLoaded ---
function initModalEvents() {
    const closeStoryBtn = document.getElementById('close-story-modal');
    if (closeStoryBtn) {
        closeStoryBtn.addEventListener('click', () => {
            document.getElementById('story-modal').style.display = 'none';
        });
    }

    const openNotifBtn = document.getElementById('open-notifications-btn');
    if (openNotifBtn) {
        openNotifBtn.addEventListener('click', async () => {
            const modal = document.getElementById('notifications-modal');
            modal.style.display = 'flex';
            
            const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
            const listContainer = document.getElementById('notifications-list');
            
            if (!notifs || notifs.length === 0) {
                listContainer.innerHTML = '<p>لا توجد إشعارات جديدة</p>';
                return;
            }

            listContainer.innerHTML = notifs.map(n => `<div class="file-card"><p>${n.message}</p></div>`).join('');
        });
    }

    const closeNotifBtn = document.getElementById('close-notif-modal');
    if (closeNotifBtn) {
        closeNotifBtn.addEventListener('click', () => {
            document.getElementById('notifications-modal').style.display = 'none';
        });
    }

    const closeReferralBtn = document.getElementById('close-referral-modal');
    if (closeReferralBtn) {
        closeReferralBtn.addEventListener('click', () => {
            document.getElementById('referral-modal').style.display = 'none';
        });
    }

    const closeFileModalBtn = document.getElementById('close-file-modal');
    if (closeFileModalBtn) {
        closeFileModalBtn.addEventListener('click', () => {
            document.getElementById('file-upload-modal').style.display = 'none';
        });
    }
}

// --- 4. التحقق من الجلسة وصلاحيات الأدمن (A1) والبيانات الإجبارية ---
async function checkUserSessionAndMandatorySignup() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        document.getElementById('user-email-display').innerText = 'غير مسجل دخول';
        return;
    }

    document.getElementById('user-email-display').innerText = user.email;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.fullname) {
        document.getElementById('mandatory-signup-modal').style.display = 'flex';
    } else {
        if (profile.avatar_url) {
            document.getElementById('sidebar-avatar').src = profile.avatar_url;
        }
        if (profile.phone) {
            document.getElementById('user-phone-display').innerText = profile.phone;
        }
    }

    const signupBtn = document.getElementById('submit-mandatory-signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', async () => {
            const fullname = document.getElementById('reg-fullname').value;
            const username = document.getElementById('reg-username').value;
            const phone = document.getElementById('reg-phone').value;
            
            if (!fullname || !username) {
                alert('يرجى ملء الحقول الإجبارية');
                return;
            }

            await supabase.from('profiles').upsert({
                id: user.id,
                fullname,
                username,
                phone,
                email: user.email
            });

            document.getElementById('mandatory-signup-modal').style.display = 'none';
            location.reload();
        });
    }

    if (user.email === ADMIN_EMAIL || (profile && profile.role === 'admin')) {
        const adminPanel = document.getElementById('admin-controls-panel');

        if (adminPanel) {
            adminPanel.style.display = 'block';
            initAdminControls();
        }
    }
}

// --- 5. إدارة المراحل والصفوف والجامعات ---
function loadStages() {
    const stageCards = document.querySelectorAll('.stage-card');
    stageCards.forEach(card => {
        card.addEventListener('click', async () => {
            const stageType = card.getAttribute('data-stage');
            const container = document.getElementById('sub-stages-container');
            container.innerHTML = '<p>جاري تحميل محتوى المرحلة...</p>';

            if (stageType === 'university') {
                loadUniversityStructure();
            } else {
                const { data: subStages } = await supabase
                    .from('sub_stages')
                    .select('*')
                    .eq('stage_name', stageType);

                if (!subStages || subStages.length === 0) {
                    container.innerHTML = '<p>لا توجد صفوف مضافة لهذه المرحلة حالياً</p>';
                    return;
                }

                container.innerHTML = subStages.map(sub => `
                    <div class="file-card" onclick="loadSubjectsForSubStage('${sub.id}')">
                        <h3>${sub.sub_stage_name}</h3>
                    </div>
                `).join('');
            }
        });
    });
}

async function loadUniversityStructure() {
    const container = document.getElementById('university-structure-container');
    const { data: colleges, error } = await supabase.from('colleges').select('*');
    
    if (error || !colleges) {
        container.innerHTML = '<p>خطأ في تحميل بيانات الكليات والأقسام</p>';
        return;
    }

    container.innerHTML = `
        <h3>الكليات والأقسام الجامعية</h3>
        <div class="stages-grid">
            ${colleges.map(c => `
                <div class="stage-card" onclick="alert('تم اختيار الكلية: ${c.college_name}')">
                    <h4>${c.college_name}</h4>
                    <p>${c.department_name || ''}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// --- 6. لوحة تحكم الأدمن (A1) والرفع المتقدم باستخدام مجلد professors-files ---
function initAdminControls() {
    const addMatBtn = document.getElementById('admin-add-material');
    if (addMatBtn) {
        addMatBtn.addEventListener('click', () => {
            document.getElementById('file-upload-modal').style.display = 'flex';
        });
    }

    const saveFileBtn = document.getElementById('save-file-upload-btn');
    if (saveFileBtn) {
        saveFileBtn.addEventListener('click', async () => {
            const title = document.getElementById('file-name-input').value;
            const desc = document.getElementById('file-desc-input').value;
            const fileType = document.getElementById('file-type-select').value;
            const fileInput = document.getElementById('actual-file-input').files[0];

            const teacherName = prompt('أدخل اسم المدرس:') || 'أستاذ المادة';
            const teacherInfo = prompt('أدخل معلومات أو لقب المدرس:') || '';
            const stageName = prompt('حدد المرحلة (primary, middle, prep, university):') || 'primary';

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

            const { error: dbError } = await supabase.from('subjects').insert([
                {
                    subject_name: title,
                    teacher_name: teacherName,
                    teacher_info: `${teacherInfo} - ${desc}`,
                    pdf_url: publicUrlData.publicUrl,
                    file_type: fileType,
                    stage: stageName
                }
            ]);

            if (dbError) {
                alert('خطأ في حفظ البيانات: ' + dbError.message);
            } else {
                alert('تم رفع الملف بنجاح!');
                document.getElementById('file-upload-modal').style.display = 'none';
                loadLatestFiles();
            }
        });
    }

    const sendNotifBtn = document.getElementById('admin-send-notification');
    if (sendNotifBtn) {
        sendNotifBtn.addEventListener('click', async () => {
            const notifText = prompt('أدخل نص الإشعار العام للطلاب:');
            if (notifText) {
                await supabase.from('notifications').insert([{ message: notifText }]);
                alert('تم إرسال الإشعار بنجاح');
                loadNotificationsCount();
            }
        });
    }
}

// --- 7. جلب وعرض الملفات والمواد ---
async function loadLatestFiles() {
    const container = document.getElementById('latest-files-container');
    if (!container) return;

    const { data: subjects, error } = await supabase.from('subjects').select('*').order('created_at', { ascending: false });

    if (error || !subjects || subjects.length === 0) {
        container.innerHTML = '<p>لا توجد ملفات مضافة حالياً</p>';
        return;
    }

    container.innerHTML = subjects.map(sub => `
        <div class="file-card">
            <h3>${sub.subject_name}</h3>
            <p><strong>المدرس:</strong> ${sub.teacher_name}</p>
            <p>${sub.teacher_info || ''}</p>
            <a href="${sub.pdf_url}" target="_blank" class="download-btn">تحميل الملف (${sub.file_type || 'PDF'})</a>
        </div>
    `).join('');
}

// --- 8. الستوري المتطور (مشاهدات، تفاعلات، حذف، وتعديل حقيقي) ---
async function loadStories() {
    const wrapper = document.getElementById('stories-wrapper');
    if (!wrapper) return;

    const { data: stories } = await supabase.from('stories').select('*').order('created_at', { ascending: false });

    let html = `<div class="add-story-btn" id="add-story-trigger">➕ إضافة ستوري</div>`;
    
    if (stories && stories.length > 0) {
        html += stories.map(s => `
            <div class="story-item" onclick="openStory('${s.id}', '${s.media_url}', '${s.user_id}')">
                <img src="${s.media_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
            </div>
        `).join('');
    }
    wrapper.innerHTML = html;

    const addTrigger = document.getElementById('add-story-trigger');
    if (addTrigger) {
        addTrigger.addEventListener('click', async () => {
            const mediaUrl = prompt('أدخل رابط صورة الستوري:');
            if (mediaUrl) {
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from('stories').insert([{ media_url: mediaUrl, user_id: user.id }]);
                loadStories();
            }
        });
    }
}

window.openStory = async function(storyId, mediaUrl, userId) {
    const modal = document.getElementById('story-modal');
    modal.style.display = 'flex';
    
    document.getElementById('story-media-container').innerHTML = `<img src="${mediaUrl}" style="max-width:100%; border-radius:8px;">`;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('story_views').upsert([{ story_id: storyId, user_id: user.id }], { onConflict: 'story_id,user_id' });
    }

    const { count } = await supabase.from('story_views').select('*', { count: 'exact', head: true }).eq('story_id', storyId);
    document.getElementById('story-views-count').innerText = `👁️ ${count || 0} مشاهدات`;

    const ownerActions = document.getElementById('story-owner-actions');
    
    if (user && user.id === userId) {
        ownerActions.style.display = 'block';
        
        document.getElementById('delete-story-btn').onclick = async () => {
            if (confirm('هل أنت متأكد من حذف الستوري؟')) {
                await supabase.from('stories').delete().eq('id', storyId);
                modal.style.display = 'none';
                loadStories();
            }
        };

        document.getElementById('edit-story-btn').onclick = async () => {
            const newUrl = prompt('أدخل رابط الصورة الجديد للستوري:', mediaUrl);
            if (newUrl) {
                await supabase.from('stories').update({ media_url: newUrl }).eq('id', storyId);
                modal.style.display = 'none';
                loadStories();
                alert('تم تحديث الستوري بنجاح');
            }
        };
    } else {
        ownerActions.style.display = 'none';
    }
}

// --- 9. الإشعارات والبحث وإحالة الصديق ---
async function loadNotificationsCount() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;

    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
    badge.innerText = count || 0;
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value;
        const container = document.getElementById('search-results-container');
        
        if (!query) {
            container.innerHTML = '';
            return;
        }

        const { data: results } = await supabase
            .from('subjects')
            .select('*')
            .ilike('subject_name', `%${query}%`);

        if (!results || results.length === 0) {
            container.innerHTML = '<p>لا توجد نتائج مطابقة</p>';
            return;
        }

        container.innerHTML = results.map(r => `
            <div class="file-card">
                <h3>${r.subject_name}</h3>
                <p>المدرس: ${r.teacher_name}</p>
                <a href="${r.pdf_url}" target="_blank" class="download-btn">تحميل</a>
            </div>
        `).join('');
    });
}

async function loadReferralCode() {
    const codeBox = document.getElementById('user-referral-code');
    if (!codeBox) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        codeBox.innerText = `REF-${user.id.substring(0, 6).toUpperCase()}`;
    }
}
