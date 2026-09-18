// ============================================================
// DATABASE API
// ============================================================

async function clients() {
    const response = await fetch('/clients');

    if (!response.ok) {
        throw new Error('Failed to load clients');
    }

    return await response.json();
}


async function setting() {
    const response = await fetch('/setting');

    if (!response.ok) {
        throw new Error('Failed to load settings');
    }

    return await response.json();
}


// Load clients from SQLite
async function loadStoredClients() {
    try {

        const clientsData = await clients();

        return Array.isArray(clientsData)
            ? clientsData
            : [];

    } catch (error) {

        console.error('Error loading clients:', error);

        return [];
    }
}


// ============================================================
// MAIN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    // ========================================================
    // DATA
    // ========================================================

    let clientsData = await loadStoredClients();


    // ========================================================
    // SETTINGS / BRANDING
    // ========================================================

    async function loadGymSettings() {

        try {

            const settings = await setting();

            const gymName =
                settings.length > 0 && settings[0].salle_name
                    ? settings[0].salle_name
                    : 'SALLE NAME';


            document.getElementById('gymNameInput').value = gymName;

            updateBranding(gymName);

        } catch (error) {

            console.error(
                'Error loading gym settings:',
                error
            );

            updateBranding('SALLE NAME');
        }
    }


    function updateBranding(gymName) {

        const displayName =
            gymName?.trim() || 'SALLE NAME';


        document.getElementById(
            'gymNameDisplay'
        ).textContent = displayName;


        const firstLetter =
            displayName
                .charAt(0)
                .toUpperCase() || 'S';


        document.getElementById(
            'brandLogo'
        ).textContent = firstLetter;
    }


    // Load name from SQLite
    await loadGymSettings();


    // ========================================================
    // TOAST
    // ========================================================

    function showToast(msg) {

        const toast =
            document.getElementById('toast');

        toast.textContent = msg;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }


    // ========================================================
    // NAVIGATION
    // ========================================================

    const navLinks =
        document.querySelectorAll(
            '.nav-link[data-view]'
        );

    const viewPanels =
        document.querySelectorAll(
            '.view-panel'
        );


    function switchView(targetViewId) {

        viewPanels.forEach(panel => {

            if (panel.id === targetViewId) {

                panel.classList.add(
                    'active-view'
                );

            } else {

                panel.classList.remove(
                    'active-view'
                );
            }
        });


        navLinks.forEach(link => {

            if (
                link.getAttribute('data-view')
                === targetViewId
            ) {

                link.classList.add('active');

            } else {

                link.classList.remove('active');
            }
        });


        if (
            targetViewId === 'dashboardView'
        ) {

            setTimeout(
                renderAllCharts,
                50
            );
        }
    }


    navLinks.forEach(link => {

        link.addEventListener('click', e => {

            e.preventDefault();

            const viewId =
                link.getAttribute('data-view');

            if (viewId) {

                switchView(viewId);
            }
        });
    });


    // ========================================================
    // CLIENT STATUS
    // ========================================================

    function getClientStatus(endDateStr) {

        const now = new Date();

        const end =
            new Date(endDateStr);

        const diffTime =
            end - now;

        const diffDays =
            Math.ceil(
                diffTime /
                (1000 * 60 * 60 * 24)
            );


        if (diffDays < 0) {

            return {
                label: 'Expired',
                badgeClass: 'badge-danger',
                code: 'EXPIRED'
            };
        }


        if (diffDays <= 7) {

            return {
                label: `Expiring (${diffDays}d)`,
                badgeClass: 'badge-warning',
                code: 'EXPIRING'
            };
        }


        return {
            label: 'Active',
            badgeClass: 'badge-success',
            code: 'ACTIVE'
        };
    }


    // ========================================================
    // CLIENT TABLE
    // ========================================================

    function renderClientsTable() {

        const tbody =
            document.getElementById(
                'clientsTableBody'
            );


        const searchTerm =
            document.getElementById(
                'clientSearchInput'
            )
            .value
            .toLowerCase();


        const statusFilter =
            document.getElementById(
                'filterStatusSelect'
            ).value;


        tbody.innerHTML = '';


        let total =
            clientsData.length;

        let activeCount = 0;

        let expiringCount = 0;

        let expiredCount = 0;


        clientsData.forEach(client => {

            const status =
                getClientStatus(
                    client.end_date
                );


            if (
                status.code === 'ACTIVE'
            ) {
                activeCount++;
            }


            if (
                status.code === 'EXPIRING'
            ) {
                expiringCount++;
            }


            if (
                status.code === 'EXPIRED'
            ) {
                expiredCount++;
            }


            const clientName =
                String(client.name || '');


            const clientPhone =
                String(client.phone || '');


            const matchesSearch =
                clientName
                    .toLowerCase()
                    .includes(searchTerm)
                ||
                clientPhone
                    .includes(searchTerm);


            const matchesStatus =
                statusFilter === 'ALL'
                ||
                status.code === statusFilter;


            if (
                matchesSearch &&
                matchesStatus
            ) {

                const tr =
                    document.createElement('tr');


                tr.innerHTML = `

                    <td>

                        <div class="client-name">
                            ${client.name || ''}
                        </div>

                        <div class="client-phone">
                            ${client.phone || ''}
                        </div>

                    </td>

                    <td>
                        ${client.plan || ''}
                    </td>

                    <td>
                        ${client.start_date || ''}
                    </td>

                    <td>
                        ${client.end_date || ''}
                    </td>

                    <td style="font-weight: 700;">
                        ${client.amount || 0} MAD
                    </td>

                    <td>
                        <span class="pill-badge ${status.badgeClass}">
                            ${status.label}
                        </span>
                    </td>

                    <td
                        class="editbuttons"
                        style="text-align: right; border-bottom: none;"
                    >

                        <button
                            class="action-btn-sm btn-renew"
                            onclick="openRenewModal('${client.id}')"
                        >
                            Renew
                        </button>

                        <button
                            class="action-btn-sm btn-delete"
                            onclick="openDeleteModal('${client.id}')"
                        >
                            Delete
                        </button>

                    </td>
                `;


                tbody.appendChild(tr);
            }
        });


        // ====================================================
        // DIRECTORY COUNTERS
        // ====================================================

        document.getElementById(
            'totalDirCount'
        ).textContent = total;


        document.getElementById(
            'activeDirCount'
        ).textContent = activeCount;


        document.getElementById(
            'expiringDirCount'
        ).textContent = expiringCount;


        document.getElementById(
            'expiredDirCount'
        ).textContent = expiredCount;


        // ====================================================
        // DASHBOARD KPIs
        // ====================================================

        document.getElementById(
            'kpiTotalClients'
        ).textContent = total;


        document.getElementById(
            'kpiActiveClients'
        ).textContent = activeCount;


        document.getElementById(
            'kpiExpiringCount'
        ).textContent = expiringCount;


        document.getElementById(
            'kpiExpiredCount'
        ).textContent = expiredCount;
    }


    document
        .getElementById('clientSearchInput')
        .addEventListener(
            'input',
            renderClientsTable
        );


    document
        .getElementById('filterStatusSelect')
        .addEventListener(
            'change',
            renderClientsTable
        );


    // ========================================================
    // ADD CLIENT MODAL
    // ========================================================

    const modal =
        document.getElementById(
            'addClientModal'
        );


    const openBtn1 =
        document.getElementById(
            'btnOpenAddModal'
        );


    const openBtn2 =
        document.getElementById(
            'btnOpenAddModal2'
        );


    const navAddBtn =
        document.getElementById(
            'navAddClientBtn'
        );


    const closeBtn =
        document.getElementById(
            'btnCloseModal'
        );


    const cancelBtn =
        document.getElementById(
            'btnCancelModal'
        );


    function openModal() {

        document.getElementById(
            'inputStartDate'
        ).valueAsDate = new Date();


        modal.classList.add('active');
    }


    function closeModal() {

        modal.classList.remove('active');

        document
            .getElementById('addClientForm')
            .reset();
    }


    openBtn1.addEventListener(
        'click',
        openModal
    );


    openBtn2.addEventListener(
        'click',
        openModal
    );


    navAddBtn.addEventListener(
        'click',
        openModal
    );


    closeBtn.addEventListener(
        'click',
        closeModal
    );


    cancelBtn.addEventListener(
        'click',
        closeModal
    );


    // ========================================================
    // ADD CLIENT -> SQLITE
    // ========================================================

    document
        .getElementById('addClientForm')
        .addEventListener(
            'submit',
            async e => {

                e.preventDefault();


                const name =
                    document
                        .getElementById('inputName')
                        .value
                        .trim();


                const phone =
                    document
                        .getElementById('inputPhone')
                        .value
                        .trim();


                const plan =
                    document
                        .getElementById('selectPlan')
                        .value;


                const amount =
                    Number(
                        document
                            .getElementById(
                                'inputAmount'
                            )
                            .value
                    );


                const startDateStr =
                    document
                        .getElementById(
                            'inputStartDate'
                        )
                        .value;


                const durationMonths =
                    Number(
                        document
                            .getElementById(
                                'selectDuration'
                            )
                            .value
                    );


                const startDate =
                    new Date(startDateStr);


                const endDate =
                    new Date(startDate);


                endDate.setMonth(
                    endDate.getMonth()
                    + durationMonths
                );


                const newClient = {

                    name,

                    phone,

                    plan,

                    start_date:
                        startDateStr,

                    end_date:
                        endDate
                            .toISOString()
                            .split('T')[0],

                    amount,

                    durationMonths
                };


                try {

                    const response =
                        await fetch(
                            '/addClients',
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body:
                                    JSON.stringify(
                                        newClient
                                    )
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            'Failed to add client'
                        );
                    }


                    // IMPORTANT:
                    // Get fresh data from SQLite

                    clientsData =
                        await clients();


                    renderClientsTable();

                    renderAllCharts();

                    closeModal();

                    showToast(
                        'Client added successfully!'
                    );

                } catch (error) {

                    console.error(
                        'ADD CLIENT ERROR:',
                        error
                    );


                    showToast(
                        error.message ||
                        'Failed to add client'
                    );
                }
            }
        );


    // ========================================================
    // RENEW CLIENT MODAL
    // ========================================================

    const renewModal =
        document.getElementById(
            'renewClientModal'
        );


    const closeRenewBtn =
        document.getElementById(
            'btnCloseRenewModal'
        );


    const cancelRenewBtn =
        document.getElementById(
            'btnCancelRenewModal'
        );


    window.openRenewModal =
        function (id) {

            const client =
                clientsData.find(
                    c =>
                        String(c.id)
                        === String(id)
                );


            if (!client) {

                showToast(
                    'Client not found'
                );

                return;
            }


            document.getElementById(
                'renewClientId'
            ).value = client.id;


            document.getElementById(
                'renewClientName'
            ).value = client.name;


            document.getElementById(
                'renewStartDate'
            ).valueAsDate = new Date();


            document.getElementById(
                'renewAmount'
            ).value =
                client.amount || 350;


            renewModal.classList.add(
                'active'
            );
        };


    function closeRenewModal() {

        renewModal.classList.remove(
            'active'
        );
    }


    closeRenewBtn.addEventListener(
        'click',
        closeRenewModal
    );


    cancelRenewBtn.addEventListener(
        'click',
        closeRenewModal
    );


    // ========================================================
    // RENEW CLIENT -> SQLITE
    // ========================================================

    document
        .getElementById('renewClientForm')
        .addEventListener(
            'submit',
            async e => {

                e.preventDefault();


                const id =
                    document
                        .getElementById(
                            'renewClientId'
                        )
                        .value;


                const client =
                    clientsData.find(
                        c =>
                            String(c.id)
                            === String(id)
                    );


                if (!client) {

                    showToast(
                        'Client not found'
                    );

                    return;
                }


                const startDateStr =
                    document
                        .getElementById(
                            'renewStartDate'
                        )
                        .value;


                const durationMonths =
                    Number(
                        document
                            .getElementById(
                                'renewDuration'
                            )
                            .value
                    );


                const amount =
                    Number(
                        document
                            .getElementById(
                                'renewAmount'
                            )
                            .value
                    );


                const startDate =
                    new Date(startDateStr);


                const endDate =
                    new Date(startDate);


                endDate.setMonth(
                    endDate.getMonth()
                    + durationMonths
                );


                const targetClient = {

                    id: client.id,

                    start_date:
                        startDateStr,

                    end_date:
                        endDate
                            .toISOString()
                            .split('T')[0],

                    amount,

                    durationMonths
                };


                try {

                    // IMPORTANT:
                    // Your backend endpoint is /ReNew

                    const response =
                        await fetch(
                            '/ReNew',
                            {
                                method: 'PUT',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body:
                                    JSON.stringify(
                                        targetClient
                                    )
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            'Failed to renew membership'
                        );
                    }


                    // Reload from SQLite

                    clientsData =
                        await clients();


                    renderClientsTable();

                    renderAllCharts();

                    closeRenewModal();


                    showToast(
                        `Membership renewed for ${client.name}!`
                    );

                } catch (error) {

                    console.error(
                        'RENEW CLIENT ERROR:',
                        error
                    );


                    showToast(
                        error.message ||
                        'Failed to renew membership'
                    );
                }
            }
        );


    // ========================================================
    // DELETE CLIENT
    // ========================================================

    const deleteModal =
        document.getElementById(
            'deleteConfirmModal'
        );


    const closeDeleteBtn =
        document.getElementById(
            'btnCloseDeleteModal'
        );


    const cancelDeleteBtn =
        document.getElementById(
            'btnCancelDeleteModal'
        );


    const confirmDeleteBtn =
        document.getElementById(
            'btnConfirmDelete'
        );


    let targetDeleteId = null;


    window.openDeleteModal =
        function (id) {

            const client =
                clientsData.find(
                    c =>
                        String(c.id)
                        === String(id)
                );


            if (!client) {

                showToast(
                    'Client not found'
                );

                return;
            }


            targetDeleteId = id;


            const status =
                getClientStatus(
                    client.end_date
                );


            const msgContainer =
                document.getElementById(
                    'deleteModalMessage'
                );


            if (
                status.code === 'ACTIVE' ||
                status.code === 'EXPIRING'
            ) {

                msgContainer.innerHTML = `

                    <div style="
                        background: rgba(244, 63, 94, 0.15);
                        border-left: 4px solid #f43f5e;
                        padding: 12px;
                        border-radius: 8px;
                        color: #fb7185;
                        margin-bottom: 12px;
                        font-weight: 600;
                    ">

                        Warning: Active Member

                    </div>

                    <p>

                        <strong>
                            ${client.name}
                        </strong>

                        currently has an active
                        subscription.

                        Are you sure you want
                        to delete this record?

                    </p>
                `;

            } else {

                msgContainer.innerHTML = `

                    <p>

                        Are you sure you want
                        to delete

                        <strong>
                            ${client.name}
                        </strong>

                        from the system?

                    </p>
                `;
            }


            deleteModal.classList.add(
                'active'
            );
        };


    function closeDeleteModal() {

        deleteModal.classList.remove(
            'active'
        );

        targetDeleteId = null;
    }


    closeDeleteBtn.addEventListener(
        'click',
        closeDeleteModal
    );


    cancelDeleteBtn.addEventListener(
        'click',
        closeDeleteModal
    );


    // ========================================================
    // DELETE CLIENT -> SQLITE
    // ========================================================

    confirmDeleteBtn.addEventListener(
        'click',
        async () => {

            if (!targetDeleteId) {
                return;
            }


            try {

                const response =
                    await fetch(
                        '/deleteClient',
                        {
                            method: 'DELETE',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    id:
                                        Number(
                                            targetDeleteId
                                        )
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        data.error ||
                        'Failed to delete client'
                    );
                }


                // Reload from SQLite

                clientsData =
                    await clients();


                renderClientsTable();

                renderAllCharts();

                closeDeleteModal();


                showToast(
                    'Client record deleted.'
                );

            } catch (error) {

                console.error(
                    'DELETE CLIENT ERROR:',
                    error
                );


                showToast(
                    error.message ||
                    'Failed to delete client'
                );
            }
        }
    );


    // ========================================================
    // SETTINGS -> SQLITE
    // ========================================================

    document
        .getElementById(
            'btnSaveSettings'
        )
        .addEventListener(
            'click',
            async () => {

                const name =
                    document
                        .getElementById(
                            'gymNameInput'
                        )
                        .value
                        .trim();


                if (!name) {

                    showToast(
                        'Please enter a gym name'
                    );

                    return;
                }


                try {

                    const response =
                        await fetch(
                            '/setting',
                            {
                                method: 'PUT',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body:
                                    JSON.stringify({
                                        salle_name:
                                            name
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            'Failed to save settings'
                        );
                    }


                    updateBranding(name);


                    showToast(
                        'Settings saved!'
                    );

                } catch (error) {

                    console.error(
                        'SAVE SETTINGS ERROR:',
                        error
                    );


                    showToast(
                        error.message ||
                        'Failed to save settings'
                    );
                }
            }
        );


    // ========================================================
    // DURATION CHART
    // ========================================================

    const durationCanvas =
        document.getElementById(
            'durationChartCanvas'
        );


    const durationCtx =
        durationCanvas
            ? durationCanvas.getContext('2d')
            : null;


    function renderDurationChart() {

        if (
            !durationCanvas ||
            !durationCtx ||
            !durationCanvas.parentElement
        ) {
            return;
        }


        const width =
            durationCanvas
                .parentElement
                .clientWidth;


        const height =
            durationCanvas
                .parentElement
                .clientHeight;


        if (
            width <= 0 ||
            height <= 0
        ) {
            return;
        }


        const dpr =
            window.devicePixelRatio || 1;


        durationCanvas.width =
            width * dpr;


        durationCanvas.height =
            height * dpr;


        durationCtx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        const labels = [
            '1 Month',
            '3 Months',
            '6 Months',
            '1 Year',
            '2 Years'
        ];


        const counts = [
            0,
            0,
            0,
            0,
            0
        ];


        clientsData.forEach(c => {

            // SQLite uses duration_months

            const m =
                Number(
                    c.duration_months ||
                    c.durationMonths ||
                    1
                );


            if (m <= 1) {

                counts[0]++;

            } else if (m <= 3) {

                counts[1]++;

            } else if (m <= 6) {

                counts[2]++;

            } else if (m <= 12) {

                counts[3]++;

            } else {

                counts[4]++;
            }
        });


        const padding = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 35
        };


        const chartWidth =
            width -
            padding.left -
            padding.right;


        const chartHeight =
            height -
            padding.top -
            padding.bottom;


        const maxVal =
            Math.max(...counts, 5) * 1.2;


        durationCtx.clearRect(
            0,
            0,
            width,
            height
        );


        durationCtx.strokeStyle =
            'rgba(255, 255, 255, 0.05)';


        durationCtx.fillStyle =
            '#6b7280';


        durationCtx.font =
            '11px sans-serif';


        durationCtx.textAlign =
            'right';


        for (
            let i = 0;
            i <= 3;
            i++
        ) {

            const y =
                padding.top +
                (chartHeight / 3) * i;


            const val =
                Math.round(
                    maxVal -
                    (maxVal / 3) * i
                );


            durationCtx.beginPath();

            durationCtx.moveTo(
                padding.left,
                y
            );

            durationCtx.lineTo(
                width -
                padding.right,
                y
            );

            durationCtx.stroke();


            durationCtx.fillText(
                val,
                padding.left - 8,
                y + 4
            );
        }


        const barWidth =
            (chartWidth /
                counts.length) *
            0.5;


        const step =
            chartWidth /
            counts.length;


        counts.forEach(
            (val, i) => {

                const x =
                    padding.left +
                    step * i +
                    (step - barWidth) / 2;


                const barHeight =
                    (val / maxVal) *
                    chartHeight;


                const y =
                    padding.top +
                    chartHeight -
                    barHeight;


                durationCtx.fillStyle =
                    '#ffe6a7';


                durationCtx.beginPath();


                const r =
                    Math.min(
                        6,
                        barHeight
                    );


                durationCtx.moveTo(
                    x,
                    y + barHeight
                );


                durationCtx.lineTo(
                    x,
                    y + r
                );


                durationCtx.quadraticCurveTo(
                    x,
                    y,
                    x + r,
                    y
                );


                durationCtx.lineTo(
                    x +
                    barWidth -
                    r,
                    y
                );


                durationCtx.quadraticCurveTo(
                    x +
                    barWidth,
                    y,
                    x +
                    barWidth,
                    y + r
                );


                durationCtx.lineTo(
                    x +
                    barWidth,
                    y + barHeight
                );


                durationCtx.fill();


                durationCtx.fillStyle =
                    '#9ca3af';


                durationCtx.textAlign =
                    'center';


                durationCtx.fillText(
                    labels[i],
                    x +
                    barWidth / 2,
                    height - 8
                );
            }
        );
    }


    // ========================================================
    // DOUGHNUT CHART
    // ========================================================

    const pieCanvas =
        document.getElementById(
            'doughnutChartCanvas'
        );


    const pieCtx =
        pieCanvas
            ? pieCanvas.getContext('2d')
            : null;


    function renderDoughnutChart() {

        if (
            !pieCanvas ||
            !pieCtx ||
            !pieCanvas.parentElement
        ) {
            return;
        }


        const width =
            pieCanvas
                .parentElement
                .clientWidth;


        const height =
            pieCanvas
                .parentElement
                .clientHeight;


        if (
            width <= 0 ||
            height <= 0
        ) {
            return;
        }


        const dpr =
            window.devicePixelRatio || 1;


        pieCanvas.width =
            width * dpr;


        pieCanvas.height =
            height * dpr;


        pieCtx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        const planCounts = {

            'VIP': 0,

            'Standard': 0,

            'Student Special': 0
        };


        clientsData.forEach(c => {

            if (
                planCounts[c.plan]
                !== undefined
            ) {

                planCounts[c.plan]++;

            } else {

                planCounts['Standard']++;
            }
        });


        const data =
            Object.values(
                planCounts
            );


        const colors = [
            '#a855f7',
            '#3b82f6',
            '#fbbf24'
        ];


        const total =
            data.reduce(
                (a, b) => a + b,
                0
            ) || 1;


        const centerX =
            width / 2;


        const centerY =
            height / 2;


        const radius =
            Math.max(
                0,
                Math.min(
                    centerX,
                    centerY
                ) - 10
            );


        if (radius <= 0) {
            return;
        }


        const innerRadius =
            radius * 0.7;


        let startAngle =
            -Math.PI / 2;


        pieCtx.clearRect(
            0,
            0,
            width,
            height
        );


        data.forEach(
            (val, i) => {

                const sliceAngle =
                    (val / total) *
                    (Math.PI * 2);


                const endAngle =
                    startAngle +
                    sliceAngle;


                pieCtx.beginPath();


                pieCtx.arc(
                    centerX,
                    centerY,
                    radius,
                    startAngle,
                    endAngle
                );


                pieCtx.arc(
                    centerX,
                    centerY,
                    innerRadius,
                    endAngle,
                    startAngle,
                    true
                );


                pieCtx.closePath();


                pieCtx.fillStyle =
                    colors[i];


                pieCtx.fill();


                startAngle =
                    endAngle;
            }
        );
    }


    // ========================================================
    // RENDER EVERYTHING
    // ========================================================

    function renderAllCharts() {

        renderDurationChart();

        renderDoughnutChart();
    }


    // ========================================================
    // INITIAL EXECUTION
    // ========================================================

    renderClientsTable();

    renderAllCharts();


    window.addEventListener(
        'resize',
        renderAllCharts
    );

});