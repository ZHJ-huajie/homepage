const localBackgroundManager = {
    init() {
        this.loadLocalBackground();
        this.bindEvents();
    },

    loadLocalBackground() {
        const background = localStorage.getItem('currentBackground');
        if(background) {
            document.body.style.backgroundImage = `url(${background})`;
        }
    },

    // 处理本地图片上传
    handleLocalImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            localStorage.setItem('currentBackground', imageData);
            document.body.style.backgroundImage = `url(${imageData})`;
        };
        reader.readAsDataURL(file);
    },

    bindEvents() {
        const changeBgBtn = document.getElementById('change-bg');
        if(changeBgBtn) {
            changeBgBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if(file) {
                        this.handleLocalImage(file);
                    }
                };
                input.click();
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    customLinks.init();
    localBackgroundManager.init();
});