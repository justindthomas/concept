var messages = [];
var message_keys = {};

jQuery(function($) {
	$(window).bind('mousemove', collect)
	sjcl.random.startCollectors()

	$("#encrypt_keys").bind('click', encrypt_keys)
	$("#decrypt").bind('click', decrypt_messages)

	if($("#recipient_uuid").length == 0) {
		$(":submit").attr("disabled","disabled")
	}

	if($("#user_uuid").length != 0) {
		$.ajax({
			url: "/users/" + $("#user_uuid").val() + "/messages.json",
			dataType: "json",
			success: function(data) {
				for(var i = 0; i < data.length; i++) {
					messages.push(data[i])
				}
				$("#messages_status").html("Messages loaded.")
			}
		});

		$.ajax({
			url: "/users/" + $("#user_uuid").val() + "/message_keys.json",
			dataType: "json",
			success: function(data) {
				for(var i = 0; i < data.length; i++) {
					message_keys[data[i]["message_id"]] = data[i]["encrypted_key"]
				}
				$("#message_keys_status").html("Message keys loaded.")
			}
		});
	} 
});

function generate_keys() {
	$("#user_public_key").val("generating...")
	var keys = sjcl.ecc.elGamal.generateKeys(384,10)
	var signing = sjcl.ecc.ecdsa.generateKeys(384,10)

	var pub = JSON.stringify(keys.pub.serialize())
	var sec = JSON.stringify(keys.sec.serialize())

	$("#user_public_key").val(pub)
	$("#private_key").val(sec)

	var sign = JSON.stringify(signing.sec.serialize())
	var vrfy = JSON.stringify(signing.pub.serialize())

	$("#signing_key").val(sign)
	$("#user_verification_key").val(vrfy)
}

function update() {
	for(var i = 0; i < messages.length; i++) {
		$('#messages').append('<tr><td><span>' + messages[i].body + '</span></td></tr>')  
	}
}

function collect() {
        var progress = sjcl.random.getProgress(10)

        if(progress === undefined || progress == 1) {
                $("#entropy").html("sufficient")
                sjcl.random.stopCollectors()
                $(window).unbind('mousemove', collect)
		$(window).unbind('keypress', collect)
		generate_keys()
        } else {
                $("#entropy").html(progress.toFixed(2))
        }
}

function encrypt_keys() {
	var passphrase = $('#passphrase').val()

	var private_key = $('#private_key').val()
	var enc = sjcl.encrypt(passphrase, private_key)
	$('#user_encrypted_private_key').val(JSON.stringify(enc))

	var signing_key = $('#signing_key').val()
	var sign = sjcl.encrypt(passphrase, signing_key)
	$('#user_encrypted_signing_key').val(JSON.stringify(sign))

	$(':submit').removeAttr('disabled')
}

function decrypt_messages() {
	if($("#passphrase").val() == "") {
		return;
	}
	var private_key_str = sjcl.decrypt($('#passphrase').val(), JSON.parse($('#encrypted_private_key').val()))
	var private_key = JSON.parse(private_key_str)

	var bignum = sjcl.bn.fromBits(private_key.exponent)
	var sec = new sjcl.ecc.elGamal.secretKey(private_key.curve, sjcl.ecc.curves['c'+private_key.curve], bignum)

	for (var i = 0; i < messages.length; i++) {
		key = sec.unkem(JSON.parse(message_keys[messages[i].id]))
		message = sjcl.decrypt(key, messages[i].body)	
		messages[i].body = message;
	}

	update();
}

function verify_messages() {
	if($("#passphrase").val() == "") {
		return;
	}

	for (var i = 0; i < messages.length; i++) {
		var json = JSON.parse(messages[i].user.verification_key)

		var point = sjcl.ecc.curves['c'+json.curve].fromBits(json.point)
        	var signing_key = new sjcl.ecc.ecdsa.publicKey(json.curve, point.curve, point)

		var hash = sjcl.hash.sha256.hash(messages[i].body)
		signing_key.verify(hash, JSON.parse(messages[i].signature))
	}
} 
