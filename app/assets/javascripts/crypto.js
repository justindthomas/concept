function init(evt) {
  c = new crypto();
  window.addEventListener("mousemove",update);
  sjcl.random.startCollectors();
}

function update() {
  var e = document.getElementById("entropy");
  var progress = sjcl.random.getProgress(10);

  if(progress === undefined) {
    e.innerHTML = "sufficient";
    sjcl.random.stopCollectors();
    window.removeEventListener("mousemove",update);
  } else {
    e.innerHTML = progress.toFixed(2);
  }
}

function crypto() {  
    if(localStorage.pubkeybob && localStorage.seckeybob) {
	console.log("pulling keys from local storage");
	try {
	    pubkeybob = localStorage.getItem('pubkeybob');
	    seckeybob = localStorage.getItem('seckeybob');
	    pubkeyalice = localStorage.getItem('pubkeyalice');
            seckeyalice = localStorage.getItem('seckeyalice');
	    
	    document.getElementById("pubkeybob").value = pubkeybob;
	    document.getElementById("seckeybob").value = seckeybob;
	    document.getElementById("pubkeyalice").value = pubkeyalice;
            document.getElementById("seckeyalice").value = seckeyalice;
	    setDownload();
	} catch (e) {
	    console.log(e);
	}
    }

    function setDownload() {
	var privbob = JSON.parse(document.getElementById("seckeybob").value);
	var pubbob = JSON.parse(document.getElementById("pubkeybob").value);

	var pairbob = { "private": privbob, "public": pubbob }

	var privalice = JSON.parse(document.getElementById("seckeyalice").value);
        var pubalice = JSON.parse(document.getElementById("pubkeyalice").value);

        var pairalice = { "private": privalice, "public": pubalice }

	download = { "bob": pairbob, "alice": pairalice };
	charset = document.characterSet;
	document.getElementById("download").setAttribute("href", ["data:application/octet-stream;charset=",
								  charset, ",", encodeURIComponent(JSON.stringify(download))
								 ].join(""));
    }
  
    this.getAsymKeys = function() {
	var pubkeybob, seckeybob, pubkeyalice, seckeyalice;
	
	var keys = this.generateKeys();

	if(localStorage == undefined) {
	    pubkeybob = JSON.stringify(keys.bob.pub.serialize());
	    seckeybob = JSON.stringify(keys.bob.sec.serialize());
	    pubkeyalice = JSON.stringify(keys.alice.pub.serialize());
            seckeyalice = JSON.stringify(keys.alice.sec.serialize());
	} else {
	    console.log("pulling keys from local storage");
	    pubkeybob = localStorage.getItem('pubkeybob');
	    seckeybob = localStorage.getItem('seckeybob');
	    pubkeyalice = localStorage.getItem('pubkeyalice');
            seckeyalice = localStorage.getItem('seckeyalice');
	}
	
	document.getElementById("pubkeybob").value = pubkeybob;
	document.getElementById("seckeybob").value = seckeybob;
	document.getElementById("pubkeyalice").value = pubkeyalice;
        document.getElementById("seckeyalice").value = seckeyalice;
	
	setDownload();
    }
    
    this.getSymKeyAlice = function() {
	var pubstr = document.getElementById("pubkeybob").value;
	var pubjson = JSON.parse(pubstr);
	
	var point = sjcl.ecc.curves['c'+pubjson.curve].fromBits(pubjson.point)
	var pubkey = new sjcl.ecc.elGamal.publicKey(pubjson.curve, point.curve, point);
	
	var symkey = pubkey.kem(0);
	document.getElementById("symkeyalice").value = JSON.stringify(symkey.key);
	document.getElementById("symkeytagalice").value = JSON.stringify(symkey.tag);
    }
    
    this.getSymKeyBob = function() {
	var pubstr = document.getElementById("pubkeyalice").value;
	var pubjson = JSON.parse(pubstr);
	
	var point = sjcl.ecc.curves['c'+pubjson.curve].fromBits(pubjson.point)
	var pubkey = new sjcl.ecc.elGamal.publicKey(pubjson.curve, point.curve, point);
	
	var symkey = pubkey.kem(0);
	document.getElementById("symkeybob").value = JSON.stringify(symkey.key);
	document.getElementById("symkeytagbob").value = JSON.stringify(symkey.tag);
    }
    
    this.generateKeys = function() {
	var bobkeys = sjcl.ecc.elGamal.generateKeys(384, 10)
	var alicekeys = sjcl.ecc.elGamal.generateKeys(384, 10)

	if(localStorage != undefined) {
	    localStorage.setItem('pubkeybob', JSON.stringify(bobkeys.pub.serialize()));
	    localStorage.setItem('seckeybob', JSON.stringify(bobkeys.sec.serialize()));
	    localStorage.setItem('pubkeyalice', JSON.stringify(alicekeys.pub.serialize()));
            localStorage.setItem('seckeyalice', JSON.stringify(alicekeys.sec.serialize()));
	}
	
	return { "bob": bobkeys, "alice": alicekeys }
    }
    
    this.decryptSymKey = function(tagstr, secretstr) {
	var tag = JSON.parse(tagstr);
	
	var secret = JSON.parse(secretstr);
	var ex = sjcl.bn.fromBits(secret.exponent);
	var sec = new sjcl.ecc.elGamal.secretKey(secret.curve,sjcl.ecc.curves['c'+secret.curve],ex);
	
	var sym = sec.unkem(tag);
	
	return sym;	
    }
    
    this.sendToAlice = function() {
	var text = document.getElementById("opentextbob").value;
	var symkey = JSON.parse(document.getElementById("symkeybob").value);
	
	document.getElementById("encryptedtextbob").value = JSON.stringify(this.encrypt(text, symkey));
	
	var decryptedsymkey = this.decryptSymKey(document.getElementById("symkeytagbob").value,
						 document.getElementById("seckeyalice").value);
	
	document.getElementById("decryptedtextalice").value = this.decryptText(document.getElementById("encryptedtextbob").value, decryptedsymkey);
    }
    
    this.sendToBob = function () {
	var text = document.getElementById("opentextalice").value;
	var symkey = JSON.parse(document.getElementById("symkeyalice").value);
	
	document.getElementById("encryptedtextalice").value = JSON.stringify(this.encrypt(text, symkey));

	var decryptedsymkey = this.decryptSymKey(document.getElementById("symkeytagalice").value,
						 document.getElementById("seckeybob").value);
	
	document.getElementById("decryptedtextbob").value = this.decryptText(document.getElementById("encryptedtextalice").value, decryptedsymkey);
    }
    
    this.decryptText = function(encryptedtextstr, symkey) {
	var enc = JSON.parse(encryptedtextstr);
	//var symkey = JSON.parse(symkeystr);
	
	var plain = this.decrypt(enc, symkey);
	var chars = this.binChars(this.decBin(plain));
	var text = ""
	for(i = 0; i < chars.length; i++) {
	    if(chars[i] != 0) {
		text += String.fromCharCode(chars[i]);
	    }
	}
	
	return text;
    }
    
    this.encrypt = function(plaintext, key) {
	return this.toAes(this.toDec(this.toBin(plaintext)), key);
    }
    
    this.decrypt = function(encrypted, key) {
	return this.fromAes(encrypted, key);
    }
    
    this.toAes = function(arr, key) {
	//print("arr sent to toAes: " + arr);
	aes = new sjcl.cipher.aes(key);
	crypt_arr = [];
	
	j = 0;
	temp_arr = [];
	for(i = 0; i < arr.length; i++, j++) {
	    temp_arr[j] = arr[i];
	    
	    if((i + 1) >= arr.length) {
		//print("padding, length: " + temp_arr.length);
		while(temp_arr.length  < 4) {
		    temp_arr[temp_arr.length] = null;
		}
	    }
	    
	    if(temp_arr.length == 4) {
		//print("plain: " + temp_arr)
		temp_crypt = aes.encrypt(temp_arr);
		//print("encrypted: " + temp_crypt);
		crypt_arr = crypt_arr.concat(temp_crypt);
		
		j = -1; temp_arr = [];
	    }
	}
	
	return crypt_arr;
    }
    
    this.fromAes = function(encrypted, key) {
	aes = new sjcl.cipher.aes(key);
	plain_arr = [];
	
	j = 0;
	temp_arr = [];
	for(i = 0; i < encrypted.length; i++, j++) {
	    temp_arr[j] = encrypted[i];
	    
	    if(temp_arr.length == 4) {
		temp_plain = aes.decrypt(temp_arr);
		//print("plain: " + temp_plain);
		plain_arr = plain_arr.concat(temp_plain);
		j = -1; temp_arr = [];
	    }
	}
	
	return plain_arr;
    };
    
    this.decBin = function(decimal_arr) {
	var binary = ""
	
	for(i = 0; i < decimal_arr.length; i++) {
	    temp_bin = parseInt(decimal_arr[i]).toString(2);
	    
	    while(temp_bin.length < 16) {
		temp_bin = "0" + temp_bin;
	    }
	    
	    binary += temp_bin;
	}
	
	return binary;
    }
    
    this.binChars = function(binary_string) {
	char_arr = [];
	
	len = binary_string.length;
	val = 1; dec = 0;
	for (i = 1; i <= len; i++) {
	    if(parseInt(binary_string[len - i]) == 1) {
		dec += val;
	    }
	    
	    val *= 2;
	    
	    if(i != 1 && i % 8 == 0) {
		char_arr[char_arr.length] = dec;
		val = 1;
		dec = 0;
	    }
	}
	
	char_arr.reverse();
	return char_arr;
    }
    
    this.toBin = function(text) {
	var st,
	i,
	j,
	d;
	var arr = [];
	var len = text.length;
	for (i = 1; i <= len; i++) {
	    //reverse so its like a stack
	    d = text.charCodeAt(len - i);
	    for (j = 0; j < 8; j++) {
		st = d % 2 == '0' ? "class='zero'": ""
		arr.push(d % 2);
		d = Math.floor(d / 2);
	    }
	}
	//reverse all bits again.
	ret = arr.reverse().join("");
	//print(ret)
	return ret
    };
    
    this.toDec = function(binary) {
	//print("binary length: " + binary.length);
	var arr = [];
	
	j = 0;
	temp_arr = [];
	
	for(i = 0; i < binary.length; i++, j++) {
	    temp_arr[j] = binary[i];
	    
	    if((i + 1) == binary.length) {
		while(temp_arr.length < 16) {
		    pad = [0]
		    temp_arr = temp_arr.concat(pad);
		} 
	    }
	    
	    if(temp_arr.length == 16) {
		dec = 0;
		val = 1;
		
		for(k = 1; k <= temp_arr.length; k++) {
		    if(parseInt(temp_arr[temp_arr.length - k]) == 1) {
			dec += val;
		    }	
	  
		    val *= 2;
		}
		
		arr[arr.length] = dec;
		
		j = -1; temp_arr = [];
	    }
	}
	
	//print("dec: " + arr);
	return arr;
    };
}

/**
 * 
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/

var Base64 = {
    
    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    
    // public method for encoding
    encode : function (input) {
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	
	input = Base64._utf8_encode(input);
	
	while (i < input.length) {
	    
	    chr1 = input.charCodeAt(i++);
	    chr2 = input.charCodeAt(i++);
	    chr3 = input.charCodeAt(i++);
	    
	    enc1 = chr1 >> 2;
	    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
	    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	    enc4 = chr3 & 63;
	    
	    if (isNaN(chr2)) {
		enc3 = enc4 = 64;
	    } else if (isNaN(chr3)) {
		enc4 = 64;
	    }
	    
	    output = output +
		this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
		this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
	    
	}
	
	return output;
    },
    
    // public method for decoding
    decode : function (input) {
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	
	while (i < input.length) {
	    
	    enc1 = this._keyStr.indexOf(input.charAt(i++));
	    enc2 = this._keyStr.indexOf(input.charAt(i++));
	    enc3 = this._keyStr.indexOf(input.charAt(i++));
	    enc4 = this._keyStr.indexOf(input.charAt(i++));
	    
	    chr1 = (enc1 << 2) | (enc2 >> 4);
	    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
	    chr3 = ((enc3 & 3) << 6) | enc4;
	    
	    output = output + String.fromCharCode(chr1);
	    
	    if (enc3 != 64) {
		output = output + String.fromCharCode(chr2);
	    }
	    if (enc4 != 64) {
		output = output + String.fromCharCode(chr3);
	    }
	    
	}
	
	output = Base64._utf8_decode(output);
	
	return output;
	
    },
    
    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
	string = string.replace(/\r\n/g,"\n");
	var utftext = "";
	
	for (var n = 0; n < string.length; n++) {
	    
	    var c = string.charCodeAt(n);
	    
	    if (c < 128) {
		utftext += String.fromCharCode(c);
	    }
	    else if((c > 127) && (c < 2048)) {
		utftext += String.fromCharCode((c >> 6) | 192);
		utftext += String.fromCharCode((c & 63) | 128);
	    }
	    else {
		utftext += String.fromCharCode((c >> 12) | 224);
		utftext += String.fromCharCode(((c >> 6) & 63) | 128);
		utftext += String.fromCharCode((c & 63) | 128);
	    }
	    
	}
	
	return utftext;
    },
    
    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
	var string = "";
	var i = 0;
	var c = c1 = c2 = 0;
	
	while ( i < utftext.length ) {
	    
	    c = utftext.charCodeAt(i);
	    
	    if (c < 128) {
		string += String.fromCharCode(c);
		i++;
	    }
	    else if((c > 191) && (c < 224)) {
		c2 = utftext.charCodeAt(i+1);
		string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
		i += 2;
	    }
	    else {
		c2 = utftext.charCodeAt(i+1);
		c3 = utftext.charCodeAt(i+2);
		string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
		i += 3;
	    }
	    
	}
	
	return string;
    }
    
}
