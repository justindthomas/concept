var signing_key

jQuery(function($) {
	$(window).bind('mousemove', collect)
	sjcl.random.startCollectors()

	$("#new_message").bind('submit', function() { encrypt(); })
	$("#authenticate").bind('click', prepare_signing_key)
});

function get_public_key(uuid) {
	var ret;

	$.ajax({
        	url: "/users/" + uuid + ".json",
		async: false,
      		dataType: "json",
      		success: function(data) {
			ret = data["public_key"]
      		}
    	});

	return ret
}

function encrypt() {
	$("#message_signature").val(JSON.stringify(signing_key.sign(sjcl.hash.sha256.hash($("#message_body").val()))))

	var public_key_str = get_public_key($("#recipient_uuid").val())
	var json = JSON.parse(public_key_str)

	var point = sjcl.ecc.curves['c'+json.curve].fromBits(json.point)
	var public_key = new sjcl.ecc.elGamal.publicKey(json.curve, point.curve, point)

	var symmetric_key = public_key.kem(0)

	var plaintext = $("#message_body").val()

	ciphertext = sjcl.encrypt(symmetric_key.key, plaintext)
	$("#symmetric_key_tag").val(JSON.stringify(symmetric_key.tag))
	$("#message_body").val(ciphertext)
}

function prepare_signing_key() {
	if($("#passphrase").val() == "" || $("#sender_uuid").val() == "") {
		return
	}

	$.ajax({
		url: "/users/" + $("#sender_uuid").val() + ".json",
		async: false,
		dataType: "json",
		success: function(data) {
			decrypt_signing_key(data.encrypted_signing_key)
		}
	});
}

function decrypt_signing_key(key) {
	var encrypted_private_key_str = sjcl.decrypt($('#passphrase').val(), JSON.parse(key))
        var serialized_private_key = JSON.parse(encrypted_private_key_str)

        var bignum = sjcl.bn.fromBits(serialized_private_key.exponent)
        signing_key = new sjcl.ecc.ecdsa.secretKey(serialized_private_key.curve, sjcl.ecc.curves['c'+serialized_private_key.curve], bignum)
	$("#authenticated").text("Signing Key Ready")
}
