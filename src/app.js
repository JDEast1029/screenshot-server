const Koa = require('koa');
const app = new Koa();
const ScreenShotServer = require('./screenshot-server');
const server = new ScreenShotServer();

server.init();

app.use( async ( ctx, next ) => {    //调用koa2的use方法来创建一个上下文  
	console.log(ctx.request.url);
	if (ctx.request.path === '/') {
		console.log('自定部署成功');
		let buffer = await server.screenshot2Buffer(ctx.query);
		ctx.body = buffer;
	} else {
		await next();
	}
});

app.use(async (ctx, next) => {
	if (ctx.request.path === '/get-img-url') {
		let response = await server.screenshot2Url(ctx.query);
		ctx.body = response;
	} else {
		await next();
	}
});

app.listen(3000);


// 没有捕获到的Reject
process.on('unhandledRejection', (reason, promise) => {
	process.exit();
});
process.on('uncaughtException', (err, origin) => {
	process.exit();
});
process.on('SIGINT', process.exit);