const express = require('express');
const router = express.Router();
const db = require('../db');

// 验证链接数据
function validateLink(data) {
  const errors = [];
  
  if (!data.title?.trim()) {
    errors.push('标题不能为空');
  }
  
  if (!data.url?.trim()) {
    errors.push('URL不能为空');
  } else {
    try {
      new URL(data.url);
    } catch {
      errors.push('URL格式不正确');
    }
  }
  
  return errors;
}

// 获取所有链接
router.get('/', async (req, res) => {
  try {
    const links = await db.all('SELECT * FROM links ORDER BY sort ASC');
    res.json({ links });
  } catch (err) {
    console.error('获取链接失败:', err);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 添加新链接
router.post('/', async (req, res) => {
  const { title, url, icon, sort } = req.body;
  
  try {
    const result = await db.run(
      'INSERT INTO links (title, url, icon, sort) VALUES (?, ?, ?, ?)',
      [title, url, icon || null, sort || 999]
    );
    res.json({ id: result.lastID });
  } catch (err) {
    console.error('添加链接失败:', err);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 更新链接
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, url, icon, sort } = req.body;
  
  try {
    await db.run(
      'UPDATE links SET title = ?, url = ?, icon = ?, sort = ? WHERE id = ?',
      [title, url, icon || null, sort || 999, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('更新链接失败:', err);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 删除链接
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.run('DELETE FROM links WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('删除链接失败:', err);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 获取单个链接
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const link = await db.get('SELECT * FROM links WHERE id = ?', [id]);
    if (!link) {
      return res.status(404).json({ error: '链接不存在' });
    }
    res.json(link);
  } catch (err) {
    console.error('获取链接失败:', err);
    res.status(500).json({ error: '数据库错误' });
  }
});

module.exports = router;