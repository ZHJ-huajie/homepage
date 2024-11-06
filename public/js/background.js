const backgroundManager = {
    currentPage: 1,
    totalPages: 1,

    init() {
        const bgButton = document.getElementById('change-bg');
        if (bgButton) {
            bgButton.addEventListener('click', () => {
                this.showBackgroundModal();
            });
        }
        
        // 初始化时加载背景
        // this.loadActiveBackground();
        
        // 添加背景图切换动画
        // document.body.style.transition = 'background-image 0.5s ease-in-out';
        this.initLoadingState();
        this.initBackgroundTransition();
        this.initDragAndDrop();

        // 检查是否启用必应壁纸
        const settings = JSON.parse(localStorage.getItem('wallpaperSettings') || '{}');
        if (settings.enableBingWallpaper) {
            // 先加载本地缓存的壁纸
            this.loadLocalBingWallpaper();
            // 然后获取新壁纸
            this.fetchBingWallpaper();
        }
    },

    initLoadingState() {
        // 添加全局加载状态元素
        const loadingEl = document.createElement('div');
        loadingEl.className = 'global-loading hidden';
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-text">加载中...</span>
        `;
        document.body.appendChild(loadingEl);
    },

    showLoading(text = '加载中...') {
        const loadingEl = document.querySelector('.global-loading');
        if (loadingEl) {
            loadingEl.querySelector('.loading-text').textContent = text;
            loadingEl.classList.remove('hidden');
        }
    },

    hideLoading() {
        const loadingEl = document.querySelector('.global-loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    },

    async loadActiveBackground() {
        try {
            const response = await fetch('/api/backgrounds/active');
            if (!response.ok) throw new Error('获取背景图失败');
            
            const { background } = await response.json();
            if (background) {
                document.body.style.backgroundImage = `url(${background.file_path})`;
            }
        } catch (error) {
            console.error('加载背景图失败:', error);
        }
    },

    showBackgroundModal() {
        const modal = document.createElement('div');
        modal.className = 'custom-modal background-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>背景图管理</h3>
                    <button class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    <div class="upload-section">
                        <div class="upload-area" id="uploadArea">
                            <svg viewBox="0 0 24 24" width="48" height="48">
                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/>
                            </svg>
                            <p>拖放图片到此处或点击上传</p>
                            <p class="upload-tip">支持 JPG、PNG、GIF，最大10MB</p>
                            <input type="file" id="fileInput" multiple accept="image/*" style="display: none">
                        </div>
                    </div>
                    <div class="background-list">
                        <div class="loading-placeholder">
                            <div class="loading-spinner"></div>
                            <span>加载中...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // 初始化拖放区域
        const uploadArea = modal.querySelector('#uploadArea');
        const fileInput = modal.querySelector('#fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleBatchUpload(Array.from(e.target.files));
            }
        });

        // 拖放处理
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            if (files.length > 0) {
                this.handleBatchUpload(files);
            }
        });

        // 加载背景列表
        this.loadBackgroundList(modal.querySelector('.background-list'));
        
        // 绑定关闭事件
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });
    },

    async loadBackgroundList(container) {
        try {
            const response = await fetch('/api/backgrounds');
            if (!response.ok) throw new Error('获取背景图列表失败');
            
            const { backgrounds } = await response.json();
            
            if (!backgrounds || backgrounds.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>还没有上传任何背景图</p>
                    </div>
                `;
                return;
            }

            // 渲染背景图列表
            container.innerHTML = `${backgrounds.map(bg => this.renderBackgroundItem(bg)).join('')}`;

            // 绑定事件
            this.bindBackgroundEvents(container);

        } catch (error) {
            console.error('加载背景图列表失败:', error);
            container.innerHTML = `
                <div class="error-message">
                    加载失败 
                    <button class="retry-btn" onclick="backgroundManager.loadBackgroundList(this.closest('.background-list'))">
                        重试
                    </button>
                </div>
            `;
        }
    },

    renderBackgroundItem(bg) {
        return `
            <div class="background-item ${bg.is_active ? 'active' : ''} ${bg.type === 1 ? 'default' : ''}" 
                 data-id="${bg.id}">
                <div class="background-preview">
                    <img src="${bg.file_path}" alt="${bg.name}" loading="lazy">
                    <div class="background-overlay">
                        <div class="background-actions">
                            <button class="preview-btn" title="预览">
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                                </svg>
                            </button>
                            <button class="activate-btn ${bg.is_active ? 'active' : ''}" 
                                    title="${bg.is_active ? '当前使用' : '使用此背景'}"
                                    ${bg.is_active ? 'disabled' : ''}>
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
                                </svg>
                                <span>${bg.is_active ? '当前使用' : '使用此背景'}</span>
                            </button>
                            ${bg.type === 1 ? `
                                <span class="default-badge" title="默认背景">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/>
                                    </svg>
                                </span>
                            ` : `
                                <button class="delete-btn" title="删除">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                                    </svg>
                                </button>
                            `}
                        </div>
                        <div class="background-name" title="${bg.name}">
                            ${bg.name}
                            ${bg.type === 1 ? '<span class="default-label">默认</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    bindBackgroundEvents(container) {
        container.querySelectorAll('.background-item').forEach(item => {
            const id = item.dataset.id;
            const isDefault = item.classList.contains('default');
            const imgUrl = item.querySelector('img').src;

            // 预览按钮
            item.querySelector('.preview-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.previewBackground(imgUrl);
            });

            // 激活按钮
            item.querySelector('.activate-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    this.showLoading('正在更换背景...');
                    await this.activateBackground(id);
                    this.hideLoading();
                    this.showSuccess('背景已更换');
                    
                    new SettingsPanel().toggleBingWallpaper(false);
                } catch (error) {
                    this.hideLoading();
                    this.showError('更换背景失败');
                }
            });

            // 删除按钮 - 只为非默认背景添加
            if (!isDefault) {
                item.querySelector('.delete-btn')?.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (await this.confirmDelete()) {
                        try {
                            this.showLoading('正在删除...');
                            await this.deleteBackground(id);
                            this.hideLoading();
                            this.showSuccess('删除成功');
                            await this.loadBackgroundList(container);
                        } catch (error) {
                            this.hideLoading();
                            this.showError('删除失败');
                        }
                    }
                });
            }
        });
    },

    async activateBackground(id) {
        try {
            const response = await fetch(`/api/backgrounds/${id}/activate`, {
                method: 'PUT'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '设置背景图失败');
            }

            const { background } = await response.json();
            if (background && background.file_path) {
                // 更新页面背景
                await this.changeBackground(background.file_path);
                
                // 更新所有背景项的状态
                const allItems = document.querySelectorAll('.background-item');
                allItems.forEach(item => {
                    if (item.dataset.id === id) {
                        item.classList.add('active');
                        // 更新按钮状态
                        const activateBtn = item.querySelector('.activate-btn');
                        if (activateBtn) {
                            activateBtn.innerHTML = `
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
                                </svg>
                                <span>当前使用</span>
                            `;
                            activateBtn.classList.add('active');
                            activateBtn.disabled = true;
                        }
                    } else {
                        item.classList.remove('active');
                        // 重置其他项的按钮状态
                        const activateBtn = item.querySelector('.activate-btn');
                        if (activateBtn) {
                            activateBtn.innerHTML = `
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
                                </svg>
                                <span>使用此背景</span>
                            `;
                            activateBtn.classList.remove('active');
                            activateBtn.disabled = false;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('激活背景图失败:', error);
            throw error;
        }
    },

    async deleteBackground(id) {
        const response = await fetch(`/api/backgrounds/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '删除背景图失败');
        }
    },

    async handleUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // 验证文件
            if (!this.validateFile(file)) return;

            try {
                this.showLoading('上传中...');
                await this.uploadFile(file);
                this.hideLoading();
                
                // 刷新列表
                const listContainer = document.querySelector('.background-list');
                if (listContainer) {
                    this.loadBackgroundList(listContainer);
                }
            } catch (error) {
                this.hideLoading();
                this.showError(error.message || '上传失败，请重试');
            }
        });

        input.click();
    },

    validateFile(file) {
        // 检查文件大小
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showError(`图片大小不能超过${Math.floor(maxSize/1024/1024)}MB`);
            return false;
        }

        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('只支持 JPG、PNG、GIF 格式的图片');
            return false;
        }

        return true;
    },

    async uploadFile(file) {
        try {
            // 创建 FormData
            const formData = new FormData();
            formData.append('name', file.name);
            formData.append('image', file);  // 直接传递文件对象

            const response = await fetch('/api/backgrounds', {
                method: 'POST',
                body: formData  // 不需要设置 Content-Type，浏览器会自动设置
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '上传失败');
            }

            return await response.json();
        } catch (error) {
            console.error('上传错误:', error);
            throw error;
        }
    },

    showError(message) {
        this.showToast(message, 'error');
    },

    showSuccess(message) {
        this.showToast(message, 'success');
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    initBackgroundTransition() {
        // 创建背景过渡层
        const transitionEl = document.createElement('div');
        transitionEl.className = 'background-transition';
        document.body.appendChild(transitionEl);
        this.transitionEl = transitionEl;
    },

    async changeBackground(url) {
        return new Promise((resolve) => {
            // 预加载图片
            const img = new Image();
            img.onload = () => {
                // 开始过渡动画
                this.transitionEl.style.backgroundImage = `url(${url})`;
                this.transitionEl.classList.add('active');
                
                // 等待过渡完成
                setTimeout(() => {
                    document.body.style.backgroundImage = `url(${url})`;
                    this.transitionEl.classList.remove('active');
                    resolve();
                }, 500);
            };
            img.src = url;
        });
    },

    async previewBackground(url) {
        const previewEl = document.createElement('div');
        previewEl.className = 'background-preview-modal';
        previewEl.innerHTML = `
            <div class="preview-content">
                <div class="preview-image" style="background-image: url(${url})"></div>
                <div class="preview-actions">
                    <button class="close-preview">关闭预览</button>
                </div>
            </div>
        `;

        document.body.appendChild(previewEl);
        
        // 绑定关闭事件
        const closeBtn = previewEl.querySelector('.close-preview');
        const closePreview = () => previewEl.remove();
        closeBtn.addEventListener('click', closePreview);
        previewEl.addEventListener('click', (e) => {
            if (e.target === previewEl) closePreview();
        });
    },

    async confirmDelete() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-content">
                    <h3>确认删除</h3>
                    <p>确定要删除这个背景图吗？此操作无法撤销。</p>
                    <div class="confirm-actions">
                        <button class="cancel-btn">取消</button>
                        <button class="confirm-btn">确定删除</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const close = (result) => {
                modal.remove();
                resolve(result);
            };

            modal.querySelector('.cancel-btn').addEventListener('click', () => close(false));
            modal.querySelector('.confirm-btn').addEventListener('click', () => close(true));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) close(false);
            });
        });
    },

    initDragAndDrop() {
        // 全局拖拽上传处理
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 如果背景管理模态框打开，则处理拖拽
            const modal = document.querySelector('.background-modal');
            if (modal) {
                const files = Array.from(e.dataTransfer.files).filter(file => 
                    file.type.startsWith('image/')
                );
                if (files.length > 0) {
                    this.handleBatchUpload(files);
                }
            }
        });
    },

    async handleBatchUpload(files) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validFiles = files.filter(file => file.size <= maxSize);
        
        if (validFiles.length === 0) {
            this.showError('没有符合要求的图片（最大10MB）');
            return;
        }

        if (validFiles.length !== files.length) {
            this.showWarning(`${files.length - validFiles.length}个文件超过大小限制，已跳过`);
        }

        this.showLoading(`正在上传 0/${validFiles.length}`);
        
        try {
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                this.updateLoadingText(`正在上传 ${i + 1}/${validFiles.length}`);
                await this.uploadFile(file);
            }
            
            this.hideLoading();
            this.showSuccess('上传完成');
            
            // 刷新列表
            const listContainer = document.querySelector('.background-list');
            if (listContainer) {
                this.loadBackgroundList(listContainer);
            }
        } catch (error) {
            this.hideLoading();
            this.showError('上传过程中出现错误');
        }
    },

    updateLoadingText(text) {
        const loadingEl = document.querySelector('.global-loading');
        if (loadingEl) {
            loadingEl.querySelector('.loading-text').textContent = text;
        }
    },

    showWarning(message) {
        this.showToast(message, 'warning');
    },

    // 加载本地缓存的必应壁纸
    loadLocalBingWallpaper() {
        try {
            const cachedWallpaper = localStorage.getItem('bingWallpaper');
            if (cachedWallpaper) {
                const data = JSON.parse(cachedWallpaper);
                // 检查缓存是否是今天的
                const today = new Date().toDateString();
                if (data.date === today) {
                    this.changeBackground(data.file_path);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('加载本地壁纸失败:', error);
            return false;
        }
    },

    // 设置自动保存
    setAutoSave(enabled) {
        const settings = JSON.parse(localStorage.getItem('wallpaperSettings') || '{}');
        settings.enableAutoSave = enabled;
        localStorage.setItem('wallpaperSettings', JSON.stringify(settings));

        if (enabled) {
            // 开启自动保存时清除本地缓存
            this.clearLocalBingWallpaper();
            // 重新获取壁纸以保存到数据库
            this.fetchBingWallpaper();
        }
    },

    // 获取必应壁纸
    async fetchBingWallpaper() {
        try {
            // 获取自动保存设置
            const settings = JSON.parse(localStorage.getItem('wallpaperSettings') || '{}');
            const autoSave = settings.enableAutoSave || false;
            
            const response = await fetch(`/api/backgrounds/bing?autoSave=${autoSave}`);
            if (!response.ok) throw new Error('获取必应壁纸失败');
            
            const data = await response.json();
            
            // 检查壁纸是否有变化
            const cachedWallpaper = localStorage.getItem('bingWallpaper');
            const needUpdate = !cachedWallpaper || JSON.parse(cachedWallpaper).file_path !== data.file_path;
            
            if (needUpdate) {
                // 更新背景
                await this.changeBackground(data.file_path);
                
                // 根据自动保存设置决定保存位置
                if (autoSave) {
                    if (data.id) {
                        await this.activateBackground(data.id);
                    }
                } else {
                    this.saveLocalBingWallpaper(data);
                }
            }
            
        } catch (error) {
            console.error('获取必应壁纸失败:', error);
            this.showError('获取必应壁纸失败');
            
            // 如果获取失败且有本地缓存，使用缓存
            if (!this.loadLocalBingWallpaper()) {
                this.showError('无法加载壁纸');
            }
        }
    },

    // 保存必应壁纸到本地缓存
    saveLocalBingWallpaper(data) {
        try {
            const wallpaperData = {
                file_path: data.file_path,
                title: data.title,
                copyright: data.copyright,
                date: new Date().toDateString()
            };
            localStorage.setItem('bingWallpaper', JSON.stringify(wallpaperData));
        } catch (error) {
            console.error('保存壁纸到本地失败:', error);
        }
    },

    // 清除本地缓存的必应壁纸
    clearLocalBingWallpaper() {
        localStorage.removeItem('bingWallpaper');
    },

    // 添加提示消息方法
    showMessage(message, type = 'success') {
        // 如果你有使用toast组件，可以调用它
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(message);
        }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    backgroundManager.init();
}); 