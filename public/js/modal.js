class Modal {
  constructor() {
    // this.showLinkModal();
    // this.bindEvents();
  }

  updateIconPreview(icon) {
    const preview = this.form.querySelector('.icon-preview');
    if (!icon) {
      preview.innerHTML = '';
      return;
    }

    if (icon.startsWith('http') || icon.startsWith('data:image')) {
      preview.innerHTML = `<img src="${icon}" alt="icon" style="width: 32px; height: 32px;">`;
    } else {
      preview.innerHTML = `<span style="font-size: 32px;">${icon}</span>`;
    }
  }

  async handleSave() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData);
    
    try {
      showLoading();
      
      if (data.id) {
        await customLinks.updateLink(data.id, data);
      } else {
        await customLinks.addLink(data);
      }
      
      this.modal.hide();
      showToast('保存成功');
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
  }

  showLinkModal(linkData = {
    title: '',
    url: '',
    icon: '',
    sort: 999
  }) {
    // 处理 SVG 字符串的转义
    const escapeSvg = (svg) => {
      if (!svg || !svg.startsWith('<svg')) return svg;
      return svg.replace(/"/g, '&quot;');
    };
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${linkData ? '编辑链接' : '添加链接'}</h3>
        <div class="form-group">
          <label for="link-title">标题</label>
          <input type="text" id="link-title" value="${linkData.title}">
        </div>
        <div class="form-group">
          <label for="link-url">URL</label>
          <input type="text" id="link-url" value="${linkData.url}">
        </div>
        <div class="form-group">
          <label for="link-icon">图标 (支持emoji、图片URL、SVG)</label>
          <input type="text" id="link-icon" value="${escapeSvg(linkData.icon)}" 
              placeholder="🔗 或 https://example.com/icon.png 或 <svg>...</svg>">
          <div class="icon-preview"></div>
        </div>
        <div class="form-group">
          <label for="link-sort">排序 (数字越小越靠前)</label>
          <input type="number" id="link-sort" value="${linkData.sort}" min="0" max="999">
        </div>
        <div class="modal-actions">
          <button class="cancel-btn">取消</button>
          <button class="save-btn">保存</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 图标预览功能
    const iconInput = modal.querySelector('#link-icon');
    const iconPreview = modal.querySelector('.icon-preview');

    const updateIconPreview = (value) => {
      if (!value) {
        iconPreview.innerHTML = '🔗';
        return;
      }

      if (value.startsWith('http') || value.startsWith('data:image')) {
        iconPreview.innerHTML = `<img src="${value}" alt="icon">`;
      } else if (value.startsWith('<svg')) {
        // 直接插入SVG
        iconPreview.innerHTML = value;
      } else {
        iconPreview.innerHTML = value;
      }
    };

    iconInput.addEventListener('input', (e) => {
      updateIconPreview(e.target.value);
    });

    // 初始化预览
    if (linkData?.icon) {
      updateIconPreview(linkData.icon);
    } else {
      updateIconPreview('🔗');
    }

    // 绑定按钮事件
    const cancelBtn = modal.querySelector('.cancel-btn');
    const saveBtn = modal.querySelector('.save-btn');

    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });

    saveBtn.addEventListener('click', async () => {
      const title = modal.querySelector('#link-title').value.trim();
      const url = modal.querySelector('#link-url').value.trim();
      const icon = modal.querySelector('#link-icon').value.trim();
      const sort = parseInt(modal.querySelector('#link-sort').value) || 999;

      if (!title || !url) {
        alert('标题和URL不能为空');
        return;
      }

      try {
        if (linkData && linkData.id) {
          await customLinks.updateLink(linkData.id, { title, url, icon, sort });
        } else {
          await customLinks.addLink({ title, url, icon, sort });
        }
        modal.remove();
        window.location.reload();
      } catch (error) {
        console.error('保存链接失败:', error);
        alert('保存失败，请重试');
      }
    });
  }
} 