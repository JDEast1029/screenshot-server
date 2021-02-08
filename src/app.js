const EventEmitter = require('events');
const Koa = require('koa');
const ScreenShotServer = require('./screenshot-server');

const app = new Koa();
const server = new ScreenShotServer();
const emitter = new EventEmitter();

// emitter.setMaxListeners(100);
server.init();

app.use( async ( ctx, next ) => {    //调用koa2的use方法来创建一个上下文  
	console.log(ctx.request.url);
	// console.log(ctx);
	if (ctx.request.path === '/') {
		ctx.response.status = 200;
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
	console.log('reason', reason);
	process.exit();
});
process.on('uncaughtException', (err, origin) => {
	console.log('err', err);
	process.exit();
});
process.on('SIGINT', process.exit);