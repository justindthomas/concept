class Message < ActiveRecord::Base
  has_many 	:message_keys
  has_many	:users, :through => :message_keys
end
