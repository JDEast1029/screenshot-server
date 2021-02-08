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
		ctx.response.status = 200;
		child_process.exec('git pull', function (err,stdout, stderr){
			if(err) {
				ctx.response.status = 500;
				console.log('Git pull error: ' + stderr);
				ctx.body = 'Git pull error: ' + stderr;
			} else {
				// 这个stdout的内容就是shell结果
				console.log('Git pull done. ' + stdout);
				ctx.body = 'Git pull done. ' + stdout;
			}
		})
	} else {
		await next();
	}
});

app.listen(8081);


// 没有捕获到的Reject
// process.on('unhandledRejection', (reason, promise) => {
// 	process.exit();
// });
// process.on('uncaughtException', (err, origin) => {
// 	process.exit();
// });
// process.on('SIGINT', process.exit);