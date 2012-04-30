var messages = [];
var message_keys = {};

jQuery(function($) {
  $(window).bind('mousemove', collect)
  sjcl.random.startCollectors()

  $("#encrypt_key").bind('click', encrypt_key)
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
          messages.push({ "id":data[i]["id"], "body":data[i]["body"] })
        }
        if(message_keys[messages[0].id] !== undefined) {
		decrypt_messages();
	}
      }
    });

    $.ajax({
      url: "/users/" + $("#user_uuid").val() + "/message_keys.json",
      dataType: "json",
      success: function(data) {
        for(var i = 0; i < data.length; i++) {
          message_keys[data[i]["message_id"]] = data[i]["encrypted_key"]
        }
	if(messages.length > 0) {
	  decrypt_messages();
	}
      }
    });
  } 

});

function generate_keys() {
  $("#user_public_key").val("generating...")
  var keys = sjcl.ecc.elGamal.generateKeys(384,10)

  var pub = JSON.stringify(keys.pub.serialize())
  var sec = JSON.stringify(keys.sec.serialize())

  $("#user_public_key").val(pub)
  $("#private_key").val(sec)
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
		generate_keys()
        } else {
                $("#entropy").html(progress.toFixed(2))
        }
}

function encrypt_key() {
	var private_key = $('#private_key').val()
	var passphrase = $('#passphrase').val()
	var enc = sjcl.encrypt(passphrase, private_key)
	$('#user_encrypted_private_key').val(JSON.stringify(enc))
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

