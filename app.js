// --- Initial Data Setup ---
const initialDonors = [
    { id: 101, name: "Sarah Connor", age: 29, gender: "Female", bloodGroup: "O-", city: "New York", phone: "9876543210", time: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
    { id: 102, name: "Marcus Vance", age: 34, gender: "Male", bloodGroup: "A+", city: "Los Angeles", phone: "9123456789", time: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 103, name: "Elena Rostova", age: 41, gender: "Female", bloodGroup: "B+", city: "Chicago", phone: "9812345678", time: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 104, name: "David Chen", age: 26, gender: "Male", bloodGroup: "AB+", city: "San Francisco", phone: "9765432109", time: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 105, name: "Jessica Taylor", age: 31, gender: "Female", bloodGroup: "O+", city: "Houston", phone: "9543210987", time: new Date(Date.now() - 3600000 * 48).toISOString() },
    { id: 106, name: "Robert Thorne", age: 45, gender: "Male", bloodGroup: "A-", city: "Seattle", phone: "9432109876", time: new Date(Date.now() - 3600000 * 72).toISOString() }
];

const initialRequests = [
    { id: 201, patientName: "Arthur Pendelton", bloodGroup: "O-", units: 2, hospital: "St. Jude Hospital, LA", phone: "9001122334", status: "Pending", time: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: 202, patientName: "Sophia Martinez", bloodGroup: "B+", units: 1, hospital: "General Trauma Center, NY", phone: "9887766554", status: "Fulfilled", time: new Date(Date.now() - 3600000 * 20).toISOString() }
];

// Initialize LocalStorage if empty
if (!localStorage.getItem('donors')) {
    localStorage.setItem('donors', JSON.stringify(initialDonors));
}
if (!localStorage.getItem('bloodRequests')) {
    localStorage.setItem('bloodRequests', JSON.stringify(initialRequests));
}

// --- Active Filters State ---
let adminBloodFilter = 'ALL';
let userBloodFilter = 'ALL';

// --- Toast System ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        danger: '❌'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Fill Quick Credentials ---
window.fillLogin = function(user, pass) {
    document.getElementById('username').value = user;
    document.getElementById('password').value = pass;
    showToast(`Credentials filled for ${user.toUpperCase()}`, 'info');
};

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const userSection = document.getElementById('user-section');

const loginForm = document.getElementById('login-form');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const userLogoutBtn = document.getElementById('user-logout-btn');

const adminDonorsBody = document.getElementById('admin-donors-body');
const userDonorsBody = document.getElementById('user-donors-body');
const adminRequestsBody = document.getElementById('admin-requests-body');
const userRequestsBody = document.getElementById('user-requests-body');

const donorModal = document.getElementById('donor-modal');
const requestModal = document.getElementById('request-modal');
const addDonorBtn = document.getElementById('add-donor-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelDonorBtn = document.getElementById('cancel-donor-btn');
const donorForm = document.getElementById('donor-form');
const requestForm = document.getElementById('request-form');
const modalTitle = document.getElementById('modal-title');
const chartContainer = document.getElementById('donors-chart');

// --- Navigation & State ---
function initialize() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
        showSection(adminSection);
        renderAdminDashboard();
    } else if (userRole === 'user') {
        showSection(userSection);
        renderUserDashboard();
    } else {
        showSection(loginSection);
    }
}

function showSection(section) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    section.classList.add('active');
}

// --- Authentication ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (!user || !pass) {
        showToast('Please enter both username and password', 'warning');
        return;
    }

    if (user.toLowerCase() === 'admin') {
        if (pass === 'admin') {
            localStorage.setItem('userRole', 'admin');
            showSection(adminSection);
            renderAdminDashboard();
            showToast('Welcome to Admin Portal', 'success');
        } else {
            showToast('Invalid Admin password! Access denied.', 'danger');
        }
    } else {
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userName', user);
        showSection(userSection);
        renderUserDashboard();
        showToast(`Welcome, ${user}!`, 'success');
    }
});

function logout() {
    localStorage.removeItem('userRole');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showSection(loginSection);
    showToast('Logged out successfully', 'info');
}

adminLogoutBtn.addEventListener('click', logout);
userLogoutBtn.addEventListener('click', logout);

// --- Data Helpers ---
function getDonors() {
    return JSON.parse(localStorage.getItem('donors')) || [];
}

function saveDonors(donors) {
    localStorage.setItem('donors', JSON.stringify(donors));
}

function getRequests() {
    return JSON.parse(localStorage.getItem('bloodRequests')) || [];
}

function saveRequests(requests) {
    localStorage.setItem('bloodRequests', JSON.stringify(requests));
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// --- Stats Calculation ---
function updateStats() {
    const donors = getDonors();
    const requests = getRequests();
    
    // Total Donors
    const totalDonorsElem = document.getElementById('stat-total-donors');
    if (totalDonorsElem) totalDonorsElem.textContent = donors.length;

    // Total Units (Each donor counts as 1 unit)
    const totalUnitsElem = document.getElementById('stat-total-units');
    if (totalUnitsElem) totalUnitsElem.textContent = donors.length;

    // Critical Alerts: Blood groups with 0 or 1 donor
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const counts = {};
    groups.forEach(g => counts[g] = 0);
    donors.forEach(d => { if (counts[d.bloodGroup] !== undefined) counts[d.bloodGroup]++; });
    
    const criticalCount = groups.filter(g => counts[g] <= 1).length;
    const criticalElem = document.getElementById('stat-critical-alerts');
    if (criticalElem) criticalElem.textContent = criticalCount;

    // Pending Emergency Requests
    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const pendingElem = document.getElementById('stat-pending-requests');
    if (pendingElem) pendingElem.textContent = pendingCount;
}

// --- Admin Filtering & Rendering ---
window.setAdminBloodFilter = function(group) {
    adminBloodFilter = group;
    document.querySelectorAll('#admin-blood-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(group) || (group === 'ALL' && btn.textContent.includes('All')));
    });
    renderAdminDashboard();
};

window.filterAdminDonors = function() {
    renderAdminDashboard();
};

function renderAdminDashboard() {
    const donors = getDonors();
    const searchQuery = (document.getElementById('admin-search-input')?.value || '').toLowerCase();
    
    adminDonorsBody.innerHTML = '';
    
    let filtered = donors.filter(donor => {
        const matchesGroup = adminBloodFilter === 'ALL' || donor.bloodGroup === adminBloodFilter;
        const matchesQuery = !searchQuery || 
            donor.name.toLowerCase().includes(searchQuery) ||
            (donor.phone && donor.phone.includes(searchQuery)) ||
            (donor.city && donor.city.toLowerCase().includes(searchQuery));
        return matchesGroup && matchesQuery;
    });

    // Update count badge
    const badge = document.getElementById('admin-donor-count-badge');
    if (badge) badge.textContent = `${filtered.length} Donors`;

    if (filtered.length === 0) {
        adminDonorsBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #64748b;">No donors found matching criteria</td></tr>`;
    } else {
        filtered.sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(donor => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${donor.name}</strong></td>
                <td>${donor.age}</td>
                <td>${donor.gender || 'N/A'}</td>
                <td><span class="bg-badge">${donor.bloodGroup}</span></td>
                <td>${donor.city || 'Not specified'}</td>
                <td>${donor.phone}</td>
                <td>${formatDate(donor.time)}</td>
                <td>
                    <button class="btn-edit" onclick="editDonor(${donor.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteDonor(${donor.id})">Delete</button>
                </td>
            `;
            adminDonorsBody.appendChild(tr);
        });
    }

    renderAdminRequests();
    renderChart();
    updateStats();
}

function renderAdminRequests() {
    const requests = getRequests();
    adminRequestsBody.innerHTML = '';

    const pendingBadge = document.getElementById('admin-request-count-badge');
    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    if (pendingBadge) pendingBadge.textContent = `${pendingCount} Pending`;

    if (requests.length === 0) {
        adminRequestsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 1.5rem; color: #64748b;">No emergency blood requests</td></tr>`;
    } else {
        requests.sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(req => {
            const tr = document.createElement('tr');
            const isPending = req.status === 'Pending';
            tr.innerHTML = `
                <td><strong>${req.patientName}</strong></td>
                <td><span class="bg-badge">${req.bloodGroup}</span></td>
                <td>${req.units} Unit(s)</td>
                <td>${req.hospital}</td>
                <td>${req.phone}</td>
                <td><span class="status-badge ${isPending ? 'status-pending' : 'status-fulfilled'}">${req.status}</span></td>
                <td>
                    ${isPending ? `<button class="btn-fulfill" onclick="fulfillRequest(${req.id})">Mark Fulfilled</button>` : '<span>Resolved</span>'}
                </td>
            `;
            adminRequestsBody.appendChild(tr);
        });
    }
}

// --- User Filtering & Rendering ---
window.setUserBloodFilter = function(group) {
    userBloodFilter = group;
    document.querySelectorAll('#user-blood-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(group) || (group === 'ALL' && btn.textContent.includes('All')));
    });
    renderUserDashboard();
};

window.filterUserDonors = function() {
    renderUserDashboard();
};

function renderUserDashboard() {
    const donors = getDonors();
    const searchQuery = (document.getElementById('user-search-input')?.value || '').toLowerCase();
    
    userDonorsBody.innerHTML = '';
    
    let filtered = donors.filter(donor => {
        const matchesGroup = userBloodFilter === 'ALL' || donor.bloodGroup === userBloodFilter;
        const matchesQuery = !searchQuery || 
            donor.name.toLowerCase().includes(searchQuery) ||
            (donor.phone && donor.phone.includes(searchQuery)) ||
            (donor.city && donor.city.toLowerCase().includes(searchQuery));
        return matchesGroup && matchesQuery;
    });

    const badge = document.getElementById('user-donor-count-badge');
    if (badge) badge.textContent = `${filtered.length} Available`;

    if (filtered.length === 0) {
        userDonorsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #64748b;">No available donors found matching your search</td></tr>`;
    } else {
        filtered.sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(donor => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${donor.name}</strong></td>
                <td>${donor.age}</td>
                <td>${donor.gender || 'N/A'}</td>
                <td><span class="bg-badge">${donor.bloodGroup}</span></td>
                <td>${donor.city || 'Not specified'}</td>
                <td>${donor.phone}</td>
                <td><span class="status-badge status-available">Ready to Donate</span></td>
            `;
            userDonorsBody.appendChild(tr);
        });
    }

    renderUserRequests();
}

function renderUserRequests() {
    const requests = getRequests();
    userRequestsBody.innerHTML = '';

    if (requests.length === 0) {
        userRequestsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: #64748b;">No active emergency requests</td></tr>`;
    } else {
        requests.sort((a,b) => new Date(b.time) - new Date(a.time)).forEach(req => {
            const tr = document.createElement('tr');
            const isPending = req.status === 'Pending';
            tr.innerHTML = `
                <td><strong>${req.patientName}</strong></td>
                <td><span class="bg-badge">${req.bloodGroup}</span></td>
                <td>${req.units} Unit(s)</td>
                <td>${req.hospital}</td>
                <td>${req.phone}</td>
                <td><span class="status-badge ${isPending ? 'status-pending' : 'status-fulfilled'}">${req.status}</span></td>
            `;
            userRequestsBody.appendChild(tr);
        });
    }
}

// --- Dynamic Bar Chart ---
function renderChart() {
    const donors = getDonors();
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const counts = {};
    
    groups.forEach(g => counts[g] = 0);
    donors.forEach(d => {
        if (counts[d.bloodGroup] !== undefined) counts[d.bloodGroup]++;
    });

    const maxCount = Math.max(...Object.values(counts), 1);
    chartContainer.innerHTML = '';
    
    groups.forEach(group => {
        const count = counts[group];
        const percentage = count === 0 ? 6 : (count / maxCount) * 100;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';
        wrapper.innerHTML = `
            <span class="bar-value">${count}</span>
            <div class="bar" style="height: ${percentage}%" title="${group}: ${count} donors"></div>
            <span class="bar-label">${group}</span>
        `;
        chartContainer.appendChild(wrapper);
    });
}

// --- Modal & Form Logic (Global Exposures) ---
window.openModal = function(mode, donorId = null) {
    document.getElementById('donor-name').value = '';
    document.getElementById('donor-age').value = '';
    document.getElementById('donor-gender').value = 'Male';
    document.getElementById('donor-city').value = '';
    document.getElementById('donor-phone').value = '';
    document.getElementById('donor-blood-group').value = 'A+';
    document.getElementById('donor-id').value = '';

    if (mode === 'edit') {
        modalTitle.textContent = 'Edit Donor Information';
        const donors = getDonors();
        const donor = donors.find(d => d.id === donorId);
        if (donor) {
            document.getElementById('donor-id').value = donor.id;
            document.getElementById('donor-name').value = donor.name;
            document.getElementById('donor-age').value = donor.age;
            document.getElementById('donor-gender').value = donor.gender || 'Male';
            document.getElementById('donor-city').value = donor.city || '';
            document.getElementById('donor-phone').value = donor.phone;
            document.getElementById('donor-blood-group').value = donor.bloodGroup;
        }
    } else {
        modalTitle.textContent = 'Register New Donor';
    }
    
    donorModal.style.display = 'flex';
};

window.closeModal = function() {
    donorModal.style.display = 'none';
};

window.openRequestModal = function() {
    document.getElementById('req-patient-name').value = '';
    document.getElementById('req-units').value = '1';
    document.getElementById('req-hospital').value = '';
    document.getElementById('req-phone').value = '';
    document.getElementById('req-blood-group').value = 'A+';
    requestModal.style.display = 'flex';
};

window.closeRequestModal = function() {
    requestModal.style.display = 'none';
};

if (addDonorBtn) addDonorBtn.addEventListener('click', () => window.openModal('add'));
if (closeModalBtn) closeModalBtn.addEventListener('click', window.closeModal);
if (cancelDonorBtn) cancelDonorBtn.addEventListener('click', window.closeModal);

donorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const idField = document.getElementById('donor-id').value;
    const name = document.getElementById('donor-name').value.trim();
    const age = parseInt(document.getElementById('donor-age').value);
    const gender = document.getElementById('donor-gender').value;
    const city = document.getElementById('donor-city').value.trim();
    const phone = document.getElementById('donor-phone').value.trim();
    const bloodGroup = document.getElementById('donor-blood-group').value;

    let donors = getDonors();

    if (idField) {
        const index = donors.findIndex(d => d.id === parseInt(idField));
        if (index > -1) {
            donors[index] = { ...donors[index], name, age, gender, city, phone, bloodGroup };
            showToast(`Updated info for donor ${name}`, 'success');
        }
    } else {
        const newDonor = {
            id: Date.now(),
            name,
            age,
            gender,
            city,
            phone,
            bloodGroup,
            time: new Date().toISOString()
        };
        donors.push(newDonor);
        showToast(`New donor ${name} registered successfully!`, 'success');
    }

    saveDonors(donors);
    window.closeModal();
    
    if (localStorage.getItem('userRole') === 'admin') {
        renderAdminDashboard();
    } else {
        renderUserDashboard();
    }
});

// Emergency Request Submit
requestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const patientName = document.getElementById('req-patient-name').value.trim();
    const bloodGroup = document.getElementById('req-blood-group').value;
    const units = parseInt(document.getElementById('req-units').value);
    const hospital = document.getElementById('req-hospital').value.trim();
    const phone = document.getElementById('req-phone').value.trim();

    const newReq = {
        id: Date.now(),
        patientName,
        bloodGroup,
        units,
        hospital,
        phone,
        status: 'Pending',
        time: new Date().toISOString()
    };

    const requests = getRequests();
    requests.push(newReq);
    saveRequests(requests);

    window.closeRequestModal();
    showToast(`Emergency request for ${patientName} submitted!`, 'warning');

    if (localStorage.getItem('userRole') === 'admin') {
        renderAdminDashboard();
    } else {
        renderUserDashboard();
    }
});

// Global Handlers
window.deleteDonor = function(id) {
    if (confirm('Are you sure you want to remove this donor record?')) {
        let donors = getDonors();
        const deleted = donors.find(d => d.id === id);
        donors = donors.filter(d => d.id !== id);
        saveDonors(donors);
        renderAdminDashboard();
        showToast(`Deleted donor ${deleted ? deleted.name : ''}`, 'info');
    }
};

window.editDonor = function(id) {
    window.openModal('edit', id);
};

window.fulfillRequest = function(id) {
    let requests = getRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index > -1) {
        requests[index].status = 'Fulfilled';
        saveRequests(requests);
        renderAdminDashboard();
        showToast(`Request for ${requests[index].patientName} marked as Fulfilled!`, 'success');
    }
};

// Start App
initialize();

