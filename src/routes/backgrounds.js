const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../db');
const axios = require('axios'); // 需要先安装: npm install axios

// 配置 multer
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/background');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // 生成文件名: 时间戳-原始文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 添加新背景图
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择图片文件' });
        }

        // 对文件名进行编码处理
        const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        
        // 构建文件的相对路径
        const relativePath = '/background/' + req.file.filename;

        // 保存到数据库
        const result = await db.run(
            'INSERT INTO backgrounds (name, file_path) VALUES (?, ?)',
            [originalName, relativePath]
        );

        // 如果是第一张图片，自动设为活动状态
        const count = await db.get('SELECT COUNT(*) as count FROM backgrounds');
        if (count.count === 1) {
            await db.run('UPDATE backgrounds SET is_active = 1 WHERE id = ?', [result.lastID]);
        }

        res.json({ 
            id: result.lastID, 
            file_path: relativePath,
            name: req.file.originalname
        });
    } catch (err) {
        console.error('添加背景图失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// 获取所有背景图
router.get('/', async (req, res) => {
    try {
        const backgrounds = await db.all('SELECT * FROM backgrounds ORDER BY created_at ASC');
        res.json({ backgrounds });
    } catch (err) {
        console.error('获取背景图失败:', err);
        res.status(500).json({ error: '数据库错误' });
    }
});

// 获取当前激活的背景图
router.get('/active', async (req, res) => {
    try {
        const background = await db.get('SELECT * FROM backgrounds WHERE is_active = 1');
        res.json({ background });
    } catch (err) {
        console.error('获取当前背景图失败:', err);
        res.status(500).json({ error: '数据库错误' });
    }
});

// 删除背景图
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // 检查是否为默认背景
        const background = await db.get('SELECT * FROM backgrounds WHERE id = ?', [id]);
        if (!background) {
            return res.status(500).json({ error: '背景图不存在' });
        }
        
        if (background.type === 1) {
            return res.status(500).json({ error: '默认背景不能删除' });
        }

        // 如果是当前激活的背景，则切换到默认背景
        if (background.is_active) {
            await db.run('UPDATE backgrounds SET is_active = 1 WHERE type = 1');
        }

        // 删除文件和数据库记录
        await fs.unlink(path.join(__dirname, '../../public', background.file_path));
        await db.run('DELETE FROM backgrounds WHERE id = ?', [id]);

        res.json({ success: true });
    } catch (err) {
        console.error('删除背景图失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// 更新背景图信息
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    try {
        await db.run('UPDATE backgrounds SET name = ? WHERE id = ?', [name, id]);
        res.json({ success: true });
    } catch (err) {
        console.error('更新背景图失败:', err);
        res.status(500).json({ error: '数据库错误' });
    }
});

// 激活背景图
router.put('/:id/activate', async (req, res) => {
    const { id } = req.params;
    
    try {
        // 先取消所有背景图的激活状态
        await db.run('UPDATE backgrounds SET is_active = 0');
        
        // 激活选中的背景图
        await db.run('UPDATE backgrounds SET is_active = 1 WHERE id = ?', [id]);
        
        // 获取更新后的背景图信息
        const background = await db.get('SELECT * FROM backgrounds WHERE id = ?', [id]);
        
        res.json({ success: true, background });
    } catch (err) {
        console.error('激活背景图失败:', err);
        res.status(500).json({ error: '数据库错误' });
    }
});

// 获取必应壁纸
router.get('/bing', async (req, res) => {
    try {
        const { autoSave } = req.query; // 获取是否自动保存的参数
        
        const response = await axios.get('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1');
        const image = response.data.images[0];
        
        const imageUrl = `https://www.bing.com${image.url}`;
        console.log(imageUrl);
        
        // 检查是否已存在相同的必应壁纸
        const existingBackground = await db.get(
            'SELECT * FROM backgrounds WHERE file_path = ? OR name = ? AND type = 2',
            [imageUrl, `Bing - ${image.title}`]
        );
        console.log(existingBackground);
        let background;
        if (existingBackground) {
            // 如果已存在，返回现有记录
            background = existingBackground;
        } else if (autoSave === 'true') {
            // 只有在开启自动保存且图片不存在时才保存
            try {
                const imageResponse = await axios({
                    method: 'get',
                    url: imageUrl,
                    responseType: 'arraybuffer'
                });

                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileName = `bing-${uniqueSuffix}.jpg`;
                const uploadDir = path.join(__dirname, '../../public/background');
                const filePath = path.join(uploadDir, fileName);

                await fs.mkdir(uploadDir, { recursive: true });
                await fs.writeFile(filePath, imageResponse.data);

                const relativePath = '/background/' + fileName;
                const result = await db.run(
                    'INSERT INTO backgrounds (name, file_path, type) VALUES (?, ?, ?)',
                    [`Bing - ${image.title}`, relativePath, 2]
                );

                background = {
                    id: result.lastID,
                    name: `Bing - ${image.title}`,
                    file_path: relativePath
                };
            } catch (error) {
                console.error('保存必应壁纸失败:', error);
                // 如果保存失败，仍然返回原始必应图片URL
                background = {
                    name: `Bing - ${image.title}`,
                    file_path: imageUrl
                };
            }
        } else {
            // 不保存时直接使用必应的URL
            background = {
                name: `Bing - ${image.title}`,
                file_path: imageUrl
            };
        }

        res.json({
            file_path: background.file_path,
            title: background.name,
            copyright: image.copyright,
            id: background.id,
            isSaved: !!background.id // 添加标识是否已保存到数据库
        });
    } catch (error) {
        console.error('获取必应壁纸失败:', error);
        res.status(500).json({ error: '获取必应壁纸失败' });
    }
});

// 获取背景图详情
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const background = await db.get('SELECT * FROM backgrounds WHERE id = ?', [id]);
        if (!background) {
            return res.status(500).json({ error: '背景图不存在' });
        }
        res.json({ background });
    } catch (err) {
        console.error('获取背景图失败:', err);
        res.status(500).json({ error: '数据库错误' });
    }
});

module.exports = router; 