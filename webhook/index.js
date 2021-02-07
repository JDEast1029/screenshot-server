const Koa = require('koa');
const app = new Koa();
const child_process = require('child_process'); 
// const createHandler = require("github-webhook-handler");


app.use(async (ctx, next) => {    //调用koa2的use方法来创建一个上下文  
	if (ctx.request.path === '/webhook') {
		// console.log(ctx);
		// TODO:校验秘钥
		// if (!ctx.request.header['x-hub-signature']) {
		// 	console.log('错误：webhook secret在github未配置或者获取签名失败');
		// }
		console.log('hook....');
		try {
			child_process.execFile('./script.sh')
		} catch (error) {
			console.log('error', error);
		}
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