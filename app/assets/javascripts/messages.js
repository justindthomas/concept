jQuery(function($) {
	$("#new_message").bind('submit', function() { encrypt(); })
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

