(function(global){
	var read = function(name, deflt) {
		return new Promise(function(resolve){
			chrome.storage.sync.get([name], function(result){
				if (chrome.runtime.lastError)
					throw new Error(chrome.runtime.lastError);
				resolve(result[name] || deflt);
			});
		});
	};

	var write = function(name, value) {
		return new Promise(function(resolve){
			var input = {};
			input[name] = value;
			chrome.storage.sync.set(input, function(){
				if (chrome.runtime.lastError)
					throw new Error(chrome.runtime.lastError);
				resolve();
			});
		});
	};

	var list = function() {
		return read('passwords', []);
	};


	var cache = {};

	global.storage = {
		passwords: {
			add: function(name, len, password) {
				return list().then(function(passwords){
					passwords.push({name:name, len:len, hash:hash(password)});
					return write('passwords', passwords).then(list);
				});
			},
			get: function(pass, domain) {
				if (!cache[pass.name]) {
					var attempt = window.prompt('Password for '+pass.name);
					while(true){
						if (!attempt) {
							return Promise.reject(new Error('User did not authenticate'));
						}
						if (hash(attempt) === pass.hash) {
							cache[pass.name] = attempt;
							break;
						}
						attempt = window.prompt('Previous attempt was incorrect. Try again or cancel.\nPassword for '+pass.name);
					}
				}
				return Promise.resolve(supergenpass(cache[pass.name], domain, pass.len));
			},
			list: list,
			remove: function(i) {
				return list().then(function(passwords){
					passwords.splice(i, 1);
					return write('passwords', passwords).then(list);
				});
			}
		},
		whitelist: {
			get: function() {
				return read('whitelist', '');
			},
			set: function(newValue) {
				return write('whitelist', newValue);
			}
		}
	};
})(this);
