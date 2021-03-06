module.exports = {
	numberFormat: function (number, decimals, decPoint, thousandsSep) {
		decimals = isNaN(decimals) ? 1 : Math.abs(decimals);
		decPoint = (decPoint === undefined) ? '.' : decPoint;
		thousandsSep = (thousandsSep === undefined) ? '' : thousandsSep;
		const sign = number < 0 ? '-' : '';
		number = Math.abs(+number || 0);
		const intPart = parseInt(number.toFixed(decimals), 10) + '';
		const j = intPart.length > 3 ? intPart.length % 3 : 0;
		return ((''
			)+( sign
			)+( (j ? intPart.substr(0, j) + thousandsSep : '')
			)+( intPart.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousandsSep)
			)+( (decimals ? decPoint + Math.abs(number - intPart).toFixed(decimals).slice(2) : '')
		));
	},
	hsize: function (value, decimals) {
		const units = [[1, 'B'], [1024, 'KiB'], [1024 * 1024, 'MiB'], [1024 * 1024 * 1024, 'GiB']];
		for (let i = 0; i < units.length - 1; i++) {
			if (value < units[i + 1][0]) {
				return this.numberFormat(value / units[i][0], decimals) + units[i][1];
			}
		}
		return this.numberFormat(value / units[units.length - 1][0], decimals) + units[units.length - 1][1];
	},
	htime: function (value) {
		const sec_num = parseInt(value, 10);
		let days = Math.floor(sec_num / 86400);
		let hours = Math.floor((sec_num % 86400) / 3600);
		let minutes = Math.floor(((sec_num % 86400) % 3600) / 60);
		let seconds = ((sec_num % 86400) % 3600) % 60;
		days = days > 0 ? days + 'd' : '';
		hours = hours > 0 || days !== '' ? (hours < 10 && days !== '' ? '0' + hours + 'h' : hours + 'h') : '';
		minutes = minutes > 0 || hours !== '' ? (minutes < 10 && hours !== '' ? '0' + minutes + 'm' : minutes + 'm') : '';
		seconds = minutes !== '' && seconds < 10 ? '0' + seconds + 's' : seconds + 's';
		return (days + hours + minutes + seconds);
	},
	typeOfSN: function (str) {
		return typeof str == 'string' || typeof str == 'number' ? true : false;
	},
	updLn: function (text) {
		const s = process.stderr;
		s.cursorTo(0);
		s.write(text);
		s.clearLine(1);
	},
	uplStatus: function (ub, fsize, start_time, tPf) {
		const txtPrefix = typeof tPf === 'string' ? tPf : 'UPL';
		const elapsed = Date.now() - start_time;
		const percentFxd = (ub / fsize * 100).toFixed();
		const percent = percentFxd < 100 ? percentFxd : 99;
		const time = this.htime(((parseInt(elapsed * (fsize / ub - 1))) / 1000).toFixed());
		if (ub < fsize) {
			this.updLn(txtPrefix + ': ' + this.hsize(ub) + '/' + this.hsize(fsize) + ' [' + percent + '%] ' + time);
		}
	},
	parseWinCmdLineParam: function (p) {
		let quote = false;
		let start = 0;
		const result = [];
		for (let i = 0; i < p.length; i++) {
			if (p[i] === ' ' && !quote) {
				if (start < i) {
					result.push(p.substring(start, i));
				}
				start = i + 1;
				continue;
			}
			if (p[i] !== '"') continue;
			if (quote) {
				result.push(p.substring(start, i));
				start = i + 2;
				quote = false;
				continue;
			}
			quote = true;
			start = i + 1;
		}
		if (start < p.length) {
			result.push(p.substring(start));
		}
		return result;
	},
	cleanupFilename: function (flnm) {
		const fixingChar = '_';
		const illegalRe = /[\/\?<>\\:\*\|":]/g; // Illegal Characters on constious Operating Systems: / ? < > \ : * | "
		const controlRe = /[\x00-\x1f\x80-\x9f]/g; // Unicode Control codes: C0 0x00-0x1f & C1 (0x80-0x9f)
		const reservedRe = /^\.+$/; // Reserved filenames on Unix-based systems (".", "..")
		const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
		/*	Reserved filenames in Windows ("CON", "PRN", "AUX", "NUL", "COM1",
			"COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
			"LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", and
			"LPT9") case-insesitively and with or without filename extensions. */
		const windowsTrailingRe = /[\. ]+$/;
		flnm = flnm
			.replace(illegalRe, fixingChar)
			.replace(controlRe, fixingChar)
			.replace(reservedRe, fixingChar)
			.replace(windowsReservedRe, fixingChar)
			.replace(windowsTrailingRe, fixingChar);
		return flnm;
	},
	parseDate: function (date, notime) {
		if (date === 0) {
			return '0000-00-00 00:00:00 UTC';
		}
		date = new Date(date);
		const year = date.getUTCFullYear();
		let mnth = date.getUTCMonth() + 1;
		mnth = mnth < 10 ? '0' + mnth : mnth;
		let dtnp = date.getUTCDate();
		dtnp = dtnp < 10 ? '0' + dtnp : dtnp;
		let hour, mins, secs;
		if (!notime) {
			hour = date.getUTCHours();
			hour = hour < 10 ? '0' + hour : hour;
			mins = date.getUTCMinutes();
			mins = mins < 10 ? '0' + mins : mins;
			secs = date.getUTCSeconds();
			secs = secs < 10 ? '0' + secs : secs;
		}
		return year + '-' + mnth + '-' + dtnp + (notime ? '' : ' ' + hour + ':' + mins + ':' + secs) + ' ' + 'UTC';
	},
	exec: function (pname, fpath, pargs, spc) {
		console.log('\n> "' + pname + '"' + (pargs ? ' ' + pargs : '') + (spc ? '\n' : ''));
		require('child_process').execSync(fpath + (pargs ? ' ' + pargs : ''), { stdio: 'inherit' });
	},
	validateNum: function (input, min, max) {
		const num = +input;
		return num >= min && num <= max && input === num.toString();
	},
	validateIpAndPort: function (input) {
		const parts = input.split(':');
		const ip = parts[0].split('.');
		const port = parts[1];
		return parts.length == 2 && ip.length == 4 && this.validateNum(port, 1, 65535) && ip.every(segment => {
			return this.validateNum(segment, 0, 255);
		});
	}
};
