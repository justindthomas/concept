class User < ActiveRecord::Base
  has_many      :message_keys
  has_many      :messages, :through => :message_keys
end
