const Koa = require('koa');
const app = new Koa();
const createHandler = require("github-webhook-handler");


app.use(async (ctx, next) => {    //调用koa2的use方法来创建一个上下文  
	if (ctx.request.path === '/webhook') {
		console.log(ctx);
	} else {
		await next();
	}
});

app.listen(8081);


// 没有捕获到的Reject
process.on('unhandledRejection', (reason, promise) => {
	process.exit();
});
process.on('uncaughtException', (err, origin) => {
	process.exit();
});
process.on('SIGINT', process.exit);