
function crypto() {
	"use strict"

	if ( !(this instanceof crypto) ) throw new Error("Constructor called as a function")

	/**
	 * passphrase and encrypted_private_key should be submitted as they exist in their
	 * respective input fields. messages is a list of encrypted messages from the server and
	 * message_keys is an object mapping each message id to its corresponding asymmetrically
	 * encrypted symmetric key
	 **/
	this.decrypt_messages = function (passphrase, message_keys) {
		if(!passphrase || !message_keys)
			 throw new Error("Invalid argument(s)")

		for (var i = 0; i < message_keys.length; i++) {
			var pvk = JSON.parse(sjcl.decrypt(passphrase, JSON.parse(message_keys[i].details.recipient.encrypted_private_key)))
			var bn = sjcl.bn.fromBits(pvk.exponent)
			var sec = new sjcl.ecc.elGamal.secretKey(pvk.curve, sjcl.ecc.curves['c'+pvk.curve], bn)

			var sym = sec.unkem(JSON.parse(message_keys[i].encrypted_key))
			var message = sjcl.decrypt(sym, message_keys[i].details.message.body)
			message_keys[i].details.message.body = message
		}

		return message_keys
	}

	this.verify_messages = function (message_keys) {
		if(!message_keys) throw new Error("Invalid argument(s)")

		for (var i = 0; i < message_keys.length; i++) {
			var json = JSON.parse(message_keys[i].details.sender.verification_key)
			var point = sjcl.ecc.curves['c'+json.curve].fromBits(json.point)
			var sgk = new sjcl.ecc.ecdsa.publicKey(json.curve, point.curve, point)
			var hash = sjcl.hash.sha256.hash(message_keys[i].details.message.body)
			message_keys[i].details.message.verified = sgk.verify(hash, JSON.parse(message_keys[i].details.message.signature))
		}

		return message_keys
	} 

	this.generate_keys = function () {
		var ekp = sjcl.ecc.elGamal.generateKeys(384,10)
		var skp = sjcl.ecc.ecdsa.generateKeys(384,10)

		return {"encryption": {	"pub":ekp.pub.serialize(),
					"sec":ekp.sec.serialize()},
			"signing": {	"pub":skp.pub.serialize(),
					"sec":skp.sec.serialize()},
			"secure":	false}
	}

	this.encrypt_keys = function(passphrase, keys) {
		if(!passphrase || !keys) throw new Error("Invalid argument(s)")

		keys.encryption.sec = sjcl.encrypt(passphrase, JSON.stringify(keys.encryption.sec))
		keys.signing.sec = sjcl.encrypt(passphrase, JSON.stringify(keys.signing.sec))	
		keys.secure = true

		return keys
	}

	this.prepare_message = function (sender, recipient, passphrase, message) {
                var signing_key = this.decrypt_signing_key(passphrase, this.get_encrypted_signing_key(sender))
                var public_key = this.get_public_key(recipient)

                var signature = signing_key.sign(sjcl.hash.sha256.hash(message))
                var message_key = public_key.kem(0)
                var encrypted_message = sjcl.encrypt(message_key.key, message)
                var encrypted_message_key = message_key.tag

                return {        "encrypted_message": encrypted_message,
                                "encrypted_message_key": JSON.stringify(encrypted_message_key),
                                "signature": JSON.stringify(signature) }
        }

	this.get_public_key = function (uuid) {
                var public_key

                $.ajax({
                        url: "/users/" + uuid + ".json",
                        async: false,
                        dataType: "json",
                        success: function(data) {
                                var json = JSON.parse(data.public_key)
                                var point = sjcl.ecc.curves['c'+json.curve].fromBits(json.point)
                                public_key = new sjcl.ecc.elGamal.publicKey(json.curve, point.curve, point)
                        }
                })

                return public_key
        }

        this.get_encrypted_signing_key = function (uuid) {
                var ret

                $.ajax({
                        url: "/users/" + uuid + ".json",
                        async: false,
                        dataType: "json",
                        success: function(data) {
                                ret = JSON.parse(data.encrypted_signing_key)
                        }
                })

                return ret
        }

	this.decrypt_signing_key = function (passphrase, encrypted_signing_key) {
                var epks = sjcl.decrypt(passphrase, encrypted_signing_key)
                var spk = JSON.parse(epks)

                var bignum = sjcl.bn.fromBits(spk.exponent)
                var signing_key = new sjcl.ecc.ecdsa.secretKey(spk.curve,sjcl.ecc.curves['c'+spk.curve],bignum)

                return signing_key
        }
}
