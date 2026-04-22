document.addEventListener('DOMContentLoaded', () => {
    let highestZIndex = 100;

    // Bring window to front
    function bringToFront(windowEl) {
        highestZIndex++;
        windowEl.style.zIndex = highestZIndex;
    }

    // Draggable Logic
    const windows = document.querySelectorAll('.os-window');
    windows.forEach(win => {
        const header = win.querySelector('.window-header');
        if (!header) return;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // Click to focus
        win.addEventListener('mousedown', () => bringToFront(win));

        header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking controls
            if (e.target.classList.contains('control-btn') || e.target.closest('.window-controls')) return;
            
            // Don't drag if maximized
            if (win.classList.contains('maximized')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = win.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            win.style.left = `${initialLeft + dx}px`;
            win.style.top = `${initialTop + dy}px`;
            
            // Remove transform translations so left/top take full effect after initial placement
            win.style.transform = 'none'; 
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });

        // Window Controls
        const btnClose = win.querySelector('.btn-close');
        const btnMin = win.querySelector('.btn-min');
        const btnMax = win.querySelector('.btn-max');

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                win.classList.remove('active');
                win.classList.remove('minimized');
                // Remove indicator from taskbar
                const appId = win.id.replace('window-', '');
                const icon = document.querySelector(`.taskbar-icon[data-target="${appId}"]`);
                if(icon) icon.classList.remove('open');
            });
        }

        if (btnMin) {
            btnMin.addEventListener('click', () => {
                win.classList.add('minimized');
                win.classList.remove('active');
            });
        }

        if (btnMax) {
            btnMax.addEventListener('click', () => {
                win.classList.toggle('maximized');
            });
        }
    });

    // Taskbar Logic
    const taskbarIcons = document.querySelectorAll('.taskbar-icon');
    taskbarIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const targetWin = document.getElementById(`window-${targetId}`);
            
            if (targetWin) {
                // If it's already active and front, minimize it
                if (targetWin.classList.contains('active') && targetWin.style.zIndex == highestZIndex) {
                    targetWin.classList.remove('active');
                    targetWin.classList.add('minimized');
                } else {
                    // Open or restore
                    targetWin.classList.remove('minimized');
                    targetWin.classList.add('active');
                    bringToFront(targetWin);
                    icon.classList.add('open');
                }
            }
        });
    });

    // Fetch Experience Data
    const timelineContainer = document.getElementById('experience-timeline');
    if (timelineContainer) {
        fetch('/data/experience.json')
            .then(res => res.json())
            .then(data => {
                timelineContainer.innerHTML = '';
                
                function createSection(title, items) {
                    const section = document.createElement('div');
                    section.className = 'li-section';
                    
                    const header = document.createElement('h3');
                    header.className = 'li-section-title';
                    header.textContent = title;
                    section.appendChild(header);

                    items.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'li-item';
                        div.innerHTML = `
                            <img src="${item.logoUrl}" class="li-logo" alt="Logo">
                            <div class="li-content">
                                <h4 class="li-title">${item.title}</h4>
                                <p class="li-company">${item.company}</p>
                                <p class="li-date">${item.date}</p>
                                ${item.location ? `<p class="li-location">${item.location}</p>` : ''}
                                ${item.description ? `<p class="li-desc">${item.description}</p>` : ''}
                            </div>
                        `;
                        section.appendChild(div);
                    });
                    
                    return section;
                }

                if (data.experience && data.experience.length > 0) {
                    timelineContainer.appendChild(createSection('Experience', data.experience));
                }
                if (data.education && data.education.length > 0) {
                    timelineContainer.appendChild(createSection('Education', data.education));
                }
            })
            .catch(err => console.error("Failed to load experience data:", err));
    }
});
