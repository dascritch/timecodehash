"use strict";

function TimecodeHash() {
	var units = { 
				's' : 1,
				'm' : 60,
				'h' : 3600,
				'd' : 86400,
			};
	this.convertTimeInSeconds = function(givenTime) {
		var seconds = 0;
		if (/^\d+$/.test(givenTime)) {
			seconds = Number(givenTime);
		} else {
			for(var key in units) {
				if (units.hasOwnProperty(key)) {
					var sub = new RegExp('^(.*)(\\d+)'+key+'(.*)$');
					if (sub.test(givenTime)) {
						seconds += Number(givenTime.replace(sub,'$2' )) * units[key];
					}
				}
			}
		}
		return seconds;
	}
}
