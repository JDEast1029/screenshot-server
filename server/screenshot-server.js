const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const gm = require('gm');
const ResponseUtil = require('./response');
const Utils = require('./utils');

const IMAGE_HEIGHT = 3000; // 最大截图高度
const MAX_WSE = 2; // 启动几个浏览器 
const iPhone = puppeteer.devices['iPhone 8'];
const THIRTY_MINUTES = 1 * 60 * 1000; // 30分钟；
const ONE_MINUTES = 1 * 60 * 1000; // 1分钟

let BROWSER_LIST = []; //存储browser列表
let uuid = 0;
// const OUTPUT_DIR_PATH = '/data/imgoss'; // 服务器根目录; 测试、正式、预发都是这个
const OUTPUT_DIR_PATH = '/Users/dongjiang/Documents/workspace/gitClone/self/screenshot-server'; // 服务器根目录; 测试、正式、预发都是这个

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
			headless: true,
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

	async screenshot2Buffer(opts) {
		const { url } = opts || {};
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
			let buffer;
			// 没有节点标记，就默认全屏截图
			if (!poster) {
				console.log('现在是全屏截图，如果想截取节点，请在节点上添加[js-puppeteer]类名');
				buffer = await page.screenshot({ });
			} else {
				// 节点截图
				let { x, y, width, height } = await poster.boundingBox();
				if (height > IMAGE_HEIGHT) {
					let { fragment, fragmentDir } = await this.getScreenshotFragment(poster, { x, y, width, height });
					buffer = await this.gm2Buffer(fragment, fragmentDir);
				} else {
					buffer = await poster.screenshot({})
				}
			}
			await page.close();
			return buffer;
		} catch (error) {
			console.log('buffer-error', error);
			await page.close();
		}
	}

	screenshot2Url(opts) {
		const { url } = opts || {};
		console.log(url);
		const tmp = Math.floor(Math.random() * MAX_WSE);
		let browserWSEndpoint = BROWSER_LIST[tmp];
		if (!browserWSEndpoint) {
			return ResponseUtil.fail(0, '截图服务的浏览器未打开');
		};
		return new Promise(async (resolve, reject) => {
			const browser = await puppeteer.connect({browserWSEndpoint});
			const page = await browser.newPage();
			try {
				await page.emulate(iPhone);
				await page.goto(url, {
					waitUntil: 'networkidle0'
				});

				// 时间戳 + 随机6位数 + screenshot
				let fileName = `${new Date().getTime()}-${Math.random().toString().slice(-6)}-screenshot.png`;
				// 根目录 + 日期 + 文件名
				let outputDir = `${OUTPUT_DIR_PATH}/screenshot/${Utils.getDateYMD()}`;
				let ossPath = `/screenshot/${Utils.getDateYMD()}/${fileName}`; // oss 路径地址
				let output = `${OUTPUT_DIR_PATH}${ossPath}`; // 存放在阿里云上的路径 
				await fs.ensureDir(outputDir); // 确保文件目录存在，不存在则会创建

				let poster = await page.$('.js-puppeteer');
				// 没有节点标记，就默认全屏截图
				if (!poster) {
					console.log('现在是全屏截图，如果想截取节点，请在节点上添加[js-puppeteer]类名');
					await page.screenshot({ path: output });
				} else {
					// 节点截图
					let { x, y, width, height } = await poster.boundingBox();
					if (height > IMAGE_HEIGHT) {
						let { fragment, fragmentDir } = await this.getScreenshotFragment(poster, { x, y, width, height });
						await this.gm2Url(fragment, fragmentDir, output);
					} else {
						await poster.screenshot({ path: output });
					}
				}
				await page.close();
				resolve(ResponseUtil.success({ url: ossPath }));
			} catch (error) {
				console.log('url-error', error);
				await page.close();
				resolve(ResponseUtil.fail(0, error.toString()));
			}
		});
	}

	async getScreenshotFragment(poster, { x, y, width, height }) {
		let fragment = []; // 截图片段暂存路径
		let count = Math.ceil(height / IMAGE_HEIGHT); // 截成几段
		let fragmentDir = `./${new Date().getTime()}-${uuid}`;
		uuid++
		if (!fs.existsSync(fragmentDir)) {
			fs.mkdir(fragmentDir);
		}
		for (let i = 0; i < count; i++) {
			let imgPath = `${fragmentDir}/img-${i + 1}.png`;
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
				fragment.push(imgPath)
			}).catch(err => {
				console.log('截图失败！', err);
			})
		}
		return { fragment, fragmentDir }
	}
	gm2Buffer(fragment, fragmentDir) {
		return new Promise((resolve, reject) => { 
			gm(fragment.shift())
			.append(...fragment)
			.toBuffer('PNG', (err, buffer) => {
				if (fs.existsSync(fragmentDir)) {
					fs.remove(fragmentDir);	
				}
				if (err) {
					console.log('截图合并失败！', err)
					reject(err)
				} else {
					console.log('完整截图生成成功！');
					resolve(buffer);
				}
			})
		});
	}
	gm2Url(fragment, fragmentDir, output) {
		return new Promise((resolve, reject) => { 
			gm(fragment.shift())
			.append(...fragment)
			.write(output, (err) => {
				if (fs.existsSync(fragmentDir)) {
					fs.remove(fragmentDir);	
				}
				if (err) {
					console.log('截图合并失败！', err)
					reject(err)
				} else {
					console.log('完整截图生成成功！');
					resolve('完整截图生成成功！');
				}
			});
		});
	}
}

module.exports = ScreenshotServer;