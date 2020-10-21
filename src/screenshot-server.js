const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const gm = require('gm');

const IMAGE_HEIGHT = 3000; // 最大截图高度
const MAX_WSE = 4; // 启动几个浏览器 
const iPhone = puppeteer.devices['iPhone 8'];
const WSE_LIST = []; //存储browserWSEndpoint列表
/**
 * 截图
 */
class ScreenshotServer {
	constructor(props) {
	}

	async init() {
		for (let i = 0; i < MAX_WSE; i++) {
			const browser = await puppeteer.launch({
				headless: false,
				args: [
					'–disable-gpu',  // GPU硬件加速
					'–disable-dev-shm-usage', // 创建临时文件共享内存
					'–disable-setuid-sandbox', // uid沙盒
					'–no-first-run', // 没有设置首页。在启动的时候，就会打开一个空白页面。
					'–no-sandbox', // 沙盒模式
					'–single-process', // 单进程运行
					'--disable-extensions', // 扩展程序
				]
			});
			let browserWSEndpoint = await browser.wsEndpoint();
			WSE_LIST[i] = browserWSEndpoint;
		}
	}

	async screenshot(opts) {
		const { url, output } = opts || {};
		const tmp = Math.floor(Math.random() * MAX_WSE);
		let browserWSEndpoint = WSE_LIST[tmp];
		if (!browserWSEndpoint) return;

		const browser = await puppeteer.connect({browserWSEndpoint});
		const page = await browser.newPage();
		await page.emulate(iPhone);
		await page.goto(url, {
			waitUntil: 'networkidle0'
		});

		console.log(browser.targets());
		let poster = await page.$('.js-puppeteer');
		let { x, y, width, height } = await poster.boundingBox();

		if (height > IMAGE_HEIGHT) {
			await this.longScreenshot(poster, { x, y, width, height, output });
		} else {
			await poster.screenshot({
				path: output
			})
		}
		await page.close();
	}

	async longScreenshot(poster, { x, y, width, height, output }) {
		let imgsTmp = []; // 截图片段暂存路径
		let count = Math.ceil(height / IMAGE_HEIGHT); // 截成几段
		let holdDir = `./${new Date().getTime()}`;
		if (!fs.existsSync(holdDir)) {
			fs.mkdir(holdDir);
		}
		for (let i = 0; i < count; i++) {
			let imgPath = `${holdDir}/img-${i + 1}.png`;
			let leftHeight = height - i * IMAGE_HEIGHT;
			await poster.screenshot({
				path: imgPath,
				clip: {
					x: x,
					y: y + i * IMAGE_HEIGHT,
					width,
					height: leftHeight > IMAGE_HEIGHT ? IMAGE_HEIGHT : leftHeight
				}
			}).then(res => {
				imgsTmp.push(imgPath)
			}).catch(err => {
				console.log('截图失败！', err);
			})
		}
			
		await new Promise((resolve, reject) => { 
			gm(imgsTmp.shift()).append(...imgsTmp).write(output, (err) => {
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
	}
}

module.exports = ScreenshotServer;