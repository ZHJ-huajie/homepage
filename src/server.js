const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
let server;

// 中间件
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.json());

// 增加请求体大小限制
app.use(express.json({
  limit: '50mb'  // 增加到50MB
}));

app.use(express.urlencoded({
  limit: '50mb',  // 增加到50MB
  extended: true,
  parameterLimit: 50000
}));

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 路由
app.use('/api/links', require('./routes/links'));
app.use('/api/backgrounds', require('./routes/backgrounds'));

// 首页路由
app.get('/', async (req, res) => {
  try {
    const links = await require('./db').all('SELECT * FROM links ORDER BY sort ASC');
    
    const background = await require('./db').get('SELECT * FROM backgrounds WHERE is_active = 1');
    res.render('home', { links, background });
  } catch (err) {
    console.error('获取链接失败:', err);
    res.status(500).send('服务器错误');
  }
});

// 数据库健康检查
app.get('/health', async (req, res) => {
  try {
    await require('./db').get('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: err.message 
    });
  }
});
// 错误处理中间件
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: '文件太大，请选择小于5MB的图片' });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// 启动服务器前检查数据库连接
async function checkDatabase() {
  try {
    await require('./db').get('SELECT 1');
    console.log('数据库连接正常');
    return true;
  } catch (err) {
    console.error('数据库连接失败:', err);
    return false;
  }
}

// 启动服务器
const PORT = process.env.NODE_ENV === 'production' ? 3003 : 3000;
async function startServer() {
  if (await checkDatabase()) {
    server = app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log('环境:', process.env.NODE_ENV);
      
      if (process.send) {
        process.send('ready');
      }
    });
  } else {
    console.error('无法启动服务器: 数据库连接失败');
    process.exit(1);
  }
}

startServer();

// 监听退出信号
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 优雅退出处理
function gracefulShutdown() {
  console.log('开始优雅退出...');
  
  server.close(async () => {
    try {
      // 关闭数据库连接
      await require('./db').close();
      console.log('服务器已安全关闭');
      process.exit(0);
    } catch (err) {
      console.error('关闭过程出错:', err);
      process.exit(1);
    }
  });

  // 如果 30 秒后还未完成关闭，则强制退出
  setTimeout(() => {
    console.error('无法完成优雅退出，强制关闭');
    process.exit(1);
  }, 30000);
}