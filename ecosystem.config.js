module.exports = {
	apps: [
		// 接收github推送的消息(webhook)
		{
			name: 'webhook',
			script: 'webhook/index.js',
			watch: true,
		},
		// 截图服务
		{
			name: 'screenshot',
			script: 'src/app.js',
			watch: true,                             // 是否监听文件变动然后重启    
			ignore_watch: ['node_modules', 'logs'],  // 不用监听的文件      
			env: {
				NODE_ENV: "production",
			},
			env_development: {
				NODE_ENV: "development",
			},
			exec_mode: "cluster_mode",                // 应用启动模式，支持fork和cluster模式    
			instances: 4,                             // 应用启动实例个数，仅在cluster模式有效 默认为fork；或者 max    
			max_memory_restart: '1G',                 // 最大内存限制数，超出自动重启    
			error_file: "logs/app-err.log",         // 错误日志文件    
			out_file: "logs/app-out.log",           // 正常日志文件    
			merge_logs: true,                         // 设置追加日志而不是新建日志    
			log_date_format: "YYYY-MM-DD HH:mm:ss",   // 指定日志文件的时间格式    
			min_uptime: "60s",                        // 应用运行少于时间被认为是异常启动    
			max_restarts: 30,                         // 最大异常重启次数，即小于min_uptime运行时间重启次数；    
			autorestart: true,                        // 默认为true, 发生异常的情况下自动重启    
			cron_restart: "*/30 * * * *",             // crontab时间格式重启应用，目前只支持cluster模式;    
			restart_delay: 4000,                     // 异常重启情况下，延时重启时间 单位ms
			// cwd: "./",                                // 根目录    
			// args: "",                                 // 传递给脚本的参数    
			// interpreter: "",                          // 指定的脚本解释器   
			// interpreter_args: "",                     // 传递给解释器的参数    
		}
	],

	// TODO:部署配置
	deploy: {
		production: {
			user: 'SSH_USERNAME',
			host: 'SSH_HOSTMACHINE',
			ref: 'origin/master',
			repo: 'GIT_REPOSITORY',
			path: 'DESTINATION_PATH',
			'pre-deploy-local': '',
			'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
			'pre-setup': ''
		}
	}
};
