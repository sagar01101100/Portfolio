document.addEventListener('DOMContentLoaded', () => {
    let highestZIndex = 100;
    const dockContainer = document.getElementById('dock-container');
    const desktopWindows = document.getElementById('desktop-windows');
    
    // Fetch apps manifest
    fetch('/data/apps.json')
        .then(res => res.json())
        .then(apps => {
            // Check for saved order
            const savedOrderStr = localStorage.getItem('os-taskbar-order');
            if (savedOrderStr) {
                try {
                    const savedOrder = JSON.parse(savedOrderStr);
                    // Sort apps array based on savedOrder
                    apps.sort((a, b) => {
                        let indexA = savedOrder.indexOf(a.id);
                        let indexB = savedOrder.indexOf(b.id);
                        if(indexA === -1) indexA = 999;
                        if(indexB === -1) indexB = 999;
                        return indexA - indexB;
                    });
                } catch(e) {}
            }

            // Generate Taskbar and Windows
            apps.forEach(app => {
                // 1. Taskbar Icon
                const icon = document.createElement('div');
                icon.className = 'taskbar-icon';
                icon.setAttribute('data-target', app.id);
                icon.setAttribute('data-tooltip', app.tooltip);
                icon.setAttribute('draggable', 'true');
                icon.innerHTML = app.icon;
                dockContainer.appendChild(icon);

                // 2. Window Container
                const win = document.createElement('div');
                win.className = 'os-window';
                win.id = `window-${app.id}`;
                if (app.width) win.style.width = `${app.width}px`;
                if (app.height) win.style.height = `${app.height}px`;

                win.innerHTML = `
                    <div class="window-header">
                        <div class="window-controls">
                            <button class="control-btn btn-close"></button>
                            <button class="control-btn btn-min"></button>
                            <button class="control-btn btn-max"></button>
                        </div>
                        <div class="window-title">${app.windowTitle}</div>
                        <div style="width: 44px;"></div>
                    </div>
                    <div class="window-content" id="${app.id}-container"></div>
                `;
                desktopWindows.appendChild(win);
            });

            // Initialize OS mechanics (Dragging, Window Buttons, etc.)
            initOSMechanics();
            
            // Initialize Taskbar Drag & Drop Sorting
            initTaskbarSorting();

            // Load Content
            loadAppContents(apps);

            // Apply global settings
            applySettings();
        })
        .catch(err => console.error("Failed to load apps.json", err));

    function initOSMechanics() {
        // Bring window to front
        window.bringToFront = function(windowEl) {
            highestZIndex++;
            windowEl.style.zIndex = highestZIndex;
        };

        const windows = document.querySelectorAll('.os-window');
        windows.forEach(win => {
            const header = win.querySelector('.window-header');
            if (!header) return;

            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            win.addEventListener('mousedown', () => bringToFront(win));

            header.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('control-btn') || e.target.closest('.window-controls')) return;
                if (win.classList.contains('maximized')) return;

                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = win.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                win.style.left = `${initialLeft + dx}px`;
                win.style.top = `${initialTop + dy}px`;
                win.style.transform = 'none'; 
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.body.style.userSelect = '';
            });

            const btnClose = win.querySelector('.btn-close');
            const btnMin = win.querySelector('.btn-min');
            const btnMax = win.querySelector('.btn-max');

            if (btnClose) {
                btnClose.addEventListener('click', () => {
                    win.classList.remove('active', 'minimized');
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

        const taskbarIcons = document.querySelectorAll('.taskbar-icon');
        taskbarIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const targetId = icon.getAttribute('data-target');
                const targetWin = document.getElementById(`window-${targetId}`);
                
                if (targetWin) {
                    if (targetWin.classList.contains('active') && targetWin.style.zIndex == highestZIndex) {
                        targetWin.classList.remove('active');
                        targetWin.classList.add('minimized');
                    } else {
                        targetWin.classList.remove('minimized');
                        targetWin.classList.add('active');
                        bringToFront(targetWin);
                        icon.classList.add('open');
                    }
                }
            });
        });
    }

    function initTaskbarSorting() {
        const dock = document.getElementById('dock-container');
        let draggedItem = null;

        dock.addEventListener('dragstart', (e) => {
            if(e.target.classList.contains('taskbar-icon')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
                setTimeout(() => e.target.style.opacity = '0.5', 0);
            }
        });

        dock.addEventListener('dragend', (e) => {
            if(e.target.classList.contains('taskbar-icon')) {
                e.target.classList.remove('dragging');
                setTimeout(() => {
                    e.target.style.opacity = '1';
                    draggedItem = null;
                    saveTaskbarOrder();
                }, 0);
            }
        });

        dock.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(dock, e.clientX);
            if (draggedItem) {
                if (afterElement == null) {
                    dock.appendChild(draggedItem);
                } else {
                    dock.insertBefore(draggedItem, afterElement);
                }
            }
        });

        function getDragAfterElement(container, x) {
            const draggableElements = [...container.querySelectorAll('.taskbar-icon:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = x - box.left - box.width / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function saveTaskbarOrder() {
            const icons = [...dock.querySelectorAll('.taskbar-icon')];
            const order = icons.map(icon => icon.getAttribute('data-target'));
            localStorage.setItem('os-taskbar-order', JSON.stringify(order));
        }
    }

    function loadAppContents(apps) {
        apps.forEach(app => {
            const container = document.getElementById(`${app.id}-container`);
            if (!container) return;

            if (app.type === 'experience') {
                fetch('/data/experience.json').then(r=>r.json()).then(data => {
                    let html = `<div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0;">Experience & Education</h2>
                        <a href="#" style="padding: 8px 16px; background: var(--accent-color); color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 0.9rem; transition: background 0.2s; border: 1px solid rgba(255,255,255,0.1);">📄 Resume</a>
                    </div><div class="timeline" style="margin-top: 30px;">`;
                    
                    function createSectionHTML(title, items) {
                        let secHtml = `<div class="li-section"><h3 class="li-section-title">${title}</h3>`;
                        items.forEach(item => {
                            secHtml += `
                                <div class="li-item">
                                    <img src="${item.logoUrl}" class="li-logo" alt="Logo">
                                    <div class="li-content">
                                        <h4 class="li-title">${item.title}</h4>
                                        <p class="li-company">${item.company}</p>
                                        <p class="li-date">${item.date}</p>
                                        ${item.location ? `<p class="li-location">${item.location}</p>` : ''}
                                        ${item.description ? `<p class="li-desc">${item.description}</p>` : ''}
                                    </div>
                                </div>
                            `;
                        });
                        secHtml += `</div>`;
                        return secHtml;
                    }

                    if (data.experience) html += createSectionHTML('Experience', data.experience);
                    if (data.education) html += createSectionHTML('Education', data.education);
                    html += `</div>`;
                    container.innerHTML = html;
                });
            } else if (app.type === 'about') {
                fetch('/data/about.json').then(r=>r.json()).then(data => {
                    let html = `<h1>${data.greeting}</h1>`;
                    data.bioParagraphs.forEach(p => html += `<p>${p}</p>`);
                    html += `<h2 style="margin-top: 30px;">Core Competencies</h2>`;
                    html += `<ul style="color: var(--text-secondary); font-size: 1.1rem; line-height: 1.8;">`;
                    data.competencies.forEach(c => html += `<li>${c}</li>`);
                    html += `</ul>`;
                    container.innerHTML = html;
                });
            } else if (app.type === 'projects') {
                fetch('/data/projects.json').then(r=>r.json()).then(data => {
                    let html = `<h2>Featured Projects</h2><div class="projects-grid" style="margin-top: 20px;">`;
                    data.forEach(proj => {
                        let tagsHtml = proj.tags.map(t => `<span class="tech-tag">${t}</span>`).join('');
                        html += `<div class="project-card">
                            <h3>${proj.title}</h3>
                            <p>${proj.description}</p>
                            <div class="tech-tags">${tagsHtml}</div>
                        </div>`;
                    });
                    html += `</div>`;
                    container.innerHTML = html;
                });
            } else if (app.type === 'tech') {
                fetch('/data/tech.json').then(r=>r.json()).then(data => {
                    let html = `<h2>Technical Arsenal</h2><div style="display: flex; gap: 40px; margin-top: 30px; flex-wrap: wrap;">`;
                    data.forEach(cat => {
                        let listHtml = cat.skills.map(s => `<li>${s}</li>`).join('');
                        html += `<div style="flex: 1; min-width: 200px;">
                            <h3 style="color: var(--accent-color);">${cat.category}</h3>
                            <ul style="list-style: none; padding: 0; line-height: 2;">${listHtml}</ul>
                        </div>`;
                    });
                    html += `</div>`;
                    container.innerHTML = html;
                });
            } else if (app.type === 'html' && app.contentUrl) {
                fetch(app.contentUrl).then(r=>r.text()).then(html => {
                    container.innerHTML = html;
                    if(app.id === 'settings') applySettings(); // Update inputs
                });
            }
        });
    }
});

// Settings Management
window.setTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('os-theme', theme);
};

window.setWallpaper = function(url) {
    if (!url) return;
    document.querySelector('.desktop').style.backgroundImage = `url('${url}')`;
    localStorage.setItem('os-wallpaper', url);
};

window.setFont = function(font) {
    document.documentElement.style.setProperty('--font-family', font);
    localStorage.setItem('os-font', font);
};

function applySettings() {
    const theme = localStorage.getItem('os-theme');
    if (theme) window.setTheme(theme);
    
    const wallpaper = localStorage.getItem('os-wallpaper');
    if (wallpaper) window.setWallpaper(wallpaper);
    
    const font = localStorage.getItem('os-font');
    if (font) {
        window.setFont(font);
        const fontSelector = document.getElementById('font-selector');
        if (fontSelector) fontSelector.value = font;
    }
}
