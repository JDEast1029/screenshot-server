const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const iPhone = puppeteer.devices['iPhone 8'];
const gm = require('gm');
let url = 'https://is-wap.wyawds.com/is/skin/report/pc-preview?merchant_id=172&system_id=10832&project_report_id=158'
// let url = 'https://juejin.im/post/6844903830816030728'

const IMAGE_HEIGHT = 3000; // 最大截图高度

const showMem = () => {
    const mem = process.memoryUsage();
    const format = (bytes) => {
        return (bytes/1024/1024).toFixed(2)+'MB';
    };
    console.log('Process1: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
};
let timer = setInterval(() => {
	showMem()
}, 1000);
let screenShot = async () => {
	const browser = await puppeteer.launch({
		args: [
			'–disable-gpu',  // GPU硬件加速
			'–disable-dev-shm-usage', // 创建临时文件共享内存
			'–disable-setuid-sandbox', // uid沙盒
			'–no-first-run', // 没有设置首页。在启动的时候，就会打开一个空白页面。
			'–no-sandbox', // 沙盒模式
			'–no-zygote',
			'–single-process', // 单进程运行
		]
	});
	const page = await browser.newPage();
	await page.emulate(iPhone);
	await page.goto(url, {
		waitUntil: 'networkidle0'
	});

	let poster = await page.$('.js-puppeteer');
	if (poster) {
		let { x, y, width, height } = await poster.boundingBox();
		console.log(x, y, width, height);

		if (height > IMAGE_HEIGHT) {
			let imgsPath = [];
			let imgsCount = Math.ceil(height / IMAGE_HEIGHT);
			let uuid = new Date().getTime();
			let holdDir = `./${uuid}`;
			if (!fs.existsSync(holdDir)) {
				fs.mkdir(holdDir);
			}
			for (let i = 0; i < imgsCount; i++) {
				let holdImgPath = `${holdDir}/img-${i + 1}.png`;
				let leftHeight = height - i * IMAGE_HEIGHT;
				await poster.screenshot({
					path: holdImgPath,
					clip: {
						x: 0,
						y: i * IMAGE_HEIGHT,
						width,
						height: leftHeight > IMAGE_HEIGHT ? IMAGE_HEIGHT : leftHeight
					}
				}).then(res => {
					imgsPath.push(holdImgPath)
				}).catch(err => {
					console.log('截图失败！', err);
				})
			}
				
			await new Promise((resolve, reject) => { 
				gm(imgsPath.shift()).append(...imgsPath).write('./example.png', (err) => {
					if (err) {
						console.log('截图合并失败！')
						reject(err)
					} else {
						console.log('完整截图生成成功！');
						resolve('完整截图生成成功！');
					}
					if (fs.existsSync(holdDir)) {
						fs.remove(holdDir);	
					}
				})
			});
		} else {
			await poster.screenshot({
				path: 'example.png'
			})
		}
	}
	await browser.close();
	clearInterval(timer)
};

try {
	screenShot();
} catch(err) {
	console.log(err);
}

