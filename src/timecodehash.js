/*
	TimecodeHash , an extension to the hash system to address timecode into audio/video elements
    Copyright (C) 2014 Xavier "dascritch" Mouton-Dubosc

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

	--

	project repository : https://github.com/dascritch/timecodehash
	professional : http://dascritch.com
    blog : http://dascritch.net


 */

window.TimecodeHash = function() {
	'use strict';

	if ( (document.addEventListener === undefined) || (!('onhashchange' in window)) ) {
		// not even think about it : probably MSIE < 8
		return;
	}

	var _units = {
		'd' : 86400,
		'h' : 3600,
		'm' : 60,
		's' : 1
	};

	var self = {
		separator : '@',
		selector : 'audio,video',
		menuId : 'timecodehash-menu',
		convertTimeInSeconds : function(givenTime) {
			var seconds = 0;
			if (/^\d+$/.test(givenTime)) {
				seconds = Number(givenTime);
			} else {
				seconds = givenTime.indexOf(':') === -1 ? this.convertSubunitTimeInSeconds(givenTime) : this.convertColonTimeInSeconds(givenTime) ;
			}
			return seconds;
		},
		convertSubunitTimeInSeconds : function(givenTime) {
			var seconds = 0;
			for(var key in _units) {
				if ( (_units.hasOwnProperty(key)) && (givenTime.indexOf(key) !== -1) ) {
					var atoms = givenTime.split(key);
					seconds += Number(atoms[0].replace(/\D*/g,'' )) * _units[key];
					givenTime = atoms[1];
				}
			}
			return seconds;
		},
		convertColonTimeInSeconds : function(givenTime) {
			var seconds = 0;
			var atoms = givenTime.split(':');
			var convert = [ 1 , 60 , 3600 , 86400 ];
			for (var pos = 0 ; pos < atoms.length ; pos++ ) {
				seconds += Number(atoms[pos]) * convert[((atoms.length-1) - pos)];
			}
			return seconds;
		},
		convertSecondsInTime : function(givenSeconds) {
			var converted = '';
			for(var key in _units) {
				if (_units.hasOwnProperty(key)) {
					var multiply = _units[key];
					if (givenSeconds >= multiply) {
						var digits = Math.floor(givenSeconds / multiply);
						converted += digits + key;
						givenSeconds -= digits * multiply;
					}
				}
			}
			if (converted === '') {
				converted = '0s';
			}
			return converted;
		},
		onDebug : function(callback_fx) {
			// this is needed for testing, as we now run in async tests
			if (typeof callback_fx === 'function') {
				callback_fx();
			}
		},
		jumpElementAt : function(hash,timecode,callback_fx) {

			function do_element_play(e) {
				var tag = e.target;
				tag.play();
				if (e.notRealEvent === undefined) {
					tag.removeEventListener('canplay', do_element_play, true);
					tag.removeEventListener('canplaythrough', do_element_play, true);
				}
				self.onDebug(callback_fx);
			}
			var el;

			if (hash !== '') {
				el = document.getElementById(hash);
			} else {
				el = (document.querySelector !== undefined) ? document.querySelector(this.selector) : undefined;
			}
			if ((el === undefined) || (el.currentTime === undefined)) {
				return false;
			}

			var secs = this.convertTimeInSeconds(timecode);
			// NOT GOOD, yes i know , but  el.currentTime = secs and fastSeek(secs) are NOT available on webkit
			try {
				el.fastSeek(secs);
			} catch(e) {
				if (el.currentSrc === '') {
					/// TODO
					/// se méfier si currentSrc est vide https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
					el.load();
				}
console.log(el.currentSrc);

				el.src = el.currentSrc.split('#')[0] + '#t=' + secs;
			}

			if (el.readyState >= 2)  {
				do_element_play({ target : el , notRealEvent : true });
			} else {
				el.addEventListener('canplay', do_element_play, true);
				el.addEventListener('canplaythrough', do_element_play, true);
			}

		},
		hashOrder : function(hashcode,callback_fx){
			if (typeof hashcode !== 'string') {
				hashcode = document.location.hash.substr(1);
			}

			if (hashcode.indexOf(this.separator) === -1) {
				self.onDebug(callback_fx);
				return ;
			}

			var atoms = hashcode.split(this.separator);
			this.jumpElementAt(atoms[0],atoms[1],callback_fx);
		}
	};

	function _launch() {

		function _buildMenu() {
			var locale = {
				'fr' : 'URL de cette position',
				'en' : 'URL at this time'
			};

			function _getPreferedLocale() {
				// we really need here a smart way to catch the Accept-Locale
				return 'fr';
			}

			function _onMenu() {
				var self = window.TimecodeHash;
				var el = document.querySelector(self.selector);
				var retour = document.location.href.split('#')[0];
				retour += '#' + el.id + self.separator + self.convertSecondsInTime(el.currentTime);
				window.prompt(locale.fr,retour);
			}

			document.body.insertAdjacentHTML('beforeend',
				'<menu type="context" id="'+self.menuId+'">'+
					'<menuitem label="'+locale[_getPreferedLocale()]+'"></menuitem>'+
				'</menu>'
				);
			document.getElementById(self.menuId).querySelector('menuitem').addEventListener('click',_onMenu);
			[].forEach.call(
				// explication de cette construction : https://coderwall.com/p/jcmzxw
				document.querySelectorAll(self.selector),
				function(el) {
					el.setAttribute('contextmenu',self.menuId);
				}
			);
		}

		if (document.getElementById(self.menuId) === null) {
			_buildMenu();
			self.hashOrder();
		}
	}

	if (document.body !== null) {
	     _launch();
	} else {
		document.addEventListener( 'readystatechange', _launch ,false);
	}
	window.addEventListener( 'hashchange', self.hashOrder , false);

	return self;
}();