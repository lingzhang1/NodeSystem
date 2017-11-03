/*
  express服务器文件

 */

'use strict'
  
let PORT  =process.env.PORT;

const express = require('express');
const orm  =require('orm');

// global.orm = orm;  //为了在其他控制器中使用orm.like orm.gt 而在这里加入到全局变量中

let app = express();

//导入body-parser实现获取请求报文体的数据
const bodyParser = require('body-parser')
app.use(bodyParser());  // 将bodyParser作为第三方包加载到express框架中(express的中间件)

//导入express-session包：用来存放专门术语某个浏览器的数据
const session = require('express-session');
app.use(session({
  secret: 'cz02', //安全密码,这个可以随意更改
  resave: false,
  saveUninitialized: true
}));

//0.0 链接mysql数据库同时初始化所有的表的模型
app.use(orm.express("mysql://root:@127.0.0.1:3306/nodesystem", {
    define: function (db, models, next) {
    	// 在这个地方如果只需要调用一次代码即可全部初始化好就好了
     	//models:没有表的模型的，但是有默认的增，删，查，改方法
     	//db :数据库连接对象,可以直接执行sql语句

        let modelObj =  require('./model/initModels.js');
        modelObj(db,models);

        next();
    }
}));

//1.0 设置当前项目的模板引擎为xtpl
let xtpl = require('xtpl');
app.set('views',__dirname+'/views'); //将来xtpl模板引擎自动去views文件夹中查找所有的模板文件
app.set('view engine', 'html'); //将我们的xtpl扩展名称改成html结尾的模板
//将来碰到html结尾的模板请自动使用xtpl.reanderFile去解析
//将来在这个系统中解析模板的写法改变为：res.render('模板路径',传入的对象,(err,content)=>{})
app.engine('html',xtpl.renderFile);


//2.0 设置静态资源
app.use(express.static(__dirname+'/statics'));

//1.0 区分逻辑块
//-> account/*  -> accountRoute
//-> admin/* -> adminRoute

//1.0 导入路由包
let accountRoute = require('./routes/accountRoute.js');
let adminRoute = require('./routes/adminRoute.js');

app.all('/account/*',(req,res,next)=>{
	res.setHeader('Content-Type','text/html;charset=utf8');
	next();
});
 
app.all('/admin/*',(req,res,next)=>{
	res.setHeader('Content-Type','text/html;charset=utf8');
	//统一判断是否有登录
	// if(!req.session.logined)
	// {
	// 	res.end('<script>alert("您未登录");window.location="/account/login";</script>');
	// 	return;
	// }

	next();
});

app.use('/account',accountRoute);
app.use('/admin',adminRoute);

//在这里统一设定api下面的所有请求都是可以允许跨域的
app.all('/api/*',(req,res,next)=>{
	//设置跨域请求
	res.header("Access-Control-Allow-Origin", "*");  
    res.header("Access-Control-Allow-Headers", "X-Requested-With");  
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    
	next();
});

const apiRoute = require('./routes/apiRoute.js');
app.use('/api',apiRoute);

const ueditor = require("ueditor");
const path = require('path');
//加载富文本编辑器的路由
app.use("/ueditor/ue", ueditor(path.join(__dirname, 'statics'), function (req, res, next) {
    // ueditor 客户发起上传图片请求
    if (req.query.action === 'uploadimage') {
        var foo = req.ueditor;

        var imgname = req.ueditor.filename;

        var img_url = '/images/ueditor/';
        res.ue_up(img_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');//IE8下载需要设置返回头尾text/html 不然json返回文件会被直接下载打开
    }
    //  客户端发起图片列表请求
    else if (req.query.action === 'listimage') {
        var dir_url = '/images/ueditor/';
        res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
    else {
        // console.log('config.json')
        res.setHeader('Content-Type', 'application/json');
        //url的跳转
        res.redirect('/ueditor/nodejs/config.json');
    }
}));


app.listen(PORT,()=>{

	console.log('环境已经启动'+PORT);
});

