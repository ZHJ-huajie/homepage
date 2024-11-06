class SettingsPanel {
    autoSaveToggle = null;
    bingWallpaperToggle = null;
    constructor() {
        this.init();
        this.loadSettings();
    }

    init() {
        this.panel = document.querySelector('.settings-panel');
        if (!this.panel) {
            console.error('未找到设置面板元素 .settings-panel');
            return;
        }

        this.trigger = this.panel.querySelector('.settings-trigger');
        if (!this.trigger) {
            console.error('未找到触发按钮 .settings-trigger');
            return;
        }

        this.menu = this.panel.querySelector('.settings-menu');
        if (!this.menu) {
            console.error('未找到菜单 .settings-menu');
            return;
        }

        this.addLinkBtn = document.getElementById('add-link');
        this.editModeToggle = document.getElementById('editModeToggle');

        
        this.bingWallpaperToggle = document.getElementById('bingWallpaperToggle');
        // 不在这里初始化 autoSaveToggle，而是根据必应壁纸开关状态动态创建

        this.bindEvents();
    }

    loadSettings() {
        // 从localStorage加载设置
        const settings = JSON.parse(localStorage.getItem('wallpaperSettings') || '{}');
        if (this.bingWallpaperToggle) {
            this.bingWallpaperToggle.checked = settings.enableBingWallpaper || false;
            // 根据必应壁纸开关状态初始化自动保存开关
            if (settings.enableBingWallpaper) {
                this.createAutoSaveToggle(settings.enableAutoSave || false);
            }
        }
    }

    createAutoSaveToggle(checked = false) {
        // 先移除可能存在的旧开关
        this.removeAutoSaveToggle();

        // 创建新的自动保存开关
        const autoSaveWrapper = document.createElement('label');
        autoSaveWrapper.className = 'edit-mode-switch settings-item';
        autoSaveWrapper.id = 'autoSaveWrapper';
        autoSaveWrapper.innerHTML = `
            <input type="checkbox" id="autoSaveToggle" ${checked ? 'checked' : ''}>
            <span class="slider"></span>
            自动保存壁纸
        `;

        // 插入到必应壁纸开关前面
        const bingToggleItem = this.bingWallpaperToggle.closest('.settings-item');
        bingToggleItem.insertAdjacentElement('beforebegin', autoSaveWrapper);

        // 更新引用并绑定事件
        this.autoSaveToggle = document.getElementById('autoSaveToggle');
        if (this.autoSaveToggle) {
            this.autoSaveToggle.onchange = (e) => {
                const enabled = e.target.checked;
                this.saveSettings();
                backgroundManager.setAutoSave(enabled);
            };
        }
    }

    removeAutoSaveToggle() {
        const wrapper = document.getElementById('autoSaveWrapper');
        if (wrapper) {
            wrapper.remove();
        }
        this.autoSaveToggle = null;
    }

    saveSettings() {
        const settings = {
            enableBingWallpaper: this.bingWallpaperToggle?.checked || false,
            enableAutoSave: this.autoSaveToggle?.checked || false
        };
        localStorage.setItem('wallpaperSettings', JSON.stringify(settings));
    }
    bindEvents() {
        this.trigger.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePanel();
        };

        this.menu.onclick = (e) => {
            e.stopPropagation();
        };

        document.onclick = (e) => {
            if (!this.panel.contains(e.target)) {
                this.closePanel();
            }
        };

        document.onkeydown = (e) => {
            if (e.key === 'Escape') {
                this.closePanel();
            }
        };

        if (this.addLinkBtn) {
            this.addLinkBtn.onclick = () => {
                new Modal().showLinkModal();
                this.closePanel();
            };
        }

        if (this.editModeToggle) {
            this.editModeToggle.onchange = (e) => {
                const isEditMode = e.target.checked;
                document.body.classList.toggle('edit-mode', isEditMode);
                this.toggleEditMode(isEditMode);
            };
        }

        if (this.bingWallpaperToggle) {
            this.bingWallpaperToggle.onchange = (e) => {
                const enabled = e.target.checked;
                if (enabled) {
                    // 创建自动保存开关
                    this.createAutoSaveToggle();
                    // 获取必应壁纸
                    backgroundManager.fetchBingWallpaper();
                } else {
                    // 移除自动保存开关
                    this.removeAutoSaveToggle();
                    // 清除本地缓存
                    backgroundManager.clearLocalBingWallpaper();
                    // 刷新页面
                    window.location.reload();
                }
                this.saveSettings();
            };
        }

        if (this.autoSaveToggle) {
            this.autoSaveToggle.onchange = (e) => {
                const enabled = e.target.checked;
                this.saveSettings();
                backgroundManager.setAutoSave(enabled);
                if (enabled) {
                    // 开启自动保存时清除本地缓存
                    backgroundManager.clearLocalBingWallpaper();
                }
            };
        }
    }

    togglePanel() {
        if (!this.panel) return;
        const isActive = this.panel.classList.contains('active');
        
        if (isActive) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    closePanel() {
        if (!this.panel) return;
        this.panel.classList.remove('active');
    }

    openPanel() {
        if (!this.panel) return;
        this.panel.classList.add('active');
    }

    toggleBingWallpaper(enabled) {
        this.bingWallpaperToggle.checked = enabled;
        this.autoSaveToggle.remove();
        this.saveSettings();
    }

    toggleAutoSave(enabled) {
        this.autoSaveToggle.checked = enabled;
        this.saveSettings();
    }

    toggleEditMode(enabled) {
        const linksList = document.querySelector('.links-list');
        if (!linksList) return;

        const linkItems = linksList.querySelectorAll('.links-item');
        linkItems.forEach(item => {
            const actions = item.querySelector('.link-actions');
            if (actions) {
                if (enabled) {
                    actions.style.display = 'flex';
                    setTimeout(() => {
                        actions.style.opacity = '1';
                    }, 0);
                } else {
                    actions.style.opacity = '0';
                    setTimeout(() => {
                        actions.style.display = 'none';
                    }, 300);
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsPanel = new SettingsPanel();
}); 