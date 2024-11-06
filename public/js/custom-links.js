const customLinks = {
  /**
   * 初始化
   */
  async init() {
    // 绑定设置面板
    new SettingsPanel();
    
    // 绑定链接操作事件
    this.bindLinkEvents();
  },

  /**
   * 绑定链接操作事件
   */
  bindLinkEvents() {
    const linksList = document.querySelector('.links-list');
    if (!linksList) return;

    // 编辑按钮点击事件
    linksList.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');
      
      if (editBtn) {
        const linkItem = editBtn.closest('.links-item');
        const linkId = linkItem.dataset.id;
        try {
          const response = await fetch(`/api/links/${linkId}`);
          if (!response.ok) {
            throw new Error('获取链接数据失败');
          }
          const linkData = await response.json();
          new Modal().showLinkModal(linkData);
        } catch (err) {
          console.error('获取链接数据失败:', err);
          showToast('获取链接数据失败', 'error');
        }
      }
      
      if (deleteBtn) {
        const linkItem = deleteBtn.closest('.links-item');
        const linkId = linkItem.dataset.id;
        if (confirm('确定要删除这个链接吗？')) {
          try {
            await this.deleteLink(linkId);
            showToast('删除成功');
            linkItem.remove();
          } catch (err) {
            console.error('删除链接失败:', err);
            showToast('删除失败', 'error');
          }
        }
      }
    });
  },

  /**
   * 添加新链接
   */
  async addLink(linkData) {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
      });

      if (!response.ok) {
        throw new Error('添加链接失败');
      }

      showToast('添加成功');
      window.location.reload();
    } catch (error) {
      console.error('添加链接失败:', error);
      showToast('添加失败', 'error');
      throw error;
    }
  },

  /**
   * 更新链接
   */
  async updateLink(id, linkData) {
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
      });

      if (!response.ok) {
        throw new Error('更新链接失败');
      }

      showToast('更新成功');
      window.location.reload();
    } catch (error) {
      console.error('更新链接失败:', error);
      showToast('更新失败', 'error');
      throw error;
    }
  },

  /**
   * 删除链接
   */
  async deleteLink(id) {
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除链接失败');
      }
    } catch (error) {
      console.error('删除链接失败:', error);
      throw error;
    }
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  customLinks.init();
});
