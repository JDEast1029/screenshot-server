const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const gm = require('gm');

const IMAGE_HEIGHT = 3000; // 最大截图高度
const MAX_WSE = 2; // 启动几个浏览器 
const iPhone = puppeteer.devices['iPhone 8'];
const THIRTY_MINUTES = 30 * 60 * 1000; // 30分钟；
const ONE_MINUTES = 1 * 60 * 1000; // 1分钟

let BROWSER_LIST = []; //存储browser列表
let uuid = 0;

/**
 * 截图
 */
class ScreenshotServer {
	constructor(props) {
	}

	async init() {
		for (let i = 0; i < MAX_WSE; i++) {
			let browserInstance = await this.createBrowserInstance();
			BROWSER_LIST[i] = browserInstance;
		}

		this.refreshTimer = setTimeout(() => this.refreshBrowser(), THIRTY_MINUTES);
	}

	async createBrowserInstance() {
		const browser = await puppeteer.launch({
			args: [
				'--disable-gpu',  // GPU硬件加速
				'--disable-dev-shm-usage', // 创建临时文件共享内存
				'--disable-setuid-sandbox', // uid沙盒
				'--no-first-run', // 没有设置首页。在启动的时候，就会打开一个空白页面。
				'--no-sandbox', // 沙盒模式
				'--single-process', // 单进程运行
				'--disable-extensions', // 扩展程序
			]
		});
		return await browser.wsEndpoint();
	}

	/**重启浏览器 */
	refreshBrowser() {
		clearTimeout(this.refreshTimer);

		for (let i = 0; i < BROWSER_LIST.length; i++) {
			const browserInstance = BROWSER_LIST[i];
			this.replaceBrowserInstance(browserInstance);
		}
		BROWSER_LIST = [];

		this.refreshTimer = setTimeout(() => {this.refreshBrowser()}, THIRTY_MINUTES);
	}
	/**
	 * 替换单个浏览器实例
	 *
	 * @param {String} browserInstance 浏览器promise
	 * @param {String} retries 重试次数，超过这个次数直接关闭浏览器
	 */
	async replaceBrowserInstance(browserInstance, retries = 2) {
		const browser = await puppeteer.connect({browserWSEndpoint: browserInstance});
		const openPages = await browser.pages();

		// 因为浏览器会打开一个空白页，如果当前浏览器还有任务在执行，一分钟后再关闭
		if (openPages && openPages.length > 1 && retries > 0) {
			const nextRetries = retries - 1;
			setTimeout(() => this.replaceBrowserInstance(browserInstance, nextRetries), ONE_MINUTES);
			return;
		}

		await browser.close();

		let newBrowserInstance = await this.createBrowserInstance();
		BROWSER_LIST.push(newBrowserInstance);
	}

	async screenshot(opts) {
		const { url, output } = opts || {};
		console.log(url);
		const tmp = Math.floor(Math.random() * MAX_WSE);
		let browserWSEndpoint = BROWSER_LIST[tmp];
		if (!browserWSEndpoint) return;

		const browser = await puppeteer.connect({browserWSEndpoint});
		const page = await browser.newPage();
		try {
			await page.emulate(iPhone);
			await page.goto(url, {
				waitUntil: 'networkidle0'
			});

			let poster = await page.$('.js-puppeteer');
			let { x, y, width, height } = await poster.boundingBox();

			let buffer;
			if (height > IMAGE_HEIGHT) {
				buffer = await this.longScreenshot(poster, { x, y, width, height, output });
			} else {
				buffer = await poster.screenshot({
					path: output
				})
			}
			await page.close();
			return buffer;
		} catch (error) {
			await page.close();
		}
	}

	async longScreenshot(poster, { x, y, width, height, output }) {
		let imgsTmp = []; // 截图片段暂存路径
		let count = Math.ceil(height / IMAGE_HEIGHT); // 截成几段
		let holdDir = `./${new Date().getTime()}-${uuid}`;
		uuid++
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
			
		return await new Promise((resolve, reject) => { 
			gm(imgsTmp.shift()).append(...imgsTmp)
			.toBuffer('PNG', (err, buffer) => {
				if (fs.existsSync(holdDir)) {
					fs.remove(holdDir);	
				}
				if (err) {
					console.log('截图合并失败！', err)
					reject(err)
				} else {
					console.log('完整截图生成成功！');
					resolve(buffer);
				}
			})
			// .write(output, (err) => {
			// 	if (err) {
			// 		console.log('截图合并失败！', err)
			// 		reject(err)
			// 	} else {
			// 		console.log('完整截图生成成功！');
			// 		resolve('完整截图生成成功！');
			// 	}
			// 	if (fs.existsSync(holdDir)) {
			// 		fs.remove(holdDir);	
			// 	}
			// })
		})
	}
}

module.exports = ScreenshotServer;