class PubSub {
	constructor() {
		this.subscribers = []
	}

	subscribe(topic, callback) {
		let callbacks = this.subscribers[topic];
		if(!callbacks) {
			this.subscribers[topic] = [callback];
		} else{
			callbacks.push(callback);
		}
	}
		
	publish(topic, ...args) {
		let callbacks = this.subscribers[topic] || [];
		callbacks.forEach(callback => callback(...args));
	}
}

module.exports = PubSub;