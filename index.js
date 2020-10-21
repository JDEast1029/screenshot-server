const ScreenshotServer = require('./src/screenshot-server');
const server = new ScreenshotServer();
server.init();
const showMem = () => {
    const mem = process.memoryUsage();
    const format = (bytes) => {
        return (bytes/1024/1024).toFixed(2)+'MB';
    };
    console.log('Process1: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
};
// let timer = setInterval(() => {
// 	showMem()
// }, 1000);
setTimeout(() => {
	let count = 1;
	let timer = setInterval(async () => {
		const urls = [
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
			'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158',
		];
		// await urls.reduce((sequence, url, idx) => {
		// 	return sequence.then(() => {
		// 		return server.screenshot({url, output: `./example${idx + 1}.png`});
		// 	});
		// }, Promise.resolve())
		// for (let i = 0; i < urls.length; i++) {
			let i = Math.floor(Math.random() * 16)
			server.screenshot({
				url: urls[i],
				output: `./example${i + 1}.png`
			})
		// }

		count++;
		console.log(count);
		if (count > 50) {
			clearInterval(timer)
		}
		
	}, 1000);
}, 5000);
