const Koa = require('koa');
const app = new Koa();
const ScreenShotServer = require('./screenshot-server');
const server = new ScreenShotServer();

server.init();

app.use( async ( ctx ) => {    //调用koa2的use方法来创建一个上下文  
	let buffer = await server.screenshot(ctx.query)
	ctx.body = buffer
})

app.listen(3000);


// 没有捕获到的Reject
process.on('unhandledRejection', (reason, promise) => {
	process.exit();
});
process.on('uncaughtException', (err, origin) => {
	process.exit();
});
process.on('SIGINT', process.exit);