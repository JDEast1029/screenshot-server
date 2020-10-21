const puppeteer = require('puppeteer');
const fs = require('fs');
const iPhone = puppeteer.devices['iPhone 8'];
let url = 'https://is-wap.wyawds.com/is/skin/report/pc-preview?system_id=10832&project_report_id=81'
// let url = 'https://main.m.taobao.com/'


const autoScroll = (page) => {
    return page.evaluate(() => {
        return new Promise((resolve, reject) => {
            let totalHeight = 0;
			let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
				totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        })
    });
}
let screenShot = async () => {
	const browser = await puppeteer.launch({headless: false});
	const page = await browser.newPage();
	await page.emulate(iPhone);
	await page.goto(url, {
		waitUntil: 'networkidle0'
	});

	let poster = await page.$('.js-puppeteer');
	if (poster) {
		let { x, y, width, height } = await poster.boundingBox()
		console.log(x, y, width, height);
		await poster.screenshot({
			path: 'example.png'
		})
	}
	await browser.close();
};

try {
	screenShot();
} catch(err) {
	console.log(err);
}